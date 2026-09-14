import { StyleSheet, View } from 'react-native';

import { SocialAuthButton } from '@/src/components/social-auth-button';
import { Text } from '@/src/components/text';
import { colors, spacing } from '@/src/theme/tokens';

export function AuthMethods() {
  return (
    <>
      <View style={styles.socialButtons}>
        <SocialAuthButton icon="logo-apple" label="Continuer avec Apple" />
        <SocialAuthButton icon="logo-google" label="Continuer avec Google" />
      </View>
      <View accessibilityRole="text" style={styles.divider}>
        <View style={styles.line} />
        <Text tone="secondary" variant="caption">
          ou
        </Text>
        <View style={styles.line} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  socialButtons: {
    gap: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  line: {
    height: 1,
    flex: 1,
    backgroundColor: colors.warmGraySoft,
  },
});
