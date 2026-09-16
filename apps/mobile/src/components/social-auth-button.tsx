import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/src/components/text';
import { colors, radii, spacing } from '@/src/theme/tokens';

type SocialAuthButtonProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
};

export function SocialAuthButton({ icon, label }: SocialAuthButtonProps) {
  return (
    <Pressable
      accessibilityHint="Cette option sera disponible prochainement"
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      disabled
      style={styles.button}
    >
      <Ionicons color={colors.forest} name={icon} size={21} />
      <Text style={styles.label} variant="label">
        {label}
      </Text>
      <Text style={styles.soon} tone="secondary" variant="caption">
        À venir
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.warmGraySoft,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.lg,
    opacity: 0.72,
  },
  label: {
    flex: 1,
    marginLeft: spacing.sm,
    textAlign: 'center',
  },
  soon: {
    fontSize: 11,
  },
});
