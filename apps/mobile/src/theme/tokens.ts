import { type TextStyle, type ViewStyle } from 'react-native';

export const colors = {
  canvas: '#F4F0E6',
  surface: '#FBF8F0',
  surfaceStrong: '#FFFDF8',
  forest: '#20372B',
  forestDeep: '#162A20',
  moss: '#63745E',
  sage: '#A6B59A',
  sageSoft: '#DDE4D6',
  warmGray: '#756F65',
  warmGraySoft: '#D8D0C2',
  terracotta: '#B9684C',
  danger: '#984B3F',
  success: '#46684D',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
} as const;

export const fontFamilies = {
  displayRegular: 'Oswald_400Regular',
  displayMedium: 'Oswald_500Medium',
  displaySemibold: 'Oswald_600SemiBold',
  displayBold: 'Oswald_700Bold',
  sans: 'WorkSans_400Regular',
  sansMedium: 'WorkSans_500Medium',
  sansSemibold: 'WorkSans_600SemiBold',
  sansBold: 'WorkSans_700Bold',
  editorial: 'Oswald_600SemiBold',
} as const;

export const typography = {
  eyebrow: {
    fontFamily: fontFamilies.displaySemibold,
    fontSize: 12,
    letterSpacing: 1.5,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fontFamilies.displaySemibold,
    fontSize: 38,
    letterSpacing: 0.1,
    lineHeight: 42,
  },
  heading: {
    fontFamily: fontFamilies.displaySemibold,
    fontSize: 24,
    letterSpacing: 0.1,
    lineHeight: 28,
  },
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  label: {
    fontFamily: fontFamilies.sansSemibold,
    fontSize: 15,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
} as const satisfies Record<string, TextStyle>;

export const shadows = {
  card: {
    shadowColor: colors.forestDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  floating: {
    shadowColor: colors.forestDeep,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 10,
  },
} as const satisfies Record<string, ViewStyle>;
