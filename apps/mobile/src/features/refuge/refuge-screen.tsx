import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import {
  Animated,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/auth';
import { Button, Text } from '@/src/components';
import { getRefugeSummitImage } from '@/src/features/refuge/refuge-images';
import {
  createRefugeViewModel,
  type RefugeGoalProgress,
  type RefugeHighlight,
  type RefugeRecentActivity,
  type RefugeViewModel,
} from '@/src/features/refuge/refuge-model';
import { useRefugeData } from '@/src/features/refuge/use-refuge-data';
import {
  colors,
  fontFamilies,
  radii,
  shadows,
  spacing,
} from '@/src/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

export default function RefugeScreen() {
  const { user } = useAuth();
  const data = useRefugeData();
  const viewModel = useMemo(
    () =>
      createRefugeViewModel({
        activities: data.activities,
        badges: data.badges,
        goals: data.goals,
        summits: data.summits,
      }),
    [data.activities, data.badges, data.goals, data.summits],
  );
  const firstName = user?.firstName?.trim() || 'aventurier';

  return <RefugeView data={data} firstName={firstName} viewModel={viewModel} />;
}

export type RefugeViewProps = {
  data: ReturnType<typeof useRefugeData>;
  firstName: string;
  viewModel: RefugeViewModel;
};

export function RefugeView({ data, firstName, viewModel }: RefugeViewProps) {
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 370 ? spacing.md : spacing.lg;

  return (
    <SafeAreaView edges={['top', 'right', 'left']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: horizontalPadding },
        ]}
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            colors={[colors.forest]}
            onRefresh={() => void data.refresh()}
            refreshing={data.isRefreshing}
            tintColor={colors.forest}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={styles.introTopline}>
            <Text tone="accent" variant="eyebrow">
              Refuge
            </Text>
            <View
              accessible
              accessibilityLabel={`Profil de ${firstName}`}
              style={styles.avatar}
            >
              <Text style={styles.avatarText} variant="label">
                {firstName.slice(0, 1).toLocaleUpperCase('fr')}
              </Text>
            </View>
          </View>
          <Text
            maxFontSizeMultiplier={1.35}
            style={styles.introTitle}
            variant="title"
          >
            Bonjour, {firstName}.
          </Text>
          <Text style={styles.introCopy} tone="secondary">
            {viewModel.welcomeMessage}
          </Text>
        </View>

        {data.errors.length > 0 && data.hasAnyData ? (
          <PartialError onRetry={() => void data.retry()} />
        ) : null}

        {data.isLoading && !data.hasAnyData ? (
          <RefugeSkeleton />
        ) : !data.hasAnyData ? (
          <FullError onRetry={() => void data.retry()} />
        ) : (
          <View style={styles.sections}>
            <CarnetProgress
              activityCount={viewModel.activityCount}
              badgeCount={viewModel.badgeCount}
              catalogCount={viewModel.catalogCount}
              progress={viewModel.carnetProgress}
              summitCount={viewModel.summitCount}
            />
            <HighlightSection
              canConfirmEmpty={
                data.activities !== null && data.summits !== null
              }
              highlight={viewModel.highlight}
            />
            {viewModel.goal ? <GoalCard goal={viewModel.goal} /> : null}
            <RecentSection activities={viewModel.recentActivities} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CarnetProgress({
  activityCount,
  badgeCount,
  catalogCount,
  progress,
  summitCount,
}: {
  activityCount: number | null;
  badgeCount: number | null;
  catalogCount: number | null;
  progress: number | null;
  summitCount: number | null;
}) {
  if (progress === null || summitCount === null || catalogCount === null) {
    return (
      <UnavailablePanel message="La progression de ton carnet n’est pas disponible." />
    );
  }

  return (
    <Pressable
      accessibilityHint="Ouvre le Carnet pour consulter ta progression"
      accessibilityLabel="Consulter la progression du carnet"
      accessibilityRole="button"
      android_ripple={{ color: '#365043' }}
      onPress={() =>
        router.navigate({
          pathname: '/journal',
          params: { section: 'progress', activity: undefined },
        })
      }
      style={({ pressed }) => [styles.progressCard, pressed && styles.pressed]}
    >
      <View style={styles.progressDecoration} />
      <View style={styles.progressHeader}>
        <View>
          <Text style={styles.onForestMuted} variant="eyebrow">
            Ton carnet
          </Text>
          <Text
            maxFontSizeMultiplier={1.25}
            style={styles.progressValue}
            variant="title"
          >
            {progress} %
          </Text>
        </View>
        <View style={styles.progressAction}>
          <Text style={styles.progressActionText} variant="label">
            Voir
          </Text>
          <Ionicons color={colors.forest} name="chevron-forward" size={17} />
        </View>
      </View>
      <Text style={styles.onForest}>
        {summitCount} sommets validés sur {catalogCount}
      </Text>
      <ProgressBar
        accessibilityLabel="Progression du carnet"
        dark
        value={progress}
      />
      {catalogCount === 0 ? (
        <Text style={styles.progressEmpty}>
          Le catalogue est prêt à accueillir tes premières découvertes.
        </Text>
      ) : null}
      <View style={styles.metrics}>
        <Metric icon="navigate-outline" label="Sorties" value={activityCount} />
        <View style={styles.metricDivider} />
        <Metric icon="flag-outline" label="Sommets" value={summitCount} />
        <View style={styles.metricDivider} />
        <Metric icon="ribbon-outline" label="Badges" value={badgeCount} />
      </View>
    </Pressable>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: number | null;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label} : ${value ?? 'indisponible'}`}
      style={styles.metric}
    >
      <Ionicons color={colors.sage} name={icon} size={18} />
      <Text
        maxFontSizeMultiplier={1.2}
        style={styles.metricValue}
        variant="heading"
      >
        {value ?? '—'}
      </Text>
      <Text
        maxFontSizeMultiplier={1.2}
        style={styles.metricLabel}
        variant="caption"
      >
        {label}
      </Text>
    </View>
  );
}

function HighlightSection({
  canConfirmEmpty,
  highlight,
}: {
  canConfirmEmpty: boolean;
  highlight: RefugeHighlight | null;
}) {
  if (!highlight) {
    if (!canConfirmEmpty) {
      return (
        <View>
          <SectionHeading title="Dernière découverte" />
          <UnavailablePanel message="Ton dernier moment marquant n’est pas disponible." />
        </View>
      );
    }

    return (
      <View>
        <SectionHeading title="Ta prochaine découverte" />
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons
              color={colors.forest}
              name="footsteps-outline"
              size={30}
            />
          </View>
          <Text variant="heading">Ta première trace écrira l’histoire.</Text>
          <Text tone="secondary">
            Explore les sommets ou prépare une sortie pour faire vivre ton
            Refuge.
          </Text>
          <Button
            label="Explorer"
            onPress={() => router.push('/explore')}
            style={styles.emptyButton}
            variant="secondary"
          />
        </View>
      </View>
    );
  }

  const image =
    highlight.kind === 'summit'
      ? getRefugeSummitImage(highlight.summitName)
      : null;
  const eyebrow =
    highlight.kind === 'summit' ? 'Dernière découverte' : 'Dernière sortie';

  return (
    <View>
      <SectionHeading title={eyebrow} />
      <Pressable
        accessibilityHint={
          highlight.kind === 'summit'
            ? 'Ouvre la fiche de ce sommet'
            : 'Ouvre le détail de cette sortie'
        }
        accessibilityLabel={`${eyebrow} : ${highlight.title}`}
        accessibilityRole="button"
        android_ripple={{ color: colors.sageSoft }}
        onPress={() =>
          router.navigate(
            highlight.kind === 'summit'
              ? { pathname: '/explore', params: { summit: highlight.id } }
              : {
                  pathname: '/journal',
                  params: { section: 'activities', activity: highlight.id },
                },
          )
        }
        style={({ pressed }) => [
          styles.highlightCard,
          pressed && styles.pressed,
        ]}
      >
        {image ? (
          <ImageBackground
            accessibilityIgnoresInvertColors
            imageStyle={styles.highlightImage}
            source={image.source}
            style={styles.highlightVisual}
          >
            <View style={styles.imageShade} />
            <Text style={styles.photoCredit} variant="caption">
              {image.credit}
            </Text>
          </ImageBackground>
        ) : (
          <View style={[styles.highlightVisual, styles.highlightFallback]}>
            <View style={styles.fallbackSun} />
            <View style={styles.fallbackMountainBack} />
            <View style={styles.fallbackMountainFront} />
            <Ionicons
              color={colors.surfaceStrong}
              name={highlight.kind === 'summit' ? 'flag' : 'navigate'}
              size={30}
              style={styles.fallbackIcon}
            />
          </View>
        )}
        <View style={styles.highlightCopy}>
          <Text
            maxFontSizeMultiplier={1.3}
            style={styles.highlightTitle}
            variant="heading"
          >
            {highlight.title}
          </Text>
          {highlight.meta.length > 0 ? (
            <Text tone="secondary">{highlight.meta.join(' · ')}</Text>
          ) : null}
          <View style={styles.highlightFooter}>
            <Text tone="secondary" variant="caption">
              {highlight.date}
            </Text>
            <View style={styles.highlightAction}>
              <Text style={styles.highlightActionText} variant="label">
                Voir
              </Text>
              <Ionicons color={colors.forest} name="arrow-forward" size={17} />
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function GoalCard({ goal }: { goal: RefugeGoalProgress }) {
  const isCompact = useWindowDimensions().width < 400;

  return (
    <Pressable
      accessibilityHint="Ouvre les objectifs et la progression dans le Carnet"
      accessibilityLabel={`${goal.title}, ${goal.progress} %`}
      accessibilityRole="button"
      android_ripple={{ color: colors.sageSoft }}
      onPress={() =>
        router.navigate({
          pathname: '/journal',
          params: { section: 'progress', activity: undefined },
        })
      }
      style={({ pressed }) => [
        styles.goalCard,
        isCompact && styles.goalCardCompact,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.goalHeader}>
        <View style={[styles.goalIcon, isCompact && styles.goalIconCompact]}>
          <Ionicons color={colors.terracotta} name="navigate" size={22} />
        </View>
        <View style={styles.goalHeading}>
          <View style={styles.goalEyebrowRow}>
            <Text tone="accent" variant="eyebrow">
              Objectif actif
            </Text>
            <Text style={styles.goalPercent} variant="label">
              {goal.progress} %
            </Text>
          </View>
          <Text
            maxFontSizeMultiplier={1.3}
            style={isCompact ? styles.goalTitleCompact : undefined}
            variant="heading"
          >
            {goal.title}
          </Text>
        </View>
      </View>
      <ProgressBar accessibilityLabel={goal.title} value={goal.progress} />
      <View style={styles.goalFooter}>
        <Text variant="label">
          {goal.currentLabel} / {goal.targetLabel}
        </Text>
        <View style={styles.goalFooterAction}>
          <Text tone="secondary" variant="caption">
            {goal.completed ? 'Objectif atteint' : goal.deadlineLabel}
          </Text>
          <Ionicons color={colors.forest} name="chevron-forward" size={17} />
        </View>
      </View>
    </Pressable>
  );
}

function RecentSection({
  activities,
}: {
  activities: RefugeRecentActivity[] | null;
}) {
  return (
    <View>
      <SectionHeading
        actionLabel={activities?.length ? 'Tout voir' : undefined}
        onAction={() =>
          router.navigate({
            pathname: '/journal',
            params: { section: 'activities', activity: undefined },
          })
        }
        title="Sorties récentes"
      />
      {activities === null ? (
        <UnavailablePanel message="Tes sorties récentes ne sont pas disponibles." />
      ) : activities.length === 0 ? (
        <View style={styles.recentEmpty}>
          <Ionicons color={colors.moss} name="map-outline" size={26} />
          <View style={styles.recentEmptyCopy}>
            <Text variant="label">Aucune sortie enregistrée</Text>
            <Text tone="secondary" variant="caption">
              Ta prochaine aventure apparaîtra ici.
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Ouvrir l’ajout d’une sortie"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.push('/action')}
            style={styles.roundArrow}
          >
            <Ionicons color={colors.surfaceStrong} name="add" size={22} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.recentList}>
          {activities.map((activity, index) => (
            <Pressable
              accessibilityHint="Ouvre le détail de cette sortie"
              accessibilityLabel={`${activity.title}, ${activity.date}`}
              accessibilityRole="button"
              android_ripple={{ color: colors.sageSoft }}
              key={activity.id}
              onPress={() =>
                router.navigate({
                  pathname: '/journal',
                  params: { section: 'activities', activity: activity.id },
                })
              }
              style={({ pressed }) => [
                styles.recentRow,
                index < activities.length - 1 && styles.recentRowBorder,
                pressed && styles.recentRowPressed,
              ]}
            >
              <View style={styles.activityIcon}>
                <Ionicons
                  color={colors.forest}
                  name={getSportIcon(activity.sport)}
                  size={22}
                />
              </View>
              <View style={styles.recentCopy}>
                <Text numberOfLines={2} variant="label">
                  {activity.title}
                </Text>
                <Text numberOfLines={1} tone="secondary" variant="caption">
                  {[activity.date, activity.meta].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <View style={styles.recentAction}>
                <Ionicons
                  color={colors.forest}
                  name="chevron-forward"
                  size={17}
                />
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function SectionHeading({
  actionLabel,
  eyebrow,
  onAction,
  title,
}: {
  actionLabel?: string;
  eyebrow?: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionHeadingCopy}>
        {eyebrow ? (
          <Text tone="accent" variant="eyebrow">
            {eyebrow}
          </Text>
        ) : null}
        <Text
          maxFontSizeMultiplier={1.3}
          style={styles.sectionTitle}
          variant="heading"
        >
          {title}
        </Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onAction}
          style={({ pressed }) => [
            styles.headingAction,
            pressed && styles.pressed,
          ]}
        >
          <Text variant="label">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ProgressBar({
  accessibilityLabel,
  dark = false,
  value,
}: {
  accessibilityLabel: string;
  dark?: boolean;
  value: number;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ max: 100, min: 0, now: safeValue }}
      style={[styles.progressTrack, dark && styles.progressTrackDark]}
    >
      <View
        style={[
          styles.progressFill,
          dark && styles.progressFillDark,
          { width: `${safeValue}%` },
        ]}
      />
    </View>
  );
}

function PartialError({ onRetry }: { onRetry: () => void }) {
  return (
    <View accessibilityRole="alert" style={styles.partialError}>
      <Ionicons color={colors.danger} name="cloud-offline-outline" size={20} />
      <Text style={styles.partialErrorCopy} variant="caption">
        Une partie du carnet est indisponible. Le reste demeure accessible.
      </Text>
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={onRetry}
        style={styles.retryLink}
      >
        <Text style={styles.retryText} variant="label">
          Réessayer
        </Text>
      </Pressable>
    </View>
  );
}

function FullError({ onRetry }: { onRetry: () => void }) {
  return (
    <View accessibilityRole="alert" style={styles.fullError}>
      <View style={styles.errorIcon}>
        <Ionicons
          color={colors.forest}
          name="cloud-offline-outline"
          size={34}
        />
      </View>
      <Text align="center" variant="heading">
        Le sentier s’est interrompu.
      </Text>
      <Text align="center" tone="secondary">
        Impossible de charger ton Refuge. Vérifie ta connexion puis réessaie.
      </Text>
      <Button label="Réessayer" onPress={onRetry} style={styles.retryButton} />
    </View>
  );
}

function UnavailablePanel({ message }: { message: string }) {
  return (
    <View style={styles.unavailablePanel}>
      <Ionicons
        color={colors.warmGray}
        name="cloud-offline-outline"
        size={22}
      />
      <Text style={styles.unavailableCopy} tone="secondary" variant="caption">
        {message}
      </Text>
    </View>
  );
}

function SkeletonBlock({
  opacity,
  style,
}: {
  opacity: Animated.Value;
  style?: StyleProp<ViewStyle>;
}) {
  return <Animated.View style={[styles.skeletonBlock, { opacity }, style]} />;
}

function RefugeSkeleton() {
  const [opacity] = useState(() => new Animated.Value(0.42));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          duration: 700,
          toValue: 0.82,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          duration: 700,
          toValue: 0.42,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View
      accessible
      accessibilityLabel="Chargement du Refuge"
      accessibilityState={{ busy: true }}
      style={styles.skeleton}
    >
      <SkeletonBlock opacity={opacity} style={styles.skeletonHero} />
      <View style={styles.skeletonSection}>
        <SkeletonBlock opacity={opacity} style={styles.skeletonEyebrow} />
        <SkeletonBlock opacity={opacity} style={styles.skeletonTitle} />
        <SkeletonBlock opacity={opacity} style={styles.skeletonCard} />
      </View>
      <View style={styles.skeletonSection}>
        <SkeletonBlock opacity={opacity} style={styles.skeletonEyebrow} />
        <SkeletonBlock opacity={opacity} style={styles.skeletonTitleShort} />
        <SkeletonBlock opacity={opacity} style={styles.skeletonRows} />
      </View>
    </View>
  );
}

function getSportIcon(sport: string): IconName {
  const normalizedSport = sport.toUpperCase();

  if (normalizedSport.includes('CYCL') || normalizedSport === 'MTB') {
    return 'bicycle-outline';
  }
  if (normalizedSport.includes('GYM') || normalizedSport.includes('FITNESS')) {
    return 'barbell-outline';
  }
  if (normalizedSport.includes('RUN') || normalizedSport.includes('TRAIL')) {
    return 'walk-outline';
  }

  return 'footsteps-outline';
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  content: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  intro: { marginBottom: spacing.lg },
  introTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.sage,
    borderRadius: radii.pill,
    backgroundColor: colors.sageSoft,
  },
  avatarText: { color: colors.forestDeep, fontSize: 16 },
  introTitle: { marginBottom: spacing.xs },
  introCopy: { maxWidth: 410 },
  sections: { gap: spacing.xl },
  progressCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.forest,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    ...shadows.card,
  },
  progressDecoration: {
    position: 'absolute',
    top: -70,
    right: -45,
    width: 190,
    height: 190,
    borderWidth: 34,
    borderColor: '#2E4B3A',
    borderRadius: radii.pill,
    opacity: 0.72,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  onForestMuted: { color: colors.sage },
  onForest: { color: colors.surfaceStrong, marginTop: spacing.xs },
  progressValue: {
    color: colors.surfaceStrong,
    fontSize: 44,
    lineHeight: 50,
  },
  progressAction: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.sageSoft,
  },
  progressActionText: { color: colors.forest },
  progressTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: radii.pill,
    backgroundColor: colors.sageSoft,
  },
  progressTrackDark: { marginTop: spacing.sm, backgroundColor: '#3F5949' },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.terracotta,
  },
  progressFillDark: { backgroundColor: colors.surfaceStrong },
  progressEmpty: { color: colors.sage, marginTop: spacing.sm },
  metrics: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#55705F',
  },
  metric: { flex: 1, alignItems: 'center', gap: spacing.xxs },
  metricValue: {
    color: colors.surfaceStrong,
    fontFamily: fontFamilies.editorial,
  },
  metricLabel: { color: colors.sage },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#55705F',
  },
  sectionHeading: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeadingCopy: { flex: 1, gap: spacing.xxs },
  sectionTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
  },
  headingAction: { minHeight: 44, justifyContent: 'center' },
  highlightCard: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmGraySoft,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceStrong,
    ...shadows.card,
  },
  highlightVisual: {
    position: 'relative',
    height: 164,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  highlightImage: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  imageShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(22,42,32,0.16)',
  },
  photoCredit: {
    alignSelf: 'flex-end',
    color: colors.white,
    margin: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(22,42,32,0.64)',
    fontSize: 10,
  },
  highlightFallback: { backgroundColor: colors.sageSoft },
  fallbackSun: {
    position: 'absolute',
    top: 30,
    right: 34,
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    backgroundColor: '#E7CBB7',
  },
  fallbackMountainBack: {
    position: 'absolute',
    bottom: -88,
    left: -15,
    width: 250,
    height: 250,
    transform: [{ rotate: '45deg' }],
    borderRadius: 32,
    backgroundColor: colors.sage,
  },
  fallbackMountainFront: {
    position: 'absolute',
    right: -80,
    bottom: -120,
    width: 280,
    height: 280,
    transform: [{ rotate: '45deg' }],
    borderRadius: 36,
    backgroundColor: colors.moss,
  },
  fallbackIcon: { position: 'absolute', right: spacing.xl, bottom: spacing.lg },
  highlightCopy: { padding: spacing.lg },
  highlightTitle: { marginTop: spacing.xs, marginBottom: spacing.xs },
  highlightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  highlightAction: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.sageSoft,
  },
  highlightActionText: { color: colors.forest },
  goalCard: {
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmGraySoft,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  goalCardCompact: { padding: spacing.md },
  goalHeader: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: '#F3E1D9',
  },
  goalIconCompact: { width: 40, height: 40 },
  goalHeading: { flex: 1, gap: spacing.xxs },
  goalEyebrowRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  goalPercent: { color: colors.terracotta },
  goalTitleCompact: { fontSize: 22, lineHeight: 27 },
  goalFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  goalFooterAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  emptyCard: {
    alignItems: 'flex-start',
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmGraySoft,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceStrong,
    padding: spacing.xl,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.sageSoft,
  },
  emptyButton: { alignSelf: 'stretch', marginTop: spacing.xs },
  recentList: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmGraySoft,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceStrong,
  },
  recentRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  recentRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.warmGraySoft,
  },
  activityIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.sageSoft,
  },
  recentCopy: { flex: 1, gap: spacing.xxs },
  recentAction: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.sageSoft,
  },
  recentRowPressed: {
    opacity: 0.86,
    backgroundColor: colors.sageSoft,
  },
  recentEmpty: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmGraySoft,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceStrong,
    padding: spacing.md,
  },
  recentEmptyCopy: { flex: 1, gap: spacing.xxs },
  roundArrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.forest,
  },
  partialError: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: '#F3E1DD',
    paddingHorizontal: spacing.md,
  },
  partialErrorCopy: { flex: 1, color: colors.danger },
  retryLink: { minHeight: 44, justifyContent: 'center' },
  retryText: { color: colors.danger, textDecorationLine: 'underline' },
  fullError: {
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmGraySoft,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceStrong,
    padding: spacing.xl,
  },
  errorIcon: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.sageSoft,
  },
  retryButton: { alignSelf: 'stretch', marginTop: spacing.xs },
  unavailablePanel: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmGraySoft,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  unavailableCopy: { flex: 1 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.992 }] },
  skeleton: { gap: spacing.xxxl },
  skeletonBlock: {
    borderRadius: radii.md,
    backgroundColor: colors.warmGraySoft,
  },
  skeletonHero: { height: 255, borderRadius: radii.lg },
  skeletonSection: { gap: spacing.sm },
  skeletonEyebrow: { width: 90, height: 12 },
  skeletonTitle: { width: '70%', height: 26 },
  skeletonTitleShort: { width: '52%', height: 26 },
  skeletonCard: { height: 300, marginTop: spacing.xs, borderRadius: radii.lg },
  skeletonRows: { height: 205, marginTop: spacing.xs, borderRadius: radii.lg },
});
