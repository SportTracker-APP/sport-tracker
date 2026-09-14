import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type PropsWithChildren, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { registerWithPassword } from '@/src/auth';
import {
  getRegistrationError,
  validateEmail,
  validatePassword,
} from '@/src/auth/form-helpers';
import { Button, FormField, StatusMessage, Text } from '@/src/components';
import { colors, fontFamilies, radii, spacing } from '@/src/theme/tokens';

const background = require('../../assets/refuge/la-tournette.webp');
const brandMark = require('../../assets/images/splash-mark.png');

type RegistrationErrors = {
  email?: string;
  firstName?: string;
  password?: string;
};

export default function RegisterScreen() {
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (isSubmitting) {
      return;
    }

    const trimmedFirstName = firstName.trim();
    const nextErrors: RegistrationErrors = {
      firstName:
        trimmedFirstName.length < 2 || trimmedFirstName.length > 30
          ? 'Utilise entre 2 et 30 caractères.'
          : undefined,
      email: validateEmail(email),
      password: validatePassword(password),
    };

    if (nextErrors.firstName || nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      return;
    }

    Keyboard.dismiss();
    setErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      await registerWithPassword({
        email: normalizedEmail,
        firstName: trimmedFirstName,
        password,
      });
      setVerificationEmail(normalizedEmail);
    } catch (error: unknown) {
      setFormError(getRegistrationError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (verificationEmail) {
    return (
      <RegistrationShell
        subtitle="Un dernier geste pour ouvrir ton carnet."
        title="Vérifie ta boîte mail"
      >
        <View style={styles.verificationContent}>
          <View style={styles.verificationIcon}>
            <Ionicons
              color={colors.success}
              name="mail-unread-outline"
              size={30}
            />
          </View>
          <Text align="center" tone="secondary">
            Nous avons envoyé un lien d’activation à cette adresse :
          </Text>
          <View style={styles.emailReceipt}>
            <Text
              align="center"
              maxFontSizeMultiplier={1.25}
              numberOfLines={2}
              style={styles.emailReceiptText}
              variant="label"
            >
              {verificationEmail}
            </Text>
          </View>
          <Text align="center" style={styles.verificationHint} tone="secondary">
            Ouvre le lien reçu dans ton navigateur. Tu pourras ensuite revenir
            te connecter à HOVREN.
          </Text>
          <Button
            label="Revenir à la connexion"
            onPress={() => router.replace('/auth/login')}
            style={styles.confirmationButton}
          />
        </View>
      </RegistrationShell>
    );
  }

  return (
    <RegistrationShell
      subtitle="Commence à garder une trace des sommets qui comptent."
      title="Crée ton carnet"
    >
      <View style={styles.form}>
        {formError ? <StatusMessage>{formError}</StatusMessage> : null}
        <FormField
          autoCapitalize="words"
          autoComplete="name-given"
          compact
          error={errors.firstName}
          label="Prénom"
          maxLength={30}
          onChangeText={(value) => {
            setFirstName(value);
            if (errors.firstName) {
              setErrors((current) => ({ ...current, firstName: undefined }));
            }
          }}
          onSubmitEditing={() => emailRef.current?.focus()}
          placeholder="Ton prénom"
          returnKeyType="next"
          textContentType="givenName"
          value={firstName}
        />
        <FormField
          ref={emailRef}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          compact
          error={errors.email}
          keyboardType="email-address"
          label="Adresse e-mail"
          maxLength={254}
          onChangeText={(value) => {
            setEmail(value);
            if (errors.email) {
              setErrors((current) => ({ ...current, email: undefined }));
            }
          }}
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="toi@exemple.fr"
          returnKeyType="next"
          textContentType="emailAddress"
          value={email}
        />
        <View style={styles.passwordBlock}>
          <FormField
            ref={passwordRef}
            autoCapitalize="none"
            autoComplete="new-password"
            compact
            error={errors.password}
            label="Mot de passe"
            maxLength={72}
            onChangeText={(value) => {
              setPassword(value);
              if (errors.password) {
                setErrors((current) => ({ ...current, password: undefined }));
              }
            }}
            onSubmitEditing={() => void submit()}
            returnKeyType="done"
            secureTextEntry
            textContentType="newPassword"
            value={password}
          />
          {!errors.password ? (
            <Text
              maxFontSizeMultiplier={1.3}
              style={styles.passwordHint}
              tone="secondary"
              variant="caption"
            >
              8 à 72 caractères, avec au moins une lettre et un chiffre.
            </Text>
          ) : null}
        </View>
        <Button
          disabled={isSubmitting}
          label="Créer mon compte"
          loading={isSubmitting}
          loadingLabel="Création…"
          onPress={() => void submit()}
          style={styles.submitButton}
        />
      </View>
      <View style={styles.switchRow}>
        <Text maxFontSizeMultiplier={1.3} tone="secondary">
          Déjà un compte ?
        </Text>
        <Pressable
          accessibilityRole="link"
          disabled={isSubmitting}
          hitSlop={8}
          onPress={() => router.replace('/auth/login')}
          style={({ pressed }) => [
            styles.switchButton,
            pressed && styles.switchButtonPressed,
          ]}
        >
          <Text style={styles.linkText} variant="label">
            Se connecter
          </Text>
        </Pressable>
      </View>
    </RegistrationShell>
  );
}

type RegistrationShellProps = PropsWithChildren<{
  subtitle: string;
  title: string;
}>;

function RegistrationShell({
  children,
  subtitle,
  title,
}: RegistrationShellProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const heroHeight = isCompact
    ? 216
    : Math.min(448, Math.max(340, height * 0.48));

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ImageBackground
            accessibilityLabel="La Tournette dominant le lac d’Annecy"
            imageStyle={styles.heroImage}
            resizeMode="cover"
            source={background}
            style={[styles.hero, { height: heroHeight }]}
          >
            <View pointerEvents="none" style={styles.heroOverlay} />
            <View
              style={[
                styles.heroContent,
                { paddingTop: Math.max(insets.top, spacing.md) },
              ]}
            >
              <View style={styles.topBar}>
                <Pressable
                  accessibilityLabel="Retour"
                  accessibilityRole="button"
                  hitSlop={6}
                  onPress={() => router.back()}
                  style={({ pressed }) => [
                    styles.backButton,
                    pressed && styles.backButtonPressed,
                  ]}
                >
                  <Ionicons
                    color={colors.surfaceStrong}
                    name="chevron-back"
                    size={22}
                  />
                </Pressable>
                <View style={styles.brand}>
                  <Image
                    accessibilityIgnoresInvertColors
                    source={brandMark}
                    style={styles.brandMark}
                  />
                  <Text allowFontScaling={false} style={styles.brandName}>
                    HOVREN
                  </Text>
                </View>
                <View style={styles.topBarSpacer} />
              </View>

              <View style={styles.heroCopy}>
                <Text
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1.2}
                  style={[
                    styles.heroTitle,
                    isCompact && styles.heroTitleCompact,
                  ]}
                  tone="inverse"
                  variant="title"
                >
                  {title}
                </Text>
                <Text
                  maxFontSizeMultiplier={1.25}
                  style={styles.heroSubtitle}
                  tone="inverse"
                >
                  {subtitle}
                </Text>
                <Text maxFontSizeMultiplier={1.1} style={styles.photoCredit}>
                  Guilhem Vellut · CC BY 2.0
                </Text>
              </View>
            </View>
          </ImageBackground>

          <View
            style={[
              styles.panel,
              isCompact && styles.panelCompact,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
          >
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.forestDeep,
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    backgroundColor: colors.forestDeep,
    flexGrow: 1,
  },
  hero: {
    flexShrink: 0,
  },
  heroImage: {
    transform: [{ scale: 1.04 }],
  },
  heroOverlay: {
    backgroundColor: 'rgba(7, 18, 11, 0.28)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 32,
    paddingHorizontal: spacing.lg,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 38, 28, 0.52)',
    borderColor: 'rgba(255, 253, 248, 0.3)',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  backButtonPressed: {
    backgroundColor: 'rgba(16, 38, 28, 0.76)',
    transform: [{ scale: 0.96 }],
  },
  topBarSpacer: {
    height: 42,
    width: 42,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  brandMark: {
    borderRadius: 9,
    height: 30,
    width: 30,
  },
  brandName: {
    color: colors.surfaceStrong,
    fontFamily: fontFamilies.displaySemibold,
    fontSize: 18,
    letterSpacing: 2,
    textShadowColor: 'rgba(4, 13, 8, 0.48)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 7,
  },
  heroCopy: {
    gap: 7,
    maxWidth: 360,
  },
  heroTitle: {
    fontFamily: fontFamilies.displaySemibold,
    fontSize: 36,
    letterSpacing: 0.1,
    lineHeight: 39,
    textShadowColor: 'rgba(4, 13, 8, 0.68)',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 12,
  },
  heroTitleCompact: {
    fontSize: 32,
    lineHeight: 35,
  },
  heroSubtitle: {
    color: 'rgba(255, 253, 248, 0.9)',
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    textShadowColor: 'rgba(4, 13, 8, 0.74)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 7,
  },
  photoCredit: {
    alignSelf: 'flex-end',
    color: 'rgba(255, 253, 248, 0.66)',
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    lineHeight: 12,
  },
  panel: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flexGrow: 1,
    marginTop: -42,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  panelCompact: {
    paddingTop: spacing.md,
  },
  form: {
    gap: 11,
  },
  passwordBlock: {
    gap: 6,
  },
  passwordHint: {
    color: colors.warmGray,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: spacing.xxs,
  },
  submitButton: {
    backgroundColor: colors.terracotta,
    borderRadius: 16,
    minHeight: 52,
    shadowColor: colors.forestDeep,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 2,
    minHeight: 44,
  },
  switchButton: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.xs,
  },
  switchButtonPressed: {
    opacity: 0.58,
  },
  linkText: {
    color: colors.forest,
    textDecorationLine: 'underline',
  },
  verificationContent: {
    alignItems: 'center',
    flexGrow: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    marginHorizontal: 'auto',
    maxWidth: 380,
    paddingBottom: 0,
    paddingTop: spacing.xl,
    width: '100%',
  },
  verificationIcon: {
    alignItems: 'center',
    backgroundColor: colors.sageSoft,
    borderRadius: radii.lg,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  emailReceipt: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.sage,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  emailReceiptText: {
    flex: 1,
  },
  verificationHint: {
    maxWidth: 330,
  },
  confirmationButton: {
    alignSelf: 'stretch',
    borderRadius: 16,
    marginTop: spacing.xs,
    minHeight: 52,
  },
});
