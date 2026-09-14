import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'hovren.mobile.refresh-token.v1';
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  keychainService: 'fr.hovren.mobile.auth',
};

export function readRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY, SECURE_STORE_OPTIONS);
}

export function writeRefreshToken(refreshToken: string): Promise<void> {
  return SecureStore.setItemAsync(
    REFRESH_TOKEN_KEY,
    refreshToken,
    SECURE_STORE_OPTIONS,
  );
}

export function clearRefreshToken(): Promise<void> {
  return SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, SECURE_STORE_OPTIONS);
}
