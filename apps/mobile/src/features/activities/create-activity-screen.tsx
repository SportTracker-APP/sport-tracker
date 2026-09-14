import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, FormField, Text } from '@/src/components';
import { DetailSheet } from '@/src/components/mobile-controls';
import { colors, fontFamilies, radii, spacing } from '@/src/theme/tokens';
import { ActivityDateSheet } from './activity-date-sheet';
import {
  ACTIVITY_SPORTS,
  createActivityDraft,
  formatActivityDuration,
  getActivitySport,
  parseLocalStart,
  validateActivityDraft,
  type ActivityDraft,
  type ActivityFormErrors,
  type CreateActivityPayload,
} from './activity-form-model';
import { useCreateActivity } from './use-create-activity';

export default function CreateActivityScreen() {
  const creation = useCreateActivity();
  const [version, setVersion] = useState(0);
  return (
    <CreateActivityView
      key={version}
      {...creation}
      onJournal={(id) =>
        router.navigate({
          pathname: '/journal',
          params: { section: 'activities', activity: id },
        })
      }
      onNew={() => {
        creation.reset();
        setVersion((value) => value + 1);
      }}
    />
  );
}

export type CreateActivityViewProps = Pick<
  ReturnType<typeof useCreateActivity>,
  'saving' | 'error' | 'uncertain' | 'saved'
> & {
  submit: (payload: CreateActivityPayload) => Promise<void>;
  onJournal: (id?: string) => void;
  onNew: () => void;
};

export function CreateActivityView({
  saving,
  error,
  uncertain,
  saved,
  submit,
  onJournal,
  onNew,
}: CreateActivityViewProps) {
  const [draft, setDraft] = useState(createActivityDraft);
  const [errors, setErrors] = useState<ActivityFormErrors>({});
  const [sportPicker, setSportPicker] = useState(false);
  const [datePicker, setDatePicker] = useState(false);
  const [details, setDetails] = useState(false);
  const fields = useRef<Partial<Record<keyof ActivityDraft, TextInput>>>({});
  const scroll = useRef<ScrollView>(null);
  const sport = getActivitySport(draft.sport)!;
  const displayDate = parseLocalStart(draft.date, '12:00')?.toLocaleDateString(
    'fr-FR',
    { day: 'numeric', month: 'short', year: 'numeric' },
  );

  const change = <K extends keyof ActivityDraft>(
    key: K,
    value: ActivityDraft[K],
  ) => {
    if (saving) return;
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({
      ...current,
      [key]: undefined,
      ...(key === 'date' ? { time: undefined } : {}),
    }));
  };
  const save = () => {
    if (saving) return;
    const result = validateActivityDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      const first = Object.keys(result.errors)[0] as keyof ActivityDraft;
      AccessibilityInfo.announceForAccessibility(
        result.errors[first] ?? 'Vérifie les champs de ta sortie.',
      );
      requestAnimationFrame(() => {
        if (fields.current[first]) fields.current[first]?.focus();
        else scroll.current?.scrollTo({ y: 0, animated: true });
      });
      return;
    }
    Keyboard.dismiss();
    setErrors({});
    void submit(result.payload);
  };

  if (saved)
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.successContent}>
          <View accessibilityLiveRegion="polite" style={styles.success}>
            <View style={styles.successMark}>
              <Ionicons
                name="checkmark"
                color={colors.surfaceStrong}
                size={42}
              />
            </View>
            <Text variant="eyebrow" tone="accent">
              Sortie enregistrée
            </Text>
            <Text variant="heading" align="center" style={styles.successTitle}>
              C’est dans ton carnet.
            </Text>
            <Text align="center" tone="secondary">
              {saved.title?.trim() || draft.title.trim() || sport.label}
            </Text>
            <View style={styles.receipt}>
              <Ionicons name={sport.icon} color={colors.forest} size={23} />
              <View style={styles.receiptCopy}>
                <Text variant="label">{sport.label}</Text>
                <Text variant="caption" tone="secondary">
                  {displayDate} ·{' '}
                  {formatActivityDuration(saved.duration) ??
                    formatActivityDuration(
                      Number(draft.hours) * 60 + Number(draft.minutes),
                    )}
                </Text>
              </View>
              <Ionicons
                name="checkmark-circle"
                color={colors.success}
                size={22}
              />
            </View>
            <Button
              label="Voir ma sortie"
              onPress={() => onJournal(saved.id)}
              style={styles.fullWidth}
            />
            <Button
              label="Ajouter une autre sortie"
              variant="secondary"
              onPress={onNew}
              style={styles.fullWidth}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            Nouvelle sortie
          </Text>
          <Text tone="secondary" variant="caption">
            Une sortie terminée, à garder dans ton carnet.
          </Text>
        </View>
        <ScrollView
          ref={scroll}
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Sport : ${sport.label}. Changer de sport`}
            disabled={saving}
            onPress={() => {
              Keyboard.dismiss();
              setSportPicker(true);
            }}
            style={({ pressed }) => [
              styles.sportSelector,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.sportIcon}>
              <Ionicons
                name={sport.icon}
                color={colors.surfaceStrong}
                size={25}
              />
            </View>
            <View style={styles.receiptCopy}>
              <Text variant="caption" tone="secondary">
                Ton activité
              </Text>
              <Text variant="label" style={styles.sportName}>
                {sport.label}
              </Text>
            </View>
            <View style={styles.changeSport}>
              <Text variant="caption">Changer</Text>
              <Ionicons name="chevron-down" color={colors.forest} size={17} />
            </View>
          </Pressable>
          <FormField
            ref={(ref) => {
              if (ref) fields.current.title = ref;
            }}
            label="Nom de la sortie (facultatif)"
            accessibilityLabel="Nom de la sortie"
            icon="pencil-outline"
            placeholder="Ex. Au-dessus du lac d’Annecy"
            maxLength={120}
            value={draft.title}
            onChangeText={(value) => change('title', value)}
            error={errors.title}
            editable={!saving}
            returnKeyType="next"
            onSubmitEditing={() => fields.current.time?.focus()}
          />
          <View style={styles.formSection}>
            <View style={styles.dateTime}>
              <View style={styles.dateField}>
                <Text variant="label">Date de départ</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Date de départ : ${displayDate}`}
                  disabled={saving}
                  onPress={() => {
                    Keyboard.dismiss();
                    setDatePicker(true);
                  }}
                  style={({ pressed }) => [
                    styles.dateButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    color={colors.moss}
                    size={20}
                  />
                  <Text variant="label" style={styles.dateCopy}>
                    {displayDate}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    color={colors.forest}
                    size={16}
                  />
                </Pressable>
              </View>
              <View style={styles.timeField}>
                <FormField
                  ref={(ref) => {
                    if (ref) fields.current.time = ref;
                  }}
                  label="Heure"
                  accessibilityLabel="Heure de départ, heures et minutes"
                  icon="time-outline"
                  placeholder="09:30"
                  value={draft.time}
                  onChangeText={(value) => change('time', value)}
                  editable={!saving}
                  maxLength={5}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => fields.current.hours?.focus()}
                />
              </View>
            </View>
            {errors.date || errors.time ? (
              <Text
                accessibilityRole="alert"
                style={styles.fieldError}
                variant="caption"
              >
                {errors.date || errors.time}
              </Text>
            ) : null}
          </View>
          <View style={styles.formSection}>
            <View style={styles.sectionHeading}>
              <Text variant="label">Ta durée</Text>
              <Text variant="caption" tone="secondary">
                Obligatoire
              </Text>
            </View>
            <View style={styles.columns}>
              <View style={styles.column}>
                <FormField
                  ref={(ref) => {
                    if (ref) fields.current.hours = ref;
                  }}
                  label="Heures"
                  icon="time-outline"
                  placeholder="0"
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!saving}
                  value={draft.hours}
                  onChangeText={(value) => change('hours', value)}
                  error={errors.hours}
                />
              </View>
              <View style={styles.column}>
                <FormField
                  ref={(ref) => {
                    if (ref) fields.current.minutes = ref;
                  }}
                  label="Minutes"
                  icon="timer-outline"
                  placeholder="00"
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!saving}
                  value={draft.minutes}
                  onChangeText={(value) => change('minutes', value)}
                  error={errors.minutes}
                />
              </View>
            </View>
          </View>
          <View style={styles.formSection}>
            <View style={styles.sectionHeading}>
              <Text variant="label">Tes mesures</Text>
              <Text variant="caption" tone="secondary">
                Facultatives
              </Text>
            </View>
            <View style={styles.columns}>
              <View style={styles.column}>
                <FormField
                  ref={(ref) => {
                    if (ref) fields.current.distance = ref;
                  }}
                  label="Distance · km"
                  icon="navigate-outline"
                  placeholder="Ex. 8,5"
                  keyboardType="decimal-pad"
                  maxLength={12}
                  editable={!saving}
                  value={draft.distance}
                  onChangeText={(value) => change('distance', value)}
                  error={errors.distance}
                />
              </View>
              <View style={styles.column}>
                <FormField
                  ref={(ref) => {
                    if (ref) fields.current.elevationGain = ref;
                  }}
                  label="Dénivelé + · m"
                  icon="trending-up-outline"
                  placeholder="Ex. 450"
                  keyboardType="number-pad"
                  maxLength={10}
                  editable={!saving}
                  value={draft.elevationGain}
                  onChangeText={(value) => change('elevationGain', value)}
                  error={errors.elevationGain}
                />
              </View>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: details }}
            disabled={saving}
            onPress={() => setDetails(!details)}
            style={({ pressed }) => [
              styles.detailsToggle,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color={colors.moss}
            />
            <Text variant="label" style={styles.receiptCopy}>
              Lieu et notes
            </Text>
            <Text variant="caption" tone="secondary">
              Facultatifs
            </Text>
            <Ionicons
              name={details ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.forest}
            />
          </Pressable>
          {details ? (
            <View style={styles.formSection}>
              <FormField
                label="Lieu"
                icon="location-outline"
                placeholder="Ex. Talloires"
                value={draft.city}
                onChangeText={(value) => change('city', value)}
                editable={!saving}
                maxLength={200}
              />
              <FormField
                ref={(ref) => {
                  if (ref) fields.current.notes = ref;
                }}
                label="Un souvenir de cette sortie"
                icon="create-outline"
                placeholder="Les sensations, les rencontres…"
                value={draft.notes}
                onChangeText={(value) => change('notes', value)}
                editable={!saving}
                multiline
                maxLength={500}
                style={styles.notes}
                error={errors.notes}
              />
              <Text variant="caption" tone="secondary" align="right">
                {draft.notes.length} / 500
              </Text>
            </View>
          ) : null}
          <Text variant="caption" tone="secondary">
            Saisie manuelle. Seules les informations renseignées seront ajoutées
            à ton carnet.
          </Text>
        </ScrollView>
        <View style={styles.footer}>
          {error ? (
            <View accessibilityRole="alert" style={styles.errorPanel}>
              <Text style={styles.fieldError} variant="caption">
                {error}
              </Text>
              {uncertain ? (
                <Button
                  label="Vérifier dans le carnet"
                  variant="secondary"
                  onPress={() => onJournal()}
                />
              ) : null}
            </View>
          ) : null}
          {Object.values(errors).some(Boolean) ? (
            <Text
              accessibilityRole="alert"
              style={styles.fieldError}
              variant="caption"
            >
              Vérifie les champs indiqués avant d’enregistrer.
            </Text>
          ) : null}
          <Button
            label="Enregistrer ma sortie"
            loadingLabel="Enregistrement…"
            loading={saving}
            onPress={save}
          />
        </View>
      </KeyboardAvoidingView>
      {datePicker ? (
        <ActivityDateSheet
          date={draft.date}
          onChange={(value) => change('date', value)}
          onClose={() => setDatePicker(false)}
        />
      ) : null}
      <DetailSheet
        visible={sportPicker}
        title="Choisis ton sport"
        onClose={() => setSportPicker(false)}
      >
        <View style={styles.sportsGrid}>
          {ACTIVITY_SPORTS.map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: item.value === draft.sport }}
              onPress={() => {
                change('sport', item.value);
                setSportPicker(false);
              }}
              style={({ pressed }) => [
                styles.sportOption,
                item.value === draft.sport && styles.sportSelected,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={item.icon}
                color={
                  item.value === draft.sport
                    ? colors.surfaceStrong
                    : colors.forest
                }
                size={24}
              />
              <Text
                variant="label"
                style={item.value === draft.sport ? styles.inverse : undefined}
              >
                {item.label}
              </Text>
              {item.value === draft.sport ? (
                <Ionicons
                  name="checkmark-circle"
                  color={colors.sageSoft}
                  size={18}
                />
              ) : null}
            </Pressable>
          ))}
        </View>
      </DetailSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xxs,
  },
  title: {
    fontFamily: fontFamilies.sans,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.7,
  },
  content: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  sportSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.sageSoft,
  },
  sportIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportName: { fontSize: 18, lineHeight: 25 },
  changeSport: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  receiptCopy: { flex: 1, gap: spacing.xxs },
  formSection: { gap: spacing.sm },
  sectionHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  dateTime: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  dateButton: {
    minHeight: 54,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.warmGraySoft,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.md,
  },
  dateField: { flex: 1, minWidth: 145, gap: spacing.xs },
  dateCopy: { flex: 1 },
  timeField: { width: 116 },
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  column: { flex: 1, minWidth: 125 },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    minHeight: 52,
    gap: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.warmGraySoft,
    paddingTop: spacing.sm,
  },
  notes: { minHeight: 110, textAlignVertical: 'top' },
  footer: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.warmGraySoft,
    backgroundColor: colors.canvas,
  },
  fieldError: { color: colors.danger },
  errorPanel: {
    backgroundColor: '#F3E1DD',
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radii.md,
  },
  pressed: { opacity: 0.75 },
  sportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sportOption: {
    flexBasis: '45%',
    flexGrow: 1,
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.md,
    minHeight: 96,
  },
  sportSelected: { backgroundColor: colors.forest },
  inverse: { color: colors.surfaceStrong },
  successContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  success: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  successMark: {
    width: 84,
    height: 84,
    borderRadius: radii.pill,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  successTitle: { fontSize: 30, lineHeight: 38 },
  receipt: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmGraySoft,
  },
  fullWidth: { alignSelf: 'stretch' },
});
