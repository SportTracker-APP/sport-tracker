import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, StatusMessage, Text } from '@/src/components';
import { useOnboarding } from '@/src/onboarding';
import { colors, radii, spacing } from '@/src/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

const SLIDES: readonly {
  body: string;
  eyebrow: string;
  icon: IconName;
  title: string;
}[] = [
  {
    body: 'Trouve les sommets qui donnent envie de partir, près de toi comme plus loin.',
    eyebrow: 'Découvrir',
    icon: 'compass-outline',
    title: 'Chaque sommet mérite une place dans ton histoire.',
  },
  {
    body: 'Rassemble tes sorties, tes souvenirs et les détails qui rendent chaque aventure unique.',
    eyebrow: 'Garder une trace',
    icon: 'book-outline',
    title: 'Ton carnet, toujours avec toi.',
  },
  {
    body: 'Observe le chemin parcouru et avance à ton rythme, sommet après sommet.',
    eyebrow: 'Progresser',
    icon: 'trending-up-outline',
    title: 'Regarde jusqu’où tu es allé.',
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useOnboarding();
  const { height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const slide = SLIDES[currentIndex]!;
  const isLastSlide = currentIndex === SLIDES.length - 1;
  const isCompact = height < 700;

  async function finishOnboarding() {
    if (isCompleting) {
      return;
    }

    setError(null);
    setIsCompleting(true);

    try {
      await completeOnboarding();
    } catch {
      setError('Impossible d’enregistrer ce choix. Réessaie dans un instant.');
    } finally {
      setIsCompleting(false);
    }
  }

  function goNext() {
    if (isLastSlide) {
      void finishOnboarding();
      return;
    }

    setCurrentIndex((index) => Math.min(index + 1, SLIDES.length - 1));
  }

  return (
    <SafeAreaView
      edges={['top', 'right', 'bottom', 'left']}
      style={styles.safeArea}
    >
      <View style={[styles.container, isCompact && styles.containerCompact]}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image
              accessibilityIgnoresInvertColors
              source={require('../assets/images/splash-mark.png')}
              style={styles.brandMark}
            />
            <Text style={styles.brandName} variant="label">
              HOVREN
            </Text>
          </View>
          {!isLastSlide ? (
            <Pressable
              accessibilityRole="button"
              disabled={isCompleting}
              hitSlop={8}
              onPress={() => void finishOnboarding()}
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.skipButtonPressed,
              ]}
            >
              <Text tone="secondary" variant="label">
                Passer
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.content}>
          <View
            style={[styles.iconShell, isCompact && styles.iconShellCompact]}
          >
            <Ionicons
              color={colors.forest}
              name={slide.icon}
              size={isCompact ? 38 : 46}
            />
          </View>
          <Text tone="accent" variant="eyebrow">
            {slide.eyebrow}
          </Text>
          <Text
            style={[styles.title, isCompact && styles.titleCompact]}
            variant="title"
          >
            {slide.title}
          </Text>
          <Text style={styles.body} tone="secondary">
            {slide.body}
          </Text>
        </View>

        <View style={styles.footer}>
          {error ? <StatusMessage>{error}</StatusMessage> : null}
          <View
            accessibilityLabel={`Étape ${currentIndex + 1} sur ${SLIDES.length}`}
            accessibilityRole="progressbar"
            accessibilityValue={{
              max: SLIDES.length,
              min: 1,
              now: currentIndex + 1,
              text: `Étape ${currentIndex + 1} sur ${SLIDES.length}`,
            }}
            style={styles.progress}
          >
            {SLIDES.map((item, index) => (
              <View
                key={item.eyebrow}
                style={[styles.dot, index === currentIndex && styles.dotActive]}
              />
            ))}
          </View>
          <Button
            label={isLastSlide ? 'Commencer' : 'Suivant'}
            loading={isCompleting}
            loadingLabel="Ouverture…"
            onPress={goNext}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  containerCompact: {
    paddingVertical: spacing.sm,
  },
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
  },
  brandName: {
    letterSpacing: 1.4,
  },
  skipButton: {
    minWidth: 64,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipButtonPressed: {
    opacity: 0.58,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  iconShell: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.sageSoft,
    marginBottom: spacing.xxl,
  },
  iconShellCompact: {
    width: 72,
    height: 72,
    marginBottom: spacing.lg,
  },
  title: {
    maxWidth: 430,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  titleCompact: {
    fontSize: 31,
    lineHeight: 37,
  },
  body: {
    maxWidth: 410,
  },
  footer: {
    gap: spacing.lg,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.warmGraySoft,
  },
  dotActive: {
    width: 30,
    backgroundColor: colors.forest,
  },
});
