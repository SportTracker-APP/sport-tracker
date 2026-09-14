import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text } from '@/src/components';
import {
  ChoiceChip,
  ContentState,
  DataNotice,
  DetailSheet,
  LoadingRows,
  SearchField,
} from '@/src/components/mobile-controls';
import { getRefugeSummitImage } from '@/src/features/refuge/refuge-images';
import { colors, fontFamilies, radii, spacing } from '@/src/theme/tokens';
import {
  DEFAULT_FILTERS,
  filterSummits,
  summitAltitude,
  summitMassif,
  validCoordinates,
  type ExploreFilters,
  type Summit,
} from './explore-model';
import { useExploreData } from './use-explore-data';

export default function ExploreScreen() {
  const data = useExploreData();
  const { summit } = useLocalSearchParams<{ summit?: string }>();
  return (
    <ExploreView
      {...data}
      selectedId={summit}
      onSelect={(id) => router.setParams({ summit: id })}
      onClose={() => router.setParams({ summit: undefined })}
    />
  );
}

export type ExploreViewProps = ReturnType<typeof useExploreData> & {
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function ExploreView({
  summits,
  loading,
  error,
  refresh,
  selectedId,
  onSelect,
  onClose,
}: ExploreViewProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ExploreFilters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<ExploreFilters | null>(null);
  const results = useMemo(
    () => filterSummits(summits ?? [], query, filters),
    [summits, query, filters],
  );
  const massifs = useMemo(
    () =>
      [...new Set((summits ?? []).map(summitMassif).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, 'fr'),
      ),
    [summits],
  );
  const selected = summits?.find((item) => item.id === selectedId);
  const advancedCount =
    Number(filters.massif !== null) +
    Number(filters.altitude !== 'all') +
    Number(filters.sort !== 'name');
  const draftCount = draft
    ? filterSummits(summits ?? [], query, draft).length
    : 0;
  const hasFilters = Boolean(
    query.trim() || filters.status !== 'all' || advancedCount,
  );
  const reset = () => {
    setQuery('');
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.toolbar}>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text accessibilityRole="header" style={styles.title}>
              Explorer
            </Text>
            <Text variant="caption" tone="secondary">
              Trouve ton prochain sommet.
            </Text>
          </View>
          <View style={styles.compass}>
            <Ionicons name="compass-outline" size={27} color={colors.forest} />
          </View>
        </View>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Un sommet, un massif…"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          keyboardShouldPersistTaps="handled"
        >
          <ChoiceChip
            label="Tous"
            selected={filters.status === 'all'}
            onPress={() => setFilters({ ...filters, status: 'all' })}
          />
          <ChoiceChip
            label="À découvrir"
            selected={filters.status === 'undiscovered'}
            onPress={() => setFilters({ ...filters, status: 'undiscovered' })}
          />
          <ChoiceChip
            label="Découverts"
            icon="checkmark-circle-outline"
            selected={filters.status === 'discovered'}
            onPress={() => setFilters({ ...filters, status: 'discovered' })}
          />
        </ScrollView>
        <View style={styles.resultsHeader}>
          <Text
            variant="caption"
            tone="secondary"
            accessibilityLiveRegion="polite"
            style={styles.resultCopy}
          >
            {summits === null
              ? loading
                ? 'Chargement du catalogue…'
                : 'Catalogue indisponible'
              : `${results.length} sommet${results.length > 1 ? 's' : ''}${filters.massif ? ` · ${filters.massif}` : ''}`}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Filtres et tri${advancedCount ? `, ${advancedCount} actifs` : ''}`}
            onPress={() => setDraft({ ...filters })}
            style={({ pressed }) => [
              styles.filterButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="options-outline" color={colors.forest} size={19} />
            <Text variant="label">
              Filtres{advancedCount ? ` · ${advancedCount}` : ''}
            </Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading && summits !== null}
            onRefresh={() => void refresh()}
            tintColor={colors.forest}
            colors={[colors.forest]}
          />
        }
        ListHeaderComponent={
          error && summits !== null ? (
            <DataNotice onRetry={() => void refresh()} />
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          summits === null && loading ? (
            <LoadingRows />
          ) : summits === null ? (
            <ContentState
              icon="cloud-offline-outline"
              title="Le catalogue est indisponible"
              message="Vérifie ta connexion et réessaie."
              action={
                <Button label="Réessayer" onPress={() => void refresh()} />
              }
            />
          ) : (
            <ContentState
              title={
                hasFilters
                  ? 'Aucun sommet trouvé'
                  : 'Le catalogue arrive bientôt'
              }
              message={
                hasFilters
                  ? 'Essaie un autre nom ou élargis tes filtres.'
                  : 'Les sommets publiés apparaîtront ici.'
              }
              action={
                hasFilters ? (
                  <Button
                    label="Effacer les filtres"
                    variant="secondary"
                    onPress={reset}
                  />
                ) : undefined
              }
            />
          )
        }
        renderItem={({ item }) => (
          <SummitRow summit={item} onPress={() => onSelect(item.id)} />
        )}
      />

      <DetailSheet
        visible={draft !== null}
        title="Filtres et tri"
        onClose={() => setDraft(null)}
        footer={
          <Button
            label={`Afficher ${draftCount} sommet${draftCount > 1 ? 's' : ''}`}
            onPress={() => {
              if (draft) setFilters(draft);
              setDraft(null);
            }}
          />
        }
      >
        {draft ? (
          <>
            <FilterGroup title="Massif">
              <ChoiceChip
                label="Tous les massifs"
                selected={draft.massif === null}
                onPress={() => setDraft({ ...draft, massif: null })}
              />
              {massifs.map((massif) => (
                <ChoiceChip
                  key={massif}
                  label={massif}
                  selected={draft.massif === massif}
                  onPress={() => setDraft({ ...draft, massif })}
                />
              ))}
            </FilterGroup>
            <FilterGroup title="Altitude du sommet">
              <ChoiceChip
                label="Toutes"
                selected={draft.altitude === 'all'}
                onPress={() => setDraft({ ...draft, altitude: 'all' })}
              />
              <ChoiceChip
                label="Moins de 2 000 m"
                selected={draft.altitude === 'under2000'}
                onPress={() => setDraft({ ...draft, altitude: 'under2000' })}
              />
              <ChoiceChip
                label="2 000 m et plus"
                selected={draft.altitude === 'over2000'}
                onPress={() => setDraft({ ...draft, altitude: 'over2000' })}
              />
            </FilterGroup>
            <FilterGroup title="Trier par">
              <ChoiceChip
                label="Nom A → Z"
                selected={draft.sort === 'name'}
                onPress={() => setDraft({ ...draft, sort: 'name' })}
              />
              <ChoiceChip
                label="Altitude décroissante"
                selected={draft.sort === 'altitude'}
                onPress={() => setDraft({ ...draft, sort: 'altitude' })}
              />
            </FilterGroup>
            <Button
              label="Réinitialiser ces filtres"
              variant="secondary"
              onPress={() =>
                setDraft({ ...DEFAULT_FILTERS, status: draft.status })
              }
            />
          </>
        ) : null}
      </DetailSheet>
      <DetailSheet
        visible={Boolean(selectedId)}
        title="Le sommet"
        onClose={onClose}
      >
        {selected ? (
          <SummitDetail key={selected.id} summit={selected} />
        ) : loading ? (
          <LoadingRows />
        ) : (
          <ContentState
            title="Sommet indisponible"
            message={
              error
                ? 'Impossible de charger ce sommet pour le moment.'
                : 'Ce sommet ne figure plus dans le catalogue disponible.'
            }
            action={
              error ? (
                <Button label="Réessayer" onPress={() => void refresh()} />
              ) : undefined
            }
          />
        )}
      </DetailSheet>
    </SafeAreaView>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.filterGroup}>
      <Text variant="label">{title}</Text>
      <View style={styles.wrap}>{children}</View>
    </View>
  );
}

export function SummitRow({
  summit,
  onPress,
}: {
  summit: Summit;
  onPress: () => void;
}) {
  const image = getRefugeSummitImage(summit.name);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${summit.name}, ${summitAltitude(summit)}, ${summit.discovered ? 'découvert' : 'à découvrir'}`}
      accessibilityHint="Ouvre la fiche du sommet"
      android_ripple={{ color: colors.sageSoft }}
      onPress={onPress}
      style={({ pressed }) => [styles.summitRow, pressed && styles.pressed]}
    >
      {image ? (
        <Image
          accessible={false}
          source={image.source}
          style={styles.thumbnail}
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailFallback]}>
          <Ionicons name="triangle-outline" color={colors.moss} size={30} />
        </View>
      )}
      <View style={styles.rowCopy}>
        <Text variant="label" numberOfLines={2} style={styles.rowTitle}>
          {summit.name}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={2}>
          {[summitAltitude(summit), summitMassif(summit)]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        <View style={styles.status}>
          <Ionicons
            name={summit.discovered ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={summit.discovered ? colors.success : colors.warmGray}
          />
          <Text
            variant="caption"
            style={summit.discovered ? styles.discovered : undefined}
            tone="secondary"
          >
            {summit.discovered ? 'Dans ton carnet' : 'À découvrir'}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" color={colors.forest} size={18} />
    </Pressable>
  );
}

function SummitDetail({ summit }: { summit: Summit }) {
  const image = getRefugeSummitImage(summit.name);
  const coordinates = validCoordinates(summit);
  const [mapError, setMapError] = useState(false);
  const [opening, setOpening] = useState(false);
  const discoveryDate = summit.latestDiscoveredAt
    ? new Date(summit.latestDiscoveredAt)
    : null;
  const openMap = async () => {
    if (!coordinates || opening) return;
    setOpening(true);
    setMapError(false);
    const [longitude, latitude] = coordinates;
    const url =
      Platform.OS === 'ios'
        ? `https://maps.apple.com/?ll=${latitude},${longitude}&q=${encodeURIComponent(summit.name)}`
        : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    try {
      await Linking.openURL(url);
    } catch {
      setMapError(true);
    } finally {
      setOpening(false);
    }
  };

  return (
    <>
      {image ? (
        <View>
          <Image
            source={image.source}
            style={styles.detailImage}
            accessibilityLabel={summit.name}
          />
          <Text variant="caption" tone="secondary" style={styles.credit}>
            {image.credit}
          </Text>
        </View>
      ) : null}
      <View style={styles.detailIntro}>
        <Text variant="caption" tone="secondary">
          {summitMassif(summit) || 'Sommet'}
        </Text>
        <Text variant="heading" accessibilityRole="header">
          {summit.name}
        </Text>
      </View>
      <View style={styles.factStrip}>
        <View style={styles.fact}>
          <Ionicons name="triangle-outline" size={21} color={colors.moss} />
          <Text variant="label">{summitAltitude(summit)}</Text>
          <Text variant="caption" tone="secondary">
            Altitude
          </Text>
        </View>
        {summit.difficulty ? (
          <View style={styles.fact}>
            <Ionicons name="trail-sign-outline" size={21} color={colors.moss} />
            <Text variant="label">{summit.difficulty}</Text>
            <Text variant="caption" tone="secondary">
              Difficulté du catalogue
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.discoveryPanel}>
        <Ionicons
          name={summit.discovered ? 'checkmark-circle' : 'flag-outline'}
          size={24}
          color={colors.forest}
        />
        <View style={styles.rowCopy}>
          <Text variant="label">
            {summit.discovered
              ? 'Une découverte dans ton carnet'
              : 'À découvrir'}
          </Text>
          <Text variant="caption" tone="secondary">
            {summit.discovered &&
            discoveryDate &&
            Number.isFinite(discoveryDate.getTime())
              ? `Dernière découverte le ${discoveryDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.`
              : summit.discovered
                ? 'Ce sommet fait partie de tes découvertes confirmées.'
                : 'Ce sommet n’a pas encore été validé dans ton carnet.'}
          </Text>
        </View>
      </View>
      {coordinates ? (
        <Button
          label={
            Platform.OS === 'ios'
              ? 'Situer dans Plans'
              : 'Situer dans Google Maps'
          }
          loading={opening}
          onPress={() => void openMap()}
        />
      ) : (
        <Text variant="caption" tone="secondary">
          Position non renseignée pour ce sommet.
        </Text>
      )}
      {mapError ? (
        <Text accessibilityRole="alert" tone="accent">
          La carte n’a pas pu s’ouvrir. Réessaie dans un instant.
        </Text>
      ) : null}
    </>
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
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleCopy: { flex: 1, gap: spacing.xxs },
  title: {
    fontFamily: fontFamilies.sans,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.7,
  },
  compass: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { gap: spacing.xs, paddingRight: spacing.xxs },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: -spacing.xs,
  },
  resultCopy: { flex: 1 },
  filterButton: {
    minHeight: 44,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
  },
  list: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xxs,
    flexGrow: 1,
  },
  separator: { height: spacing.sm },
  summitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 122,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmGraySoft,
    overflow: 'hidden',
  },
  thumbnail: { width: 76, height: 92, borderRadius: radii.sm },
  thumbnailFallback: {
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, gap: spacing.xxs },
  rowTitle: { fontSize: 16, lineHeight: 21 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  discovered: { color: colors.success },
  pressed: { backgroundColor: colors.sageSoft, opacity: 0.85 },
  filterGroup: { gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  detailImage: { width: '100%', height: 190, borderRadius: radii.md },
  credit: { marginTop: spacing.xxs, fontSize: 11, lineHeight: 16 },
  detailIntro: { gap: spacing.xxs },
  factStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fact: {
    flex: 1,
    minWidth: 120,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
  },
  discoveryPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.sageSoft,
    borderRadius: radii.md,
  },
});
