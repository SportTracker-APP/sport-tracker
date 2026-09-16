import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ComponentProps } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text, TopographicAccent } from '@/src/components';
import {
  ChoiceChip,
  ContentState,
  DataNotice,
  DetailSheet,
  LoadingRows,
  SearchField,
} from '@/src/components/mobile-controls';
import { normalizeSearch } from '@/src/features/explore/explore-model';
import {
  formatActivityDuration,
  getActivitySport,
} from '@/src/features/activities/activity-form-model';
import type { RefugeActivity } from '@/src/features/refuge/contracts';
import {
  createGoalProgress,
  createRefugeViewModel,
  formatDate,
  getActivityMeta,
  getActivityTitle,
  isRecordedCompletedActivity,
} from '@/src/features/refuge/refuge-model';
import { useRefugeData } from '@/src/features/refuge/use-refuge-data';
import {
  colors,
  fontFamilies,
  radii,
  shadows,
  spacing,
} from '@/src/theme/tokens';

type JournalSection = 'activities' | 'progress';
type Icon = ComponentProps<typeof Ionicons>['name'];

export default function JournalScreen() {
  const data = useRefugeData();
  const params = useLocalSearchParams<{
    section?: string;
    activity?: string;
  }>();
  return (
    <JournalView
      data={data}
      section={params.section === 'progress' ? 'progress' : 'activities'}
      selectedId={params.activity}
      onSection={(section) => router.setParams({ section })}
      onSelect={(activity) => router.setParams({ activity })}
      onClose={() => router.setParams({ activity: undefined })}
      onExplore={() => router.navigate('/explore')}
    />
  );
}

export type JournalViewProps = {
  data: ReturnType<typeof useRefugeData>;
  section: JournalSection;
  selectedId?: string;
  onSection: (section: JournalSection) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
  onExplore: () => void;
};

export function JournalView({
  data,
  section,
  selectedId,
  onSection,
  onSelect,
  onClose,
  onExplore,
}: JournalViewProps) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [sport, setSport] = useState('all');
  const activities = useMemo(
    () =>
      (data.activities ?? [])
        .filter((item) => isRecordedCompletedActivity(item))
        .sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
        ),
    [data.activities],
  );
  const filtered = useMemo(
    () =>
      activities.filter((item) => {
        if (sport !== 'all' && item.sport !== sport) return false;
        const text = normalizeSearch(
          [getActivityTitle(item), item.city, item.country]
            .filter(Boolean)
            .join(' '),
        );
        return normalizeSearch(query)
          .split(' ')
          .every((word) => text.includes(word));
      }),
    [activities, sport, query],
  );
  const selected = activities.find((item) => item.id === selectedId);
  const sportChoices = (
    <>
      <ChoiceChip
        label="Toutes"
        selected={sport === 'all'}
        onPress={() => setSport('all')}
      />
      {[...new Set(activities.map((item) => item.sport))]
        .sort()
        .map((value) => (
          <ChoiceChip
            key={value}
            label={sportLabel(value)}
            icon={sportIcon(value)}
            selected={sport === value}
            onPress={() => setSport(value)}
          />
        ))}
    </>
  );
  const refreshControl = (
    <RefreshControl
      refreshing={data.isRefreshing}
      onRefresh={() => void data.refresh()}
      colors={[colors.forest]}
      tintColor={colors.forest}
    />
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.toolbar}>
        <View style={styles.titleRow}>
          <View style={styles.copy}>
            <Text accessibilityRole="header" variant="screenTitle">
              Ton carnet
            </Text>
            <Text variant="caption" tone="secondary">
              Tes sorties. Tes sommets. Ton chemin.
            </Text>
          </View>
          <View style={styles.book}>
            <Ionicons name="book-outline" color={colors.forest} size={25} />
          </View>
        </View>
        <View style={styles.segments}>
          {(
            [
              ['activities', 'Sorties'],
              ['progress', 'Progression'],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected: section === value }}
              onPress={() => onSection(value)}
              style={({ pressed }) => [
                styles.segment,
                section === value && styles.segmentActive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                variant="label"
                style={section === value ? styles.segmentTextActive : undefined}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        {section === 'activities' ? (
          <>
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Retrouver une sortie…"
            />
            {width < 420 ? (
              <View style={[styles.chips, styles.chipsWrap]}>
                {sportChoices}
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
                keyboardShouldPersistTaps="handled"
              >
                {sportChoices}
              </ScrollView>
            )}
          </>
        ) : null}
      </View>
      {section === 'activities' ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          refreshControl={refreshControl}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {data.errors.includes('activities') &&
              data.activities !== null ? (
                <DataNotice onRetry={() => void data.retry()} />
              ) : null}
              {data.activities !== null ? (
                <Text
                  variant="caption"
                  tone="secondary"
                  accessibilityLiveRegion="polite"
                >
                  {filtered.length} sortie{filtered.length > 1 ? 's' : ''}
                </Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            data.activities === null ? (
              data.isLoading ? (
                <LoadingRows />
              ) : (
                <ContentState
                  icon="cloud-offline-outline"
                  title="Tes sorties sont indisponibles"
                  message="Vérifie ta connexion et réessaie."
                  action={
                    <Button
                      label="Réessayer"
                      onPress={() => void data.retry()}
                    />
                  }
                />
              )
            ) : (
              <ContentState
                icon="footsteps-outline"
                title={
                  activities.length
                    ? 'Aucune sortie trouvée'
                    : 'Ta première sortie t’attend'
                }
                message={
                  activities.length
                    ? 'Essaie un autre nom ou change de filtre.'
                    : 'Tes sorties enregistrées apparaîtront ici, avec leurs distances, durées et dénivelés.'
                }
                action={
                  activities.length ? (
                    <Button
                      label="Effacer les filtres"
                      variant="secondary"
                      onPress={() => {
                        setQuery('');
                        setSport('all');
                      }}
                    />
                  ) : (
                    <Button label="Explorer les sommets" onPress={onExplore} />
                  )
                }
              />
            )
          }
          renderItem={({ item, index }) => (
            <View>
              {monthKey(item.startedAt) !==
              monthKey(filtered[index - 1]?.startedAt) ? (
                <View style={styles.monthHeader}>
                  <View style={styles.monthMark} />
                  <Text variant="label" style={styles.month}>
                    {new Date(item.startedAt).toLocaleDateString('fr-FR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                  <View style={styles.monthRule} />
                </View>
              ) : null}
              <ActivityRow activity={item} onPress={() => onSelect(item.id)} />
            </View>
          )}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={refreshControl}
        >
          <ProgressContent data={data} onExplore={onExplore} />
        </ScrollView>
      )}
      <DetailSheet
        visible={Boolean(selectedId)}
        title="Ta sortie"
        onClose={onClose}
      >
        {selected ? (
          <ActivityDetail activity={selected} />
        ) : data.isLoading || data.isRefreshing ? (
          <LoadingRows />
        ) : (
          <ContentState
            title="Sortie indisponible"
            message={
              data.errors.includes('activities')
                ? 'Impossible de charger cette sortie pour le moment.'
                : 'Cette sortie n’est plus disponible dans ton carnet.'
            }
            action={
              data.errors.includes('activities') ? (
                <Button label="Réessayer" onPress={() => void data.retry()} />
              ) : undefined
            }
          />
        )}
      </DetailSheet>
    </SafeAreaView>
  );
}

function monthKey(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function sportIcon(sport: string): Icon {
  return getActivitySport(sport)?.icon ?? 'footsteps-outline';
}

function sportLabel(sport: string) {
  return getActivitySport(sport)?.label ?? sport;
}

function ActivityRow({
  activity,
  onPress,
}: {
  activity: RefugeActivity;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Ouvre le détail de la sortie"
      accessibilityLabel={`${getActivityTitle(activity)}, ${formatDate(activity.startedAt)}`}
      onPress={onPress}
      android_ripple={{ color: colors.sageSoft }}
      style={({ pressed }) => [styles.activity, pressed && styles.pressed]}
    >
      <View style={styles.sport}>
        <Ionicons
          name={sportIcon(activity.sport)}
          size={23}
          color={colors.forest}
        />
      </View>
      <View style={styles.copy}>
        <Text variant="caption" tone="secondary">
          {formatDate(activity.startedAt)} · {sportLabel(activity.sport)}
        </Text>
        <Text variant="label" numberOfLines={2} style={styles.activityTitle}>
          {getActivityTitle(activity)}
        </Text>
        <Text variant="caption" tone="secondary">
          {[
            ...getActivityMeta(activity).slice(0, 2),
            formatActivityDuration(activity.duration),
          ]
            .filter(Boolean)
            .join(' · ') || 'Mesures non renseignées'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.forest} />
    </Pressable>
  );
}

function ActivityDetail({ activity }: { activity: RefugeActivity }) {
  const number = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
  const metrics = [
    {
      label: 'Distance',
      value:
        activity.distance != null &&
        Number.isFinite(activity.distance) &&
        activity.distance >= 0
          ? `${number.format(activity.distance)} km`
          : null,
    },
    { label: 'Durée', value: formatActivityDuration(activity.duration) },
    {
      label: 'Dénivelé positif',
      value:
        activity.elevationGain != null &&
        Number.isFinite(activity.elevationGain) &&
        activity.elevationGain >= 0
          ? `${number.format(activity.elevationGain)} m`
          : null,
    },
  ].filter((metric) => metric.value !== null);
  return (
    <>
      <View style={styles.detailTop}>
        <View style={styles.sport}>
          <Ionicons
            name={sportIcon(activity.sport)}
            size={24}
            color={colors.forest}
          />
        </View>
        <Text variant="label">{sportLabel(activity.sport)}</Text>
      </View>
      <Text variant="heading" accessibilityRole="header">
        {getActivityTitle(activity)}
      </Text>
      <Text tone="secondary">{formatDate(activity.startedAt)}</Text>
      {metrics.length ? (
        <View style={styles.metrics}>
          {metrics.map((metric) => (
            <View key={metric.label} style={styles.metric}>
              <Text style={styles.metricValue} variant="label">
                {metric.value}
              </Text>
              <Text variant="caption" tone="secondary">
                {metric.label}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text tone="secondary">
          Aucune mesure disponible pour cette sortie.
        </Text>
      )}
      {activity.city || activity.country ? (
        <View style={styles.detailTop}>
          <Ionicons name="location-outline" color={colors.moss} size={20} />
          <Text style={styles.copy}>
            {[activity.city, activity.country].filter(Boolean).join(' · ')}
          </Text>
        </View>
      ) : null}
      {activity.description?.trim() ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="label">Tes notes</Text>
          <Text>{activity.description.trim()}</Text>
        </View>
      ) : null}
      <View style={styles.recorded}>
        <Ionicons name="checkmark-circle" color={colors.success} size={21} />
        <Text variant="label">Sortie enregistrée dans ton carnet</Text>
      </View>
    </>
  );
}

function ProgressContent({
  data,
  onExplore,
}: Pick<JournalViewProps, 'data' | 'onExplore'>) {
  const model = useMemo(() => createRefugeViewModel(data), [data]);
  const goals = useMemo(
    () =>
      data.activities !== null && data.goals !== null
        ? data.goals
            .map((goal) => ({
              id: goal.id,
              progress: createGoalProgress([goal], data.activities!),
            }))
            .filter((goal) => goal.progress !== null)
        : null,
    [data.activities, data.goals],
  );
  const badges = data.badges?.filter((badge) => badge.unlocked);
  if (data.isLoading && !data.hasAnyData) return <LoadingRows />;
  if (!data.hasAnyData)
    return (
      <ContentState
        icon="cloud-offline-outline"
        title="Ta progression est indisponible"
        message="Réessaie lorsque ta connexion sera rétablie."
        action={<Button label="Réessayer" onPress={() => void data.retry()} />}
      />
    );

  return (
    <View style={styles.progressContent}>
      {data.errors.length ? (
        <DataNotice onRetry={() => void data.retry()} />
      ) : null}
      <View style={styles.collection}>
        <TopographicAccent
          color="rgba(221, 228, 214, 0.14)"
          style={styles.collectionTopo}
        />
        <View style={styles.detailTop}>
          <Ionicons name="flag-outline" color={colors.sage} size={24} />
          <Text variant="label" style={styles.inverse}>
            Tes sommets
          </Text>
        </View>
        {model.summitCount !== null && model.catalogCount !== null ? (
          <>
            <Text style={styles.collectionValue}>
              {model.summitCount}{' '}
              <Text style={styles.collectionTotal}>/ {model.catalogCount}</Text>
            </Text>
            <Text style={styles.inverse}>sommets découverts</Text>
            <Meter
              value={model.carnetProgress ?? 0}
              dark
              label="Progression des sommets"
            />
          </>
        ) : (
          <Text style={styles.inverse}>
            Progression des sommets indisponible.
          </Text>
        )}
        <Button
          label="Consulter les sommets"
          variant="secondary"
          onPress={onExplore}
        />
      </View>
      <Text variant="label" style={styles.sectionTitle}>
        Objectifs actifs
      </Text>
      {goals === null ? (
        <Text tone="secondary">
          Tes objectifs ne sont pas disponibles pour le moment.
        </Text>
      ) : goals.length === 0 ? (
        <Text tone="secondary">Aucun objectif actif pour le moment.</Text>
      ) : (
        goals.map(({ id, progress }) =>
          progress ? (
            <View key={id} style={styles.goal}>
              <View style={styles.goalTop}>
                <View style={styles.goalIcon}>
                  <Ionicons
                    name={progress.completed ? 'checkmark' : 'navigate-outline'}
                    color={colors.terracotta}
                    size={20}
                  />
                </View>
                <Text variant="label" style={styles.goalPercent}>
                  {progress.progress} %
                </Text>
              </View>
              <Text variant="label" style={styles.goalTitle}>
                {progress.title}
              </Text>
              <Meter value={progress.progress} label={progress.title} />
              <View style={styles.goalBottom}>
                <Text variant="label">
                  {progress.currentLabel} / {progress.targetLabel}
                </Text>
                <Text variant="caption" tone="secondary">
                  {progress.completed
                    ? 'Objectif atteint'
                    : progress.deadlineLabel}
                </Text>
              </View>
            </View>
          ) : null,
        )
      )}
      <Text variant="label" style={styles.sectionTitle}>
        Badges débloqués
      </Text>
      {!badges ? (
        <Text tone="secondary">
          Tes badges ne sont pas disponibles pour le moment.
        </Text>
      ) : badges.length === 0 ? (
        <Text tone="secondary">
          Tes prochains accomplissements trouveront leur place ici.
        </Text>
      ) : (
        badges.map((badge) => (
          <View key={badge.id} style={styles.badge}>
            <View style={styles.sport}>
              <Ionicons name="ribbon-outline" size={25} color={colors.forest} />
            </View>
            <View style={styles.copy}>
              <Text variant="label">{badge.name}</Text>
              {badge.description ? (
                <Text variant="caption" tone="secondary">
                  {badge.description}
                </Text>
              ) : null}
              {badge.unlockedAt ? (
                <Text variant="caption" tone="secondary">
                  {formatDate(badge.unlockedAt)}
                </Text>
              ) : null}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function Meter({
  value,
  label,
  dark = false,
}: {
  value: number;
  label: string;
  dark?: boolean;
}) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ now: value, min: 0, max: 100 }}
      style={[styles.track, dark && styles.trackDark]}
    >
      <View
        style={[
          styles.fill,
          dark && styles.fillDark,
          { width: `${Math.max(0, Math.min(100, value))}%` },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  toolbar: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    gap: spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  book: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.sageSoft,
  },
  copy: { flex: 1, gap: spacing.xxs },
  segments: {
    flexDirection: 'row',
    gap: spacing.xxs,
    padding: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: colors.sageSoft,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  segmentActive: { backgroundColor: colors.forest },
  segmentTextActive: { color: colors.surfaceStrong },
  chips: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingRight: spacing.xxs,
  },
  chipsWrap: { flexWrap: 'wrap' },
  list: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  listHeader: { gap: spacing.sm, paddingVertical: spacing.xs },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  month: {
    textTransform: 'capitalize',
  },
  monthMark: {
    width: 4,
    height: 18,
    borderRadius: radii.pill,
    backgroundColor: colors.terracotta,
  },
  monthRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.sage,
  },
  activity: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.warmGraySoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
    borderLeftColor: colors.sage,
    overflow: 'hidden',
  },
  activityTitle: { fontSize: 16, lineHeight: 22 },
  sport: {
    width: 42,
    height: 46,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sageSoft,
  },
  pressed: { backgroundColor: colors.sageSoft, opacity: 0.82 },
  detailTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metric: {
    flexGrow: 1,
    minWidth: 120,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.md,
  },
  metricValue: { fontSize: 24, lineHeight: 30 },
  recorded: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  progressContent: { gap: spacing.md, paddingTop: spacing.sm },
  collection: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.forest,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  collectionTopo: { top: -28, right: -62, transform: [{ rotate: '-9deg' }] },
  inverse: { color: colors.surfaceStrong },
  collectionValue: {
    fontFamily: fontFamilies.displaySemibold,
    color: colors.surfaceStrong,
    fontSize: 44,
    lineHeight: 52,
  },
  collectionTotal: {
    color: colors.sage,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 24,
    lineHeight: 30,
  },
  sectionTitle: {
    fontFamily: fontFamilies.sansSemibold,
    fontSize: 18,
    lineHeight: 24,
    marginTop: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.terracotta,
  },
  goal: {
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
    borderLeftColor: colors.terracotta,
    borderColor: colors.warmGraySoft,
  },
  goalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: { fontSize: 18, lineHeight: 25 },
  goalPercent: { fontSize: 20, lineHeight: 26, color: colors.terracotta },
  goalBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.sageSoft,
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  trackDark: { backgroundColor: colors.forestTrack },
  fill: {
    height: '100%',
    backgroundColor: colors.terracotta,
    borderRadius: radii.pill,
  },
  fillDark: { backgroundColor: colors.surfaceStrong },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.sageMist,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sage,
    borderRadius: radii.md,
  },
});
