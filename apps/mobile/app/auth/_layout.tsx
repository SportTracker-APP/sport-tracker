import { Stack } from 'expo-router';

import { colors } from '@/src/theme/tokens';

export default function AuthLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.canvas },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="callback" />
    </Stack>
  );
}
