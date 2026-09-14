import {
  Text as NativeText,
  type StyleProp,
  type TextProps as NativeTextProps,
  type TextStyle,
} from 'react-native';

import { colors, typography } from '@/src/theme/tokens';

type TextVariant = keyof typeof typography;
type TextTone = 'primary' | 'secondary' | 'accent' | 'inverse';

const tones: Record<TextTone, string> = {
  primary: colors.forest,
  secondary: colors.warmGray,
  accent: colors.terracotta,
  inverse: colors.white,
};

export type TextProps = NativeTextProps & {
  align?: TextStyle['textAlign'];
  tone?: TextTone;
  variant?: TextVariant;
  style?: StyleProp<TextStyle>;
};

export function Text({
  align,
  children,
  style,
  tone = 'primary',
  variant = 'body',
  ...props
}: TextProps) {
  return (
    <NativeText
      {...props}
      style={[typography[variant], { color: tones[tone], textAlign: align }, style]}
    >
      {children}
    </NativeText>
  );
}
