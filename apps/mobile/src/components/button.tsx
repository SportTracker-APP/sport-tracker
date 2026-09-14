import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
} from 'react-native';

import { Text } from '@/src/components/text';
import { colors, radii, spacing } from '@/src/theme/tokens';

type ButtonVariant = 'primary' | 'secondary';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  loading?: boolean;
  loadingLabel?: string;
  variant?: ButtonVariant;
};

export function Button({
  accessibilityState,
  disabled,
  label,
  loading = false,
  loadingLabel = 'Chargement…',
  style,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      {...props}
      accessibilityLabel={loading ? loadingLabel : label}
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        busy: loading,
        disabled: isDisabled,
      }}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        state.pressed && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            color={isPrimary ? colors.white : colors.forest}
            size="small"
          />
        ) : null}
        <Text tone={isPrimary ? 'inverse' : 'primary'} variant="label">
          {loading ? loadingLabel : label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
  },
  primary: {
    backgroundColor: colors.forest,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.sage,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
