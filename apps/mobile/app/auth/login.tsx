import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Keyboard,
  Linking,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/src/auth';
import { getLoginError, validateEmail } from '@/src/auth/form-helpers';
import {
  AuthMethods,
  AuthScreen,
  Button,
  FormField,
  StatusMessage,
  Text,
} from '@/src/components';
import { getWebBaseUrl } from '@/src/config/environment';
import { colors, spacing } from '@/src/theme/tokens';

type LoginErrors = {
  email?: string;
  password?: string;
};

export default function LoginScreen() {
  const auth = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (isSubmitting) {
      return;
    }

    const nextErrors: LoginErrors = {
      email: validateEmail(email),
      password: password ? undefined : 'Renseigne ton mot de passe.',
    };

    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      return;
    }

    Keyboard.dismiss();
    setErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      await auth.signIn({ email: email.trim().toLowerCase(), password });
    } catch (error: unknown) {
      setFormError(getLoginError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function openForgotPassword() {
    setFormError(null);

    try {
      await Linking.openURL(`${getWebBaseUrl()}/forgot-password`);
    } catch {
      setFormError('Impossible d’ouvrir la page de réinitialisation.');
    }
  }

  return (
    <AuthScreen
      eyebrow="Bon retour"
      subtitle="Retrouve ton histoire et poursuis l’aventure."
      title="Connexion"
    >
      <AuthMethods />
      <View style={styles.form}>
        {formError ? <StatusMessage>{formError}</StatusMessage> : null}
        {auth.status === 'error' && auth.error ? (
          <View style={styles.restoreError}>
            <StatusMessage>{auth.error}</StatusMessage>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => void auth.restoreSession()}
              style={({ pressed }) => [
                styles.inlineButton,
                pressed && styles.linkPressed,
              ]}
            >
              <Text style={styles.linkText} variant="label">
                Réessayer
              </Text>
            </Pressable>
          </View>
        ) : null}
        <FormField
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          error={errors.email}
          keyboardType="email-address"
          label="Email"
          maxLength={254}
          onChangeText={(value) => {
            setEmail(value);
            if (errors.email)
              setErrors((current) => ({ ...current, email: undefined }));
          }}
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="toi@exemple.fr"
          returnKeyType="next"
          textContentType="emailAddress"
          value={email}
        />
        <View>
          <FormField
            ref={passwordRef}
            autoCapitalize="none"
            autoComplete="current-password"
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
            textContentType="password"
            value={password}
          />
          <Pressable
            accessibilityRole="link"
            disabled={isSubmitting}
            onPress={() => void openForgotPassword()}
            style={({ pressed }) => [
              styles.forgotButton,
              pressed && styles.linkPressed,
            ]}
          >
            <Text style={styles.linkText} variant="caption">
              Mot de passe oublié ?
            </Text>
          </Pressable>
        </View>
        <Button
          label="Se connecter"
          loading={isSubmitting}
          loadingLabel="Connexion…"
          onPress={() => void submit()}
        />
      </View>
      <View style={styles.switchRow}>
        <Text tone="secondary">Pas encore de compte ?</Text>
        <Pressable
          accessibilityRole="link"
          disabled={isSubmitting}
          onPress={() => router.push('/auth/register')}
          style={({ pressed }) => [
            styles.switchButton,
            pressed && styles.linkPressed,
          ]}
        >
          <Text style={styles.linkText} variant="label">
            S’inscrire
          </Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  restoreError: {
    gap: spacing.xs,
  },
  forgotButton: {
    minHeight: 44,
    alignSelf: 'flex-end',
    justifyContent: 'center',
  },
  inlineButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  linkText: {
    color: colors.forest,
    textDecorationLine: 'underline',
  },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  switchButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  linkPressed: {
    opacity: 0.58,
  },
});
