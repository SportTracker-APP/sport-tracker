import * as Linking from 'expo-linking';

import type { MobileOAuthProvider } from '@/src/auth/contracts';

export const MOBILE_OAUTH_CALLBACK_PATH = 'auth/callback';
export const MOBILE_OAUTH_PROVIDERS: readonly MobileOAuthProvider[] = [
  'google',
  'apple',
];

export function getMobileOAuthRedirectUrl(): string {
  return Linking.createURL(MOBILE_OAUTH_CALLBACK_PATH);
}
