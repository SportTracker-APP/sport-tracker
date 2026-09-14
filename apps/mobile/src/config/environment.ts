const DEVELOPMENT_API_URL = 'http://localhost:4000';
const DEVELOPMENT_WEB_URL = 'http://localhost:3000';
const PRODUCTION_WEB_URL = 'https://hovren.fr';

function normalizePublicUrl(value: string, variableName: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid absolute URL.`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${variableName} must use HTTP or HTTPS.`);
  }

  if (!__DEV__ && url.protocol !== 'https:') {
    throw new Error(`${variableName} must use HTTPS outside development.`);
  }

  return url.toString().replace(/\/$/, '');
}

export function getApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    return normalizePublicUrl(configuredUrl, 'EXPO_PUBLIC_API_URL');
  }

  if (__DEV__) {
    return DEVELOPMENT_API_URL;
  }

  throw new Error('EXPO_PUBLIC_API_URL is required for production builds.');
}

export function getWebBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_WEB_URL?.trim();

  if (configuredUrl) {
    return normalizePublicUrl(configuredUrl, 'EXPO_PUBLIC_WEB_URL');
  }

  return __DEV__ ? DEVELOPMENT_WEB_URL : PRODUCTION_WEB_URL;
}
