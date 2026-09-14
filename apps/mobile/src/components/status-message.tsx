import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/src/components/text';
import { colors, radii, spacing } from '@/src/theme/tokens';

type StatusMessageProps = {
  children: ReactNode;
  tone?: 'error' | 'success';
};

export function StatusMessage({
  children,
  tone = 'error',
}: StatusMessageProps) {
  const isError = tone === 'error';

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={isError ? 'alert' : 'text'}
      style={[styles.message, isError ? styles.error : styles.success]}
    >
      <Ionicons
        color={isError ? colors.danger : colors.success}
        name={isError ? 'alert-circle-outline' : 'checkmark-circle-outline'}
        size={20}
      />
      <Text
        style={[
          styles.text,
          { color: isError ? colors.danger : colors.success },
        ]}
        variant="caption"
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  error: {
    backgroundColor: '#F3E1DD',
  },
  success: {
    backgroundColor: colors.sageSoft,
  },
  text: {
    flex: 1,
  },
});
