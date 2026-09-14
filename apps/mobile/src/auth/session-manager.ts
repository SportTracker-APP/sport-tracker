import {
  ApiError,
  registerUnauthorizedHandler,
  setApiAccessToken,
} from '@/src/api/client';
import {
  getCurrentUser,
  loginWithPassword,
  logoutMobileSession,
  refreshMobileSession,
} from '@/src/auth/auth-api';
import type {
  AuthUser,
  MobileSession,
  PasswordCredentials,
} from '@/src/auth/contracts';
import {
  clearRefreshToken,
  readRefreshToken,
  writeRefreshToken,
} from '@/src/auth/secure-session-storage';

export type AuthState = {
  error: string | null;
  status: 'anonymous' | 'authenticated' | 'error' | 'restoring';
  user: AuthUser | null;
};

type AuthStateListener = () => void;

const INITIAL_STATE: AuthState = {
  error: null,
  status: 'restoring',
  user: null,
};

class SessionManager {
  private state = INITIAL_STATE;
  private readonly listeners = new Set<AuthStateListener>();
  private refreshPromise: Promise<MobileSession | null> | null = null;
  private restorePromise: Promise<void> | null = null;
  private operationVersion = 0;

  constructor() {
    registerUnauthorizedHandler(async () => {
      try {
        return (await this.refreshSession())?.accessToken ?? null;
      } catch {
        return null;
      }
    });
  }

  readonly subscribe = (listener: AuthStateListener): (() => void) => {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = (): AuthState => this.state;

  restoreSession(): Promise<void> {
    if (!this.restorePromise) {
      this.restorePromise = this.performRestore().finally(() => {
        this.restorePromise = null;
      });
    }

    return this.restorePromise;
  }

  async signIn(credentials: PasswordCredentials): Promise<void> {
    const operationVersion = ++this.operationVersion;
    const session = await loginWithPassword(credentials);

    await this.applySession(session, operationVersion);
  }

  async signOut(): Promise<void> {
    ++this.operationVersion;
    const refreshToken = await readRefreshToken();

    setApiAccessToken(null);
    await clearRefreshToken();
    this.setState({ error: null, status: 'anonymous', user: null });

    if (refreshToken) {
      try {
        await logoutMobileSession(refreshToken);
      } catch {
        // Local logout must succeed even when the API is unreachable.
      }
    }
  }

  refreshSession(): Promise<MobileSession | null> {
    if (!this.refreshPromise) {
      const operationVersion = this.operationVersion;

      this.refreshPromise = this.performRefresh(operationVersion).finally(
        () => {
          this.refreshPromise = null;
        },
      );
    }

    return this.refreshPromise;
  }

  async reloadUser(): Promise<AuthUser> {
    const user = await getCurrentUser();
    this.setState({ error: null, status: 'authenticated', user });

    return user;
  }

  private async performRestore(): Promise<void> {
    this.setState({ error: null, status: 'restoring', user: null });

    try {
      await this.refreshSession();
    } catch {
      // refreshSession publishes either an anonymous or recoverable error state.
    }
  }

  private async performRefresh(
    operationVersion: number,
  ): Promise<MobileSession | null> {
    const refreshToken = await readRefreshToken();

    if (!refreshToken) {
      setApiAccessToken(null);
      this.setState({ error: null, status: 'anonymous', user: null });

      return null;
    }

    try {
      const session = await refreshMobileSession(refreshToken);
      const wasApplied = await this.applySession(session, operationVersion);

      return wasApplied ? session : null;
    } catch (error: unknown) {
      if (this.isRejectedRefreshToken(error)) {
        await this.expireSession(operationVersion);
      } else if (operationVersion === this.operationVersion) {
        this.setState({
          error: 'Impossible de restaurer la session pour le moment.',
          status: 'error',
          user: this.state.user,
        });
      }

      throw error;
    }
  }

  private async applySession(
    session: MobileSession,
    operationVersion: number,
  ): Promise<boolean> {
    if (operationVersion !== this.operationVersion) {
      return false;
    }

    await writeRefreshToken(session.refreshToken);

    if (operationVersion !== this.operationVersion) {
      await clearRefreshToken();
      return false;
    }

    setApiAccessToken(session.accessToken);
    this.setState({ error: null, status: 'authenticated', user: session.user });

    return true;
  }

  private async expireSession(operationVersion: number): Promise<void> {
    if (operationVersion !== this.operationVersion) {
      return;
    }

    ++this.operationVersion;
    setApiAccessToken(null);
    await clearRefreshToken();
    this.setState({ error: null, status: 'anonymous', user: null });
  }

  private isRejectedRefreshToken(error: unknown): boolean {
    return (
      error instanceof ApiError &&
      (error.status === 400 || error.status === 401)
    );
  }

  private setState(state: AuthState): void {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }
}

export const sessionManager = new SessionManager();
