import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, type ComponentProps, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Text } from '@/src/components/text';
import { colors, fontFamilies, radii, spacing } from '@/src/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type FormFieldProps = TextInputProps & {
  compact?: boolean;
  error?: string;
  icon?: IconName;
  label: string;
};

export const FormField = forwardRef<TextInput, FormFieldProps>(
  function FormField(
    {
      compact = false,
      error,
      icon,
      label,
      onBlur,
      onFocus,
      secureTextEntry,
      style,
      ...props
    },
    ref,
  ) {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const canTogglePassword = Boolean(secureTextEntry);

    return (
      <View style={[styles.field, compact && styles.fieldCompact]}>
        <Text variant="label">{label}</Text>
        <View
          style={[
            styles.inputShell,
            compact && styles.inputShellCompact,
            isFocused && styles.inputShellFocused,
            error && styles.inputShellError,
          ]}
        >
          {icon ? <Ionicons color={colors.moss} name={icon} size={20} /> : null}
          <TextInput
            {...props}
            ref={ref}
            accessibilityLabel={props.accessibilityLabel ?? label}
            onBlur={(event) => {
              setIsFocused(false);
              onBlur?.(event);
            }}
            onFocus={(event) => {
              setIsFocused(true);
              onFocus?.(event);
            }}
            placeholderTextColor={colors.warmGray}
            selectionColor={colors.moss}
            secureTextEntry={canTogglePassword && !isPasswordVisible}
            style={[styles.input, compact && styles.inputCompact, style]}
          />
          {canTogglePassword ? (
            <Pressable
              accessibilityLabel={
                isPasswordVisible
                  ? 'Masquer le mot de passe'
                  : 'Afficher le mot de passe'
              }
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => setIsPasswordVisible((value) => !value)}
              style={({ pressed }) => [
                styles.passwordToggle,
                pressed && styles.passwordTogglePressed,
              ]}
            >
              <Ionicons
                color={colors.warmGray}
                name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={21}
              />
            </Pressable>
          ) : null}
        </View>
        {error ? (
          <Text
            accessibilityLiveRegion="polite"
            style={styles.error}
            tone="accent"
            variant="caption"
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  fieldCompact: {
    gap: 6,
  },
  inputShell: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warmGraySoft,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.md,
  },
  inputShellCompact: {
    minHeight: 50,
    paddingHorizontal: 14,
  },
  inputShellFocused: {
    borderColor: colors.moss,
  },
  inputShellError: {
    borderColor: colors.danger,
  },
  input: {
    minWidth: 0,
    minHeight: 52,
    flex: 1,
    paddingVertical: spacing.sm,
    color: colors.forestDeep,
    fontFamily: fontFamilies.sans,
    fontSize: 16,
  },
  inputCompact: {
    minHeight: 48,
    paddingVertical: 10,
  },
  passwordToggle: {
    width: 32,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordTogglePressed: {
    opacity: 0.55,
    transform: [{ scale: 0.94 }],
  },
  error: {
    color: colors.danger,
  },
});
