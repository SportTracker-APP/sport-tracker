import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontFamilies, spacing } from '@/src/theme/tokens';

const background = require('../../../assets/refuge/la-tournette.webp');
const brandMark = require('../../../assets/images/splash-mark.png');

type ProviderButtonProps = {
  icon: 'logo-apple' | 'logo-google';
  label: string;
  provider: 'apple' | 'google';
};

export function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const compact = height < 740;
  const narrow = width < 360;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ImageBackground
        accessibilityLabel="La Tournette dominant le lac d’Annecy"
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
        source={background}
        style={styles.background}
      >
        <View pointerEvents="none" style={styles.imageOverlay} />
        <View
          style={[
            styles.content,
            {
              paddingTop: Math.max(insets.top, spacing.lg) + (compact ? 6 : 16),
            },
          ]}
        >
          <View style={[styles.hero, compact && styles.heroCompact]}>
            <View style={styles.brandRow}>
              <Image
                accessibilityIgnoresInvertColors
                source={brandMark}
                style={styles.brandMark}
              />
              <Text
                accessibilityRole="header"
                allowFontScaling={false}
                style={styles.brand}
              >
                HOVREN
              </Text>
            </View>

            <View style={styles.promise}>
              <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={1.25}
                style={[
                  styles.title,
                  compact && styles.titleCompact,
                  narrow && styles.titleNarrow,
                ]}
              >
                Retrouve ton carnet de sommets
              </Text>
              <Text maxFontSizeMultiplier={1.35} style={styles.subtitle}>
                Tes sorties, tes sommets et tes souvenirs t’attendent.
              </Text>
            </View>
          </View>

          <Text maxFontSizeMultiplier={1.2} style={styles.credit}>
            Guilhem Vellut · CC BY 2.0
          </Text>

          <View
            style={[
              styles.actionPanel,
              compact && styles.actionPanelCompact,
              { paddingBottom: Math.max(insets.bottom, spacing.md) },
            ]}
          >
            <View style={styles.buttons}>
              <ProviderButton
                icon="logo-apple"
                label="Continuer avec Apple"
                provider="apple"
              />
              <ProviderButton
                icon="logo-google"
                label="Continuer avec Google"
                provider="google"
              />
              <Pressable
                accessibilityHint="Ouvre la création de compte par e-mail"
                accessibilityRole="button"
                onPress={() => router.push('/auth/register')}
                style={({ pressed }) => [
                  styles.providerButton,
                  styles.emailButton,
                  pressed && styles.emailButtonPressed,
                ]}
              >
                <View style={styles.buttonIcon}>
                  <Ionicons
                    color={colors.surfaceStrong}
                    name="mail-outline"
                    size={20}
                  />
                </View>
                <Text maxFontSizeMultiplier={1.2} style={styles.emailButtonLabel}>
                  Continuer avec mon e-mail
                </Text>
                <View style={styles.buttonTrailing}>
                  <Ionicons color={colors.surfaceStrong} name="arrow-forward" size={19} />
                </View>
              </Pressable>
            </View>

            <View style={styles.loginRow}>
              <Text maxFontSizeMultiplier={1.3} style={styles.loginPrompt}>
                Déjà un compte ?
              </Text>
              <Pressable
                accessibilityRole="link"
                hitSlop={8}
                onPress={() => router.push('/auth/login')}
                style={({ pressed }) => [
                  styles.loginLink,
                  pressed && styles.loginLinkPressed,
                ]}
              >
                <Text maxFontSizeMultiplier={1.3} style={styles.loginLinkLabel}>
                  Se connecter
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

function ProviderButton({ icon, label, provider }: ProviderButtonProps) {
  const isApple = provider === 'apple';

  return (
    <Pressable
      accessibilityHint={`${label} sera bientôt disponible`}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      disabled
      style={[
        styles.providerButton,
        isApple ? styles.appleButton : styles.googleButton,
        styles.providerButtonDisabled,
      ]}
    >
      <View style={styles.buttonIcon}>
        <Ionicons
          color={isApple ? colors.white : '#4285F4'}
          name={icon}
          size={22}
        />
      </View>
      <Text
        maxFontSizeMultiplier={1.2}
        style={isApple ? styles.appleButtonLabel : styles.googleButtonLabel}
      >
        {label}
      </Text>
      <View style={styles.unavailableSlot}>
        <Text
          allowFontScaling={false}
          style={isApple ? styles.unavailableLight : styles.unavailableDark}
        >
          À venir
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.forestDeep,
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    transform: [{ scale: 1.08 }, { translateY: -28 }],
  },
  imageOverlay: {
    backgroundColor: 'rgba(7, 16, 10, 0.18)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  heroCompact: {
    paddingBottom: spacing.xs,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  brandMark: {
    borderRadius: 10,
    height: 34,
    width: 34,
  },
  brand: {
    color: colors.surfaceStrong,
    fontFamily: fontFamilies.displaySemibold,
    fontSize: 19,
    letterSpacing: 2.3,
    textShadowColor: 'rgba(8, 25, 18, 0.34)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 8,
  },
  promise: {
    gap: 9,
    maxWidth: 360,
  },
  title: {
    color: colors.surfaceStrong,
    fontFamily: fontFamilies.displaySemibold,
    fontSize: 40,
    letterSpacing: 0.1,
    lineHeight: 43,
    textShadowColor: 'rgba(4, 13, 8, 0.72)',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 14,
  },
  titleCompact: {
    fontSize: 36,
    lineHeight: 39,
  },
  titleNarrow: {
    fontSize: 34,
    lineHeight: 37,
  },
  subtitle: {
    color: 'rgba(255, 253, 248, 0.88)',
    fontFamily: fontFamilies.sansSemibold,
    fontSize: 14,
    letterSpacing: 0.05,
    lineHeight: 20,
    textShadowColor: 'rgba(8, 25, 18, 0.7)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 8,
  },
  credit: {
    alignSelf: 'flex-end',
    color: 'rgba(255, 253, 248, 0.72)',
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    marginBottom: spacing.xs,
    marginHorizontal: spacing.xl,
    textShadowColor: 'rgba(8, 25, 18, 0.75)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 5,
  },
  actionPanel: {
    backgroundColor: 'rgba(17, 39, 29, 0.97)',
    borderColor: 'rgba(255, 253, 248, 0.12)',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderTopWidth: 1,
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingTop: 20,
    shadowColor: '#000000',
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
  actionPanelCompact: {
    paddingTop: 16,
  },
  buttons: {
    gap: 9,
  },
  providerButton: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    minHeight: 56,
    paddingHorizontal: spacing.sm,
  },
  providerButtonDisabled: {
    opacity: 0.88,
  },
  buttonIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
  },
  buttonTrailing: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: 24,
  },
  appleButton: {
    backgroundColor: '#050505',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: colors.surfaceStrong,
    borderColor: 'rgba(22, 42, 32, 0.10)',
    borderWidth: 1,
  },
  emailButton: {
    backgroundColor: colors.terracotta,
    shadowColor: '#050C08',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  emailButtonPressed: {
    backgroundColor: '#A95D45',
    transform: [{ scale: 0.988 }],
  },
  appleButtonLabel: {
    color: colors.white,
    flex: 1,
    fontFamily: fontFamilies.sansSemibold,
    fontSize: 14,
    lineHeight: 20,
  },
  googleButtonLabel: {
    color: colors.forestDeep,
    flex: 1,
    fontFamily: fontFamilies.sansSemibold,
    fontSize: 14,
    lineHeight: 20,
  },
  emailButtonLabel: {
    color: colors.surfaceStrong,
    flex: 1,
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
    lineHeight: 20,
  },
  unavailableSlot: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: 44,
  },
  unavailableLight: {
    color: 'rgba(255, 255, 255, 0.52)',
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    letterSpacing: 0.1,
  },
  unavailableDark: {
    color: 'rgba(22, 42, 32, 0.48)',
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    letterSpacing: 0.1,
  },
  loginRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 38,
  },
  loginPrompt: {
    color: 'rgba(255, 253, 248, 0.68)',
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  loginLink: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: spacing.xs,
  },
  loginLinkPressed: {
    opacity: 0.62,
  },
  loginLinkLabel: {
    color: colors.surfaceStrong,
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
});
