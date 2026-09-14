import { getApiBaseUrl } from '@/src/config/environment';

type ApiMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

type ApiRequestOptions = {
  authenticated?: boolean;
  headers?: Readonly<Record<string, string>>;
  json?: unknown;
  method?: ApiMethod;
  retryOnUnauthorized?: boolean;
  signal?: AbortSignal;
};

type UnauthorizedHandler = () => Promise<string | null>;

let accessToken: string | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;
let unauthorizedRecovery: Promise<string | null> | null = null;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(getErrorMessage(status, payload));
    this.name = 'ApiError';
  }
}

function getErrorMessage(status: number, payload: unknown): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;

    if (typeof message === 'string') {
      return message;
    }

    if (
      Array.isArray(message) &&
      message.every((item) => typeof item === 'string')
    ) {
      return message.join('\n');
    }
  }

  return `API request failed with status ${status}.`;
}

async function parseResponse(response: Response): Promise<unknown> {
  const body = await response.text();

  if (!body) {
    return undefined;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

async function recoverUnauthorizedSession(): Promise<string | null> {
  if (!unauthorizedHandler) {
    return null;
  }

  if (!unauthorizedRecovery) {
    unauthorizedRecovery = unauthorizedHandler().finally(() => {
      unauthorizedRecovery = null;
    });
  }

  return unauthorizedRecovery;
}

function buildHeaders(
  options: ApiRequestOptions,
  token: string | null,
): Headers {
  const headers = new Headers(options.headers);

  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.authenticated !== false && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

async function sendRequest(
  path: string,
  options: ApiRequestOptions,
  token: string | null,
): Promise<Response> {
  return fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers: buildHeaders(options, token),
    body: options.json === undefined ? undefined : JSON.stringify(options.json),
    credentials: 'omit',
    signal: options.signal,
  });
}

export function setApiAccessToken(token: string | null): void {
  accessToken = token;
}

export function registerUnauthorizedHandler(
  handler: UnauthorizedHandler,
): () => void {
  unauthorizedHandler = handler;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

export async function apiRequest<T>(
  path: `/${string}`,
  options: ApiRequestOptions = {},
): Promise<T> {
  let response = await sendRequest(path, options, accessToken);

  if (
    response.status === 401 &&
    options.authenticated !== false &&
    options.retryOnUnauthorized !== false
  ) {
    const nextAccessToken = await recoverUnauthorizedSession();

    if (nextAccessToken) {
      response = await sendRequest(path, options, nextAccessToken);
    }
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }

  return payload as T;
}
