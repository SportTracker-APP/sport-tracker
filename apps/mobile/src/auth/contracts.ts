export type AuthRole = 'ADMIN' | 'USER';

export type AuthUser = {
  email: string;
  firstName: string;
  id: string;
  role: AuthRole;
};

export type PasswordCredentials = {
  email: string;
  password: string;
};

export type RegistrationCredentials = PasswordCredentials & {
  firstName: string;
};

export type RegistrationResponse = {
  message: string;
};

export type MobileSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type MobileOAuthProvider = 'apple' | 'google';
