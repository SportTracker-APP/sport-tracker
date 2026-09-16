import { Oswald_400Regular } from '@expo-google-fonts/oswald/400Regular';
import { Oswald_500Medium } from '@expo-google-fonts/oswald/500Medium';
import { Oswald_600SemiBold } from '@expo-google-fonts/oswald/600SemiBold';
import { Oswald_700Bold } from '@expo-google-fonts/oswald/700Bold';
import { WorkSans_400Regular } from '@expo-google-fonts/work-sans/400Regular';
import { WorkSans_500Medium } from '@expo-google-fonts/work-sans/500Medium';
import { WorkSans_600SemiBold } from '@expo-google-fonts/work-sans/600SemiBold';
import { WorkSans_700Bold } from '@expo-google-fonts/work-sans/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/src/auth';
import { OnboardingProvider, useOnboarding } from '@/src/onboarding';
import { colors, fontFamilies } from '@/src/theme/tokens';

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 280, fade: true });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Oswald_400Regular,
    Oswald_500Medium,
    Oswald_600SemiBold,
    Oswald_700Bold,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
  });

  return (
    <AuthProvider>
      <OnboardingProvider>
        <SafeAreaProvider>
          <RootNavigator fontsReady={fontsLoaded || Boolean(fontError)} />
        </SafeAreaProvider>
      </OnboardingProvider>
    </AuthProvider>
  );
}

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const auth = useAuth();
  const onboarding = useOnboarding();
  const [hasBooted, setHasBooted] = useState(false);
  const isReady =
    fontsReady && auth.status !== 'restoring' && onboarding.status !== 'loading';

  useEffect(() => {
    if (!isReady || hasBooted) {
      return;
    }

    const frame = requestAnimationFrame(() => setHasBooted(true));

    return () => cancelAnimationFrame(frame);
  }, [hasBooted, isReady]);

  useEffect(() => {
    if (hasBooted) {
      void SplashScreen.hideAsync();
    }
  }, [hasBooted]);

  if (!hasBooted) {
    return null;
  }

  const isAuthenticated = auth.status === 'authenticated';
  const hasCompletedOnboarding = onboarding.status === 'complete';

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.canvas },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.canvas },
          headerTintColor: colors.forest,
          headerTitleStyle: {
            fontFamily: fontFamilies.displaySemibold,
          },
        }}
      >
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="secondary"
            options={{ presentation: 'modal', title: 'Chemin secondaire' }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated && !hasCompletedOnboarding}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated && hasCompletedOnboarding}>
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
