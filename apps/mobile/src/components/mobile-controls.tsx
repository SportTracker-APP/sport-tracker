import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/src/components/text';
import { colors, fontFamilies, radii, spacing } from '@/src/theme/tokens';

type Icon = ComponentProps<typeof Ionicons>['name'];

export function IconButton({
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
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Ionicons name={icon} color={colors.forest} size={22} />
    </Pressable>
  );
}

export function ChoiceChip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: Icon;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          color={selected ? colors.surfaceStrong : colors.forest}
          size={17}
        />
      ) : null}
      <Text variant="label" style={selected ? styles.inverse : undefined}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.search}>
      <Ionicons name="search-outline" color={colors.moss} size={21} />
      <TextInput
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        placeholder={placeholder}
        placeholderTextColor={colors.warmGray}
        value={value}
        onChangeText={onChange}
        style={styles.input}
      />
      {value ? (
        <IconButton
          icon="close"
          label="Effacer la recherche"
          onPress={() => onChange('')}
        />
      ) : null}
    </View>
  );
}

/** Native modal sheet: explicit close control, Android back, scrollable at large text sizes. */
export function DetailSheet({
  visible,
  title,
  onClose,
  children,
  footer,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              maxHeight: height - insets.top - spacing.md,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <Text
              accessibilityRole="header"
              variant="label"
              style={styles.sheetHeading}
            >
              {title}
            </Text>
            <IconButton
              icon="close"
              label={`Fermer : ${title}`}
              onPress={onClose}
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetContent}
          >
            {children}
          </ScrollView>
          {footer ? <View style={styles.sheetFooter}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

export function ContentState({
  icon = 'compass-outline',
  title,
  message,
  action,
}: {
  icon?: Icon;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} color={colors.forest} size={28} />
      </View>
      <Text variant="label" style={styles.stateTitle} align="center">
        {title}
      </Text>
      <Text tone="secondary" align="center">
        {message}
      </Text>
      {action}
    </View>
  );
}

export function LoadingRows() {
  return (
    <View
      accessible
      accessibilityLabel="Chargement des données"
      accessibilityState={{ busy: true }}
      style={styles.loading}
    >
      {[0, 1, 2, 3].map((key) => (
        <View key={key} style={styles.loadingRow}>
          <View style={styles.loadingImage} />
          <View style={styles.loadingCopy}>
            <View style={styles.loadingTitle} />
            <View style={styles.loadingLine} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function DataNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <View accessibilityRole="alert" style={styles.notice}>
      <Ionicons name="cloud-offline-outline" color={colors.danger} size={20} />
      <Text variant="caption" style={styles.noticeText}>
        Actualisation impossible. Les données déjà chargées restent visibles.
      </Text>
      <IconButton
        icon="refresh"
        label="Réessayer le chargement"
        onPress={onRetry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  pressed: { opacity: 0.72 },
  chip: {
    minHeight: 44,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.warmGraySoft,
  },
  chipSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  inverse: { color: colors.surfaceStrong },
  search: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.warmGraySoft,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    paddingVertical: spacing.sm,
    fontFamily: fontFamilies.sans,
    fontSize: 16,
    color: colors.forest,
  },
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(22,42,32,0.4)',
  },
  sheet: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.warmGraySoft,
  },
  sheetHeading: { flex: 1, fontSize: 17, lineHeight: 24 },
  sheetContent: { padding: spacing.lg, gap: spacing.lg },
  sheetFooter: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  state: {
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  stateIcon: {
    width: 60,
    height: 60,
    backgroundColor: colors.sageSoft,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: { fontSize: 20, lineHeight: 26 },
  loading: { gap: spacing.sm },
  loadingRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.md,
  },
  loadingImage: {
    width: 76,
    height: 80,
    borderRadius: radii.sm,
    backgroundColor: colors.warmGraySoft,
    opacity: 0.5,
  },
  loadingCopy: { flex: 1, justifyContent: 'center', gap: spacing.sm },
  loadingTitle: {
    width: '90%',
    height: 18,
    backgroundColor: colors.warmGraySoft,
    borderRadius: 6,
    opacity: 0.5,
  },
  loadingLine: {
    width: '65%',
    height: 12,
    backgroundColor: colors.warmGraySoft,
    borderRadius: 6,
    opacity: 0.4,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: '#F3E1DD',
  },
  noticeText: { flex: 1, color: colors.danger },
});
