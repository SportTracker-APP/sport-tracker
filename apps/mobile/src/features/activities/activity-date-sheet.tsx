import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/src/components';
import {
  ChoiceChip,
  DetailSheet,
  IconButton,
} from '@/src/components/mobile-controls';
import { colors, radii, spacing } from '@/src/theme/tokens';
import {
  calendarDays,
  localDateKey,
  parseLocalStart,
} from './activity-form-model';

export function ActivityDateSheet({
  date,
  onChange,
  onClose,
}: {
  date: string;
  onChange: (date: string) => void;
  onClose: () => void;
}) {
  const [month, setMonth] = useState(
    () => parseLocalStart(date, '12:00') ?? new Date(),
  );
  const today = new Date();
  const todayKey = localDateKey(today);
  const yesterday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 1,
    12,
  );
  const canAdvance =
    month.getFullYear() < today.getFullYear() ||
    (month.getFullYear() === today.getFullYear() &&
      month.getMonth() < today.getMonth());
  const choose = (value: string) => {
    onChange(value);
    onClose();
  };

  return (
    <DetailSheet visible title="Date de la sortie" onClose={onClose}>
      <View style={styles.shortcuts}>
        <ChoiceChip
          label="Aujourd’hui"
          selected={date === todayKey}
          onPress={() => choose(todayKey)}
        />
        <ChoiceChip
          label="Hier"
          selected={date === localDateKey(yesterday)}
          onPress={() => choose(localDateKey(yesterday))}
        />
      </View>
      <View style={styles.header}>
        <IconButton
          icon="chevron-back"
          label="Mois précédent"
          onPress={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))
          }
        />
        <Text
          accessibilityLiveRegion="polite"
          style={styles.month}
          variant="label"
        >
          {month.toLocaleDateString('fr-FR', {
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        {canAdvance ? (
          <IconButton
            icon="chevron-forward"
            label="Mois suivant"
            onPress={() =>
              setMonth(
                new Date(month.getFullYear(), month.getMonth() + 1, 1, 12),
              )
            }
          />
        ) : (
          <View style={styles.arrowSpace} />
        )}
      </View>
      <View style={styles.calendar}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, index) => (
          <View key={index} style={styles.cell}>
            <Text variant="caption" tone="secondary">
              {label}
            </Text>
          </View>
        ))}
        {calendarDays(month).map((day, index) =>
          day ? (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={parseLocalStart(
                day,
                '12:00',
              )!.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              accessibilityState={{
                selected: day === date,
                disabled: day > todayKey,
              }}
              disabled={day > todayKey}
              onPress={() => choose(day)}
              style={({ pressed }) => [
                styles.cell,
                styles.day,
                day === date && styles.selected,
                day > todayKey && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text
                variant="label"
                style={day === date ? styles.selectedText : undefined}
              >
                {Number(day.slice(-2))}
              </Text>
              {day === todayKey ? (
                <View
                  style={[styles.today, day === date && styles.todaySelected]}
                />
              ) : null}
            </Pressable>
          ) : (
            <View key={`empty-${index}`} style={styles.cell} />
          ),
        )}
      </View>
      <Text variant="caption" tone="secondary">
        Choisis le jour où ta sortie a commencé.
      </Text>
    </DetailSheet>
  );
}

const styles = StyleSheet.create({
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  month: {
    flex: 1,
    textAlign: 'center',
    textTransform: 'capitalize',
    fontSize: 17,
    lineHeight: 24,
  },
  arrowSpace: { width: 44 },
  calendar: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.285714%',
    minHeight: 46,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: { borderRadius: radii.sm },
  selected: { backgroundColor: colors.forest },
  selectedText: { color: colors.surfaceStrong },
  today: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.terracotta,
    position: 'absolute',
    bottom: 4,
  },
  todaySelected: { backgroundColor: colors.sageSoft },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.7 },
});
