import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState, type ComponentProps } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/src/components';
import { DetailSheet } from '@/src/components/mobile-controls';
import type { RefugeActivity } from '@/src/features/refuge/contracts';
import {
  colors,
  radii,
  shadows,
  spacing,
} from '@/src/theme/tokens';
import {
  activityDate,
  addDays,
  createPlanningWeek,
  formatDistance,
  formatDuration,
  formatWeekPeriod,
  getActivityMeta,
  getActivityStatus,
  getActivityTitle,
  getNextPlannedActivity,
  getSportLabel,
  getWeekSummary,
  isSameDay,
  localDateKey,
  startOfWeek,
  type PlanningDay,
} from './planning-model';
import { usePlanningData } from './use-planning-data';

type Icon = ComponentProps<typeof Ionicons>['name'];

export default function PlanningScreen() {
  const data = usePlanningData();
  const [now] = useState(() => new Date());
  return (
    <PlanningView
      {...data}
      now={now}
      onPlan={(date) =>
        router.navigate({
          pathname: '/action',
          params: { status: 'PLANNED', date: localDateKey(date) },
        })
      }
    />
  );
}

export type PlanningViewProps = ReturnType<typeof usePlanningData> & {
  now?: Date;
  onPlan: (date: Date) => void;
};

export function PlanningView({
  activities,
  error,
  isLoading,
  isRefreshing,
  now = new Date(),
  onPlan,
  refresh,
  retry,
}: PlanningViewProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(now));
  const [selected, setSelected] = useState<RefugeActivity | null>(null);
  const days = useMemo(
    () => createPlanningWeek(weekStart, activities ?? []),
    [activities, weekStart],
  );
  const summary = useMemo(() => getWeekSummary(days), [days]);
  const weekActivityCount = useMemo(
    () => days.reduce((count, day) => count + day.activities.length, 0),
    [days],
  );
  const nextActivity = useMemo(
    () => getNextPlannedActivity(activities ?? [], now),
    [activities, now],
  );
  const currentWeek = isSameDay(weekStart, startOfWeek(now));

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <FlatList
        data={days}
        keyExtractor={(day) => day.key}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refresh()}
            colors={[colors.forest]}
            tintColor={colors.forest}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <Text accessibilityRole="header" variant="screenTitle">
                  Planning
                </Text>
                <Text variant="caption" tone="secondary">
                  Ta semaine, clairement.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Planifier une séance"
                onPress={() => onPlan(now)}
                style={({ pressed }) => [
                  styles.planButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="add" color={colors.surfaceStrong} size={20} />
                <Text variant="caption" style={styles.inverse}>
                  Planifier
                </Text>
              </Pressable>
            </View>

            <View style={styles.weekNavigation}>
              <WeekButton
                icon="chevron-back"
                label="Afficher la semaine précédente"
                onPress={() => setWeekStart((date) => addDays(date, -7))}
              />
              <View
                accessible
                accessibilityLabel={`Semaine du ${formatWeekPeriod(weekStart)}`}
                accessibilityLiveRegion="polite"
                style={styles.period}
              >
                <Text variant="eyebrow" tone="secondary">
                  {currentWeek ? 'Semaine en cours' : 'Semaine affichée'}
                </Text>
                <Text variant="label" style={styles.periodLabel}>
                  {formatWeekPeriod(weekStart)}
                </Text>
              </View>
              <WeekButton
                icon="chevron-forward"
                label="Afficher la semaine suivante"
                onPress={() => setWeekStart((date) => addDays(date, 7))}
              />
            </View>
            {!currentWeek ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setWeekStart(startOfWeek(now))}
                style={({ pressed }) => [
                  styles.todayButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="locate-outline" color={colors.forest} size={17} />
                <Text variant="caption">Aujourd’hui</Text>
              </Pressable>
            ) : null}

            {isLoading && activities === null ? (
              <PlanningSkeleton />
            ) : (
              <>
                <WeekSummary summary={summary} />
                <NextActivity
                  activity={nextActivity}
                  now={now}
                  onOpen={() => nextActivity && setSelected(nextActivity)}
                  onPlan={() => onPlan(now)}
                />
              </>
            )}

            {error ? (
              <View accessibilityRole="alert" style={styles.errorNotice}>
                <Ionicons
                  name="cloud-offline-outline"
                  color={colors.danger}
                  size={21}
                />
                <View style={styles.errorCopy}>
                  <Text variant="label">Planning momentanément indisponible</Text>
                  <Text variant="caption" tone="secondary">
                    {activities
                      ? 'Les données déjà chargées restent visibles.'
                      : 'Vérifie ta connexion puis réessaie.'}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Réessayer le chargement"
                  onPress={() => void retry()}
                  style={({ pressed }) => [
                    styles.retry,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="refresh" color={colors.forest} size={20} />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.daysHeading}>
              <View>
                <Text variant="eyebrow" tone="accent">
                  Les 7 jours
                </Text>
                <Text variant="heading" style={styles.daysTitle}>
                  Ton terrain de la semaine
                </Text>
              </View>
              <Text variant="caption" tone="secondary">
                {weekActivityCount} séance{weekActivityCount > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <PlanningDayCard
            day={item}
            now={now}
            loading={isLoading && activities === null}
            onOpen={setSelected}
            onPlan={() => onPlan(item.date)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.dayGap} />}
        ListFooterComponent={<View style={styles.footerSpace} />}
      />

      <DetailSheet
        visible={selected !== null}
        title="Détail de la séance"
        onClose={() => setSelected(null)}
      >
        {selected ? <ActivitySheet activity={selected} /> : null}
      </DetailSheet>
    </SafeAreaView>
  );
}

function WeekButton({
  icon,
  label,
  onPress,
}: {
  icon: Icon;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.weekButton, pressed && styles.pressed]}
    >
      <Ionicons name={icon} color={colors.forest} size={23} />
    </Pressable>
  );
}

function WeekSummary({ summary }: { summary: ReturnType<typeof getWeekSummary> }) {
  const metrics = [
    {
      label: 'Distance',
      value: formatDistance(summary.completedDistance) ?? '0 km',
      icon: 'navigate-outline' as Icon,
    },
    {
      label: 'Mouvement',
      value: formatDuration(summary.completedDuration) ?? '0 min',
      icon: 'time-outline' as Icon,
    },
    {
      label: 'Prévues',
      value: String(summary.plannedCount),
      icon: 'calendar-outline' as Icon,
    },
    {
      label: 'Jours actifs',
      value: `${summary.activeDays}/7`,
      icon: 'sparkles-outline' as Icon,
    },
  ];
  return (
    <View accessibilityLabel="Résumé de la semaine" style={styles.summary}>
      {metrics.map((metric, index) => (
        <View
          key={metric.label}
          style={[
            styles.metric,
            index % 2 === 0 && styles.metricRightBorder,
            index < 2 && styles.metricBottomBorder,
          ]}
        >
          <Ionicons name={metric.icon} color={colors.moss} size={19} />
          <View style={styles.metricCopy}>
            <Text variant="heading" style={styles.metricValue} numberOfLines={1}>
              {metric.value}
            </Text>
            <Text variant="caption" tone="secondary">
              {metric.label}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function NextActivity({
  activity,
  now,
  onOpen,
  onPlan,
}: {
  activity: RefugeActivity | null;
  now: Date;
  onOpen: () => void;
  onPlan: () => void;
}) {
  if (!activity)
    return (
      <View style={styles.nextEmpty}>
        <View style={styles.nextIconSoft}>
          <Ionicons name="calendar-outline" color={colors.forest} size={22} />
        </View>
        <View style={styles.nextCopy}>
          <Text variant="eyebrow" tone="accent">
            Prochaine séance
          </Text>
          <Text variant="label">Aucune séance prévue pour le moment.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Planifier une séance"
          onPress={onPlan}
          style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}
        >
          <Ionicons name="add" color={colors.forest} size={19} />
        </Pressable>
      </View>
    );

  const date = activityDate(activity);
  const relativeDay = isSameDay(date, now)
    ? "Aujourd’hui"
    : isSameDay(date, addDays(now, 1))
      ? 'Demain'
      : date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Ouvre le détail de la séance"
      accessibilityLabel={`Prochaine séance : ${getActivityTitle(activity)}`}
      onPress={onOpen}
      android_ripple={{ color: colors.forestDivider }}
      style={({ pressed }) => [styles.next, pressed && styles.nextPressed]}
    >
      <View style={styles.nextIcon}>
        <Ionicons name={sportIcon(activity.sport)} color={colors.sageSoft} size={24} />
      </View>
      <View style={styles.nextCopy}>
        <Text variant="eyebrow" style={styles.nextEyebrow}>
          Prochaine séance
        </Text>
        <Text variant="label" style={styles.nextTitle} numberOfLines={2}>
          {getActivityTitle(activity)}
        </Text>
        <Text variant="caption" style={styles.nextMeta} numberOfLines={2}>
          {[relativeDay, ...getActivityMeta(activity)].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" color={colors.sageSoft} size={21} />
    </Pressable>
  );
}

function PlanningDayCard({
  day,
  loading,
  now,
  onOpen,
  onPlan,
}: {
  day: PlanningDay;
  loading: boolean;
  now: Date;
  onOpen: (activity: RefugeActivity) => void;
  onPlan: () => void;
}) {
  const today = isSameDay(day.date, now);
  const dayName = day.date
    .toLocaleDateString('fr-FR', { weekday: 'long' })
    .toUpperCase();
  const date = day.date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
  return (
    <View
      accessibilityLabel={today ? `${dayName} ${date}, aujourd’hui` : `${dayName} ${date}`}
      style={[styles.dayCard, today && styles.dayToday]}
    >
      <View style={styles.dayHeader}>
        <View style={styles.dayDate}>
          <Text variant="eyebrow" style={today ? styles.dayNameToday : undefined}>
            {dayName}
          </Text>
          <Text variant="label">{date}</Text>
        </View>
        {today ? (
          <View style={styles.todayBadge}>
            <Ionicons name="radio-button-on" color={colors.forest} size={13} />
            <Text variant="caption">Aujourd’hui</Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.dayLoading}>
          <View style={styles.loadingIcon} />
          <View style={styles.loadingLines}>
            <View style={styles.loadingLineStrong} />
            <View style={styles.loadingLine} />
          </View>
        </View>
      ) : day.activities.length ? (
        <View style={styles.dayActivities}>
          {day.activities.map((activity, index) => (
            <View key={activity.id}>
              {index ? <View style={styles.activitySeparator} /> : null}
              <ActivityRow activity={activity} onOpen={() => onOpen(activity)} />
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ajouter une séance le ${date}`}
            onPress={onPlan}
            style={({ pressed }) => [
              styles.addAnother,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="add" color={colors.moss} size={18} />
            <Text variant="caption" tone="secondary">
              Ajouter une séance
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.freeDay}>
          <View style={styles.freeIcon}>
            <Ionicons name="leaf-outline" color={colors.moss} size={19} />
          </View>
          <View style={styles.freeCopy}>
            <Text variant="label">Journée libre</Text>
            <Text variant="caption" tone="secondary">
              Repos ou nouvelle sortie.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ajouter une séance le ${date}`}
            onPress={onPlan}
            style={({ pressed }) => [styles.addDay, pressed && styles.pressed]}
          >
            <Ionicons name="add" color={colors.forest} size={18} />
            <Text variant="caption">Ajouter</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ActivityRow({
  activity,
  onOpen,
}: {
  activity: RefugeActivity;
  onOpen: () => void;
}) {
  const status = getActivityStatus(activity.status);
  const planned = status.tone === 'planned';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Ouvre le détail de la séance"
      accessibilityLabel={`${getActivityTitle(activity)}, ${status.label}`}
      onPress={onOpen}
      android_ripple={{ color: colors.sageSoft }}
      style={({ pressed }) => [
        styles.activityRow,
        planned && styles.activityPlanned,
        pressed && styles.activityPressed,
      ]}
    >
      <View style={[styles.activityIcon, planned && styles.activityIconPlanned]}>
        <Ionicons
          name={sportIcon(activity.sport)}
          color={planned ? colors.terracotta : colors.forest}
          size={21}
        />
      </View>
      <View style={styles.activityCopy}>
        <View style={styles.activityTopline}>
          <Text variant="caption" tone="secondary">
            {getSportLabel(activity.sport)}
          </Text>
          <StatusBadge status={activity.status} />
        </View>
        <Text variant="label" numberOfLines={2} style={styles.activityTitle}>
          {getActivityTitle(activity)}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={2}>
          {getActivityMeta(activity).join(' · ') || 'Mesures non renseignées'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" color={colors.warmGray} size={18} />
    </Pressable>
  );
}

function StatusBadge({ status }: { status: string }) {
  const value = getActivityStatus(status);
  return (
    <View
      style={[
        styles.status,
        value.tone === 'planned' && styles.statusPlanned,
        value.tone === 'completed' && styles.statusCompleted,
        value.tone === 'missed' && styles.statusMissed,
        value.tone === 'canceled' && styles.statusCanceled,
      ]}
    >
      <Ionicons
        name={value.tone === 'completed' ? 'checkmark' : 'time-outline'}
        color={
          value.tone === 'planned'
            ? colors.terracotta
            : value.tone === 'completed'
              ? colors.success
              : colors.warmGray
        }
        size={13}
      />
      <Text variant="caption" style={styles.statusText}>
        {value.label}
      </Text>
    </View>
  );
}

function ActivitySheet({ activity }: { activity: RefugeActivity }) {
  const status = getActivityStatus(activity.status);
  const date = activityDate(activity);
  const metrics = getActivityMeta(activity).slice(1);
  return (
    <View style={styles.sheetContent}>
      <View style={styles.sheetIntro}>
        <View style={styles.sheetSport}>
          <Ionicons name={sportIcon(activity.sport)} color={colors.forest} size={25} />
        </View>
        <View style={styles.activityCopy}>
          <Text variant="caption" tone="secondary">
            {getSportLabel(activity.sport)}
          </Text>
          <Text variant="heading">{getActivityTitle(activity)}</Text>
        </View>
        <StatusBadge status={activity.status} />
      </View>
      <View style={styles.sheetDate}>
        <Ionicons name="calendar-outline" color={colors.moss} size={20} />
        <Text>
          {date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}{' '}
          · {getActivityMeta(activity)[0] ?? 'Heure non renseignée'}
        </Text>
      </View>
      {metrics.length ? (
        <View style={styles.sheetMetrics}>
          {metrics.map((metric) => (
            <View key={metric} style={styles.sheetMetric}>
              <Text variant="label">{metric}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {activity.description?.trim() ? (
        <View style={styles.sheetNote}>
          <Text variant="label">Intention</Text>
          <Text tone="secondary">{activity.description.trim()}</Text>
        </View>
      ) : null}
      <View style={styles.sheetStatus}>
        <Ionicons
          name={status.tone === 'completed' ? 'checkmark-circle' : 'calendar'}
          color={status.tone === 'completed' ? colors.success : colors.terracotta}
          size={21}
        />
        <Text variant="label">
          {status.tone === 'completed'
            ? 'Activité terminée'
            : `Séance ${status.label.toLowerCase()}`}
        </Text>
      </View>
    </View>
  );
}

function PlanningSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="Chargement du planning"
      accessibilityState={{ busy: true }}
      style={styles.skeleton}
    >
      <View style={styles.skeletonSummary}>
        {[0, 1, 2, 3].map((key) => (
          <View key={key} style={styles.skeletonMetric} />
        ))}
      </View>
      <View style={styles.skeletonNext} />
    </View>
  );
}

function sportIcon(sport: string): Icon {
  if (['ROAD_CYCLING', 'GRAVEL', 'MTB'].includes(sport)) return 'bicycle-outline';
  if (['GYM', 'FITNESS'].includes(sport)) return 'barbell-outline';
  if (sport === 'SWIMMING') return 'water-outline';
  if (['SKI', 'SNOWBOARD'].includes(sport)) return 'snow-outline';
  if (sport === 'CLIMBING') return 'triangle-outline';
  if (['HIKING', 'WALKING'].includes(sport)) return 'footsteps-outline';
  return 'walk-outline';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  list: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
  },
  headerContent: { gap: spacing.md, paddingTop: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titleCopy: { flex: 1, minWidth: 0 },
  planButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.forest,
  },
  inverse: { color: colors.surfaceStrong },
  weekNavigation: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xxs,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmGraySoft,
  },
  weekButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  period: { flex: 1, minWidth: 0, alignItems: 'center', gap: 1 },
  periodLabel: { textAlign: 'center', textTransform: 'capitalize' },
  todayButton: {
    alignSelf: 'center',
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.sageSoft,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmGraySoft,
    ...shadows.card,
  },
  metric: {
    width: '50%',
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  metricRightBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.warmGraySoft,
  },
  metricBottomBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.warmGraySoft,
  },
  metricCopy: { flex: 1, minWidth: 0 },
  metricValue: { fontSize: 21, lineHeight: 26 },
  next: {
    minHeight: 102,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.forest,
    overflow: 'hidden',
  },
  nextPressed: { opacity: 0.9, transform: [{ scale: 0.992 }] },
  nextEmpty: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.sageMist,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sage,
  },
  nextIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.forestTrack,
  },
  nextIconSoft: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.sageSoft,
  },
  nextCopy: { flex: 1, minWidth: 0, gap: 2 },
  nextEyebrow: { color: colors.sage },
  nextTitle: { color: colors.surfaceStrong, fontSize: 16, lineHeight: 21 },
  nextMeta: { color: colors.sage },
  smallAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceStrong,
  },
  errorNotice: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.dangerSoft,
  },
  errorCopy: { flex: 1, minWidth: 0 },
  retry: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceStrong,
  },
  daysHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  daysTitle: { fontSize: 22, lineHeight: 27 },
  dayGap: { height: spacing.sm },
  dayCard: {
    overflow: 'hidden',
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmGraySoft,
  },
  dayToday: { borderWidth: 1.5, borderColor: colors.sage },
  dayHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.warmGraySoft,
  },
  dayDate: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  dayNameToday: { color: colors.terracotta },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: colors.sageSoft,
  },
  freeDay: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  freeIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.sageMist,
  },
  freeCopy: { flex: 1, minWidth: 0 },
  addDay: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.sageSoft,
  },
  dayActivities: { paddingHorizontal: spacing.sm, paddingTop: spacing.xxs },
  activityRow: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xxs,
    borderRadius: radii.sm,
  },
  activityPlanned: { backgroundColor: colors.terracottaSoft },
  activityPressed: { opacity: 0.76, transform: [{ scale: 0.994 }] },
  activityIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.sageSoft,
  },
  activityIconPlanned: { backgroundColor: colors.surfaceStrong },
  activityCopy: { flex: 1, minWidth: 0, gap: 2 },
  activityTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  activityTitle: { fontSize: 16, lineHeight: 21 },
  activitySeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.warmGraySoft,
  },
  status: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.pill,
  },
  statusPlanned: { backgroundColor: colors.surfaceStrong },
  statusCompleted: { backgroundColor: colors.sageMist },
  statusMissed: { backgroundColor: colors.sageSoft },
  statusCanceled: { backgroundColor: colors.dangerSoft },
  statusText: { fontSize: 11, lineHeight: 15 },
  addAnother: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.warmGraySoft,
  },
  dayLoading: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  loadingIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.sageSoft,
  },
  loadingLines: { flex: 1, gap: spacing.xs },
  loadingLineStrong: {
    width: '62%',
    height: 13,
    borderRadius: radii.pill,
    backgroundColor: colors.sageSoft,
  },
  loadingLine: {
    width: '84%',
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.sageMist,
  },
  skeleton: { gap: spacing.md },
  skeletonSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
  },
  skeletonMetric: {
    width: '50%',
    height: 78,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.canvas,
    backgroundColor: colors.sageMist,
  },
  skeletonNext: {
    height: 102,
    borderRadius: radii.md,
    backgroundColor: colors.sageSoft,
  },
  sheetContent: { gap: spacing.lg },
  sheetIntro: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sheetSport: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.sageSoft,
  },
  sheetDate: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sheetMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  sheetMetric: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceStrong,
  },
  sheetNote: { gap: spacing.xs },
  sheetStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.sageMist,
  },
  pressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
  footerSpace: { height: spacing.xl },
});
