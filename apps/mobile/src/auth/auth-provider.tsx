import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

import type { AuthUser, PasswordCredentials } from '@/src/auth/contracts';
import { sessionManager, type AuthState } from '@/src/auth/session-manager';

type AuthContextValue = AuthState & {
  reloadUser: () => Promise<AuthUser>;
  restoreSession: () => Promise<void>;
  signIn: (credentials: PasswordCredentials) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const state = useSyncExternalStore(
    sessionManager.subscribe,
    sessionManager.getSnapshot,
    sessionManager.getSnapshot,
  );

  useEffect(() => {
    void sessionManager.restoreSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      reloadUser: () => sessionManager.reloadUser(),
      restoreSession: () => sessionManager.restoreSession(),
      signIn: (credentials) => sessionManager.signIn(credentials),
      signOut: () => sessionManager.signOut(),
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
