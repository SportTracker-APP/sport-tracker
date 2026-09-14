import type { PropsWithChildren } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/src/components/text';
import { colors, radii, spacing } from '@/src/theme/tokens';

type AuthScreenProps = PropsWithChildren<{
  eyebrow: string;
  subtitle: string;
  title: string;
}>;

export function AuthScreen({
  children,
  eyebrow,
  subtitle,
  title,
}: AuthScreenProps) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;

  return (
    <SafeAreaView
      edges={['top', 'right', 'bottom', 'left']}
      style={styles.safeArea}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[
            styles.scrollContent,
            isCompact && styles.scrollContentCompact,
          ]}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.brand}>
              <Image
                accessibilityIgnoresInvertColors
                source={require('../../assets/images/splash-mark.png')}
                style={styles.brandMark}
              />
              <Text style={styles.brandName} variant="label">
                HOVREN
              </Text>
            </View>
            <View style={styles.header}>
              <Text tone="accent" variant="eyebrow">
                {eyebrow}
              </Text>
              <Text style={styles.title} variant="title">
                {title}
              </Text>
              <Text tone="secondary">{subtitle}</Text>
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  scrollContentCompact: {
    justifyContent: 'flex-start',
    paddingVertical: spacing.md,
  },
  container: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: radii.sm,
  },
  brandName: {
    letterSpacing: 1.4,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
});
