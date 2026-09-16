import Ionicons from '@expo/vector-icons/Ionicons';
import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementRef,
} from 'react';
import {
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Button, Text } from '@/src/components';
import { ContentState, DataNotice } from '@/src/components/mobile-controls';
import { getRefugeSummitImage } from '@/src/features/refuge/refuge-images';
import { colors, radii, shadows, spacing } from '@/src/theme/tokens';
import { HovrenMapStyle } from './hovren-map-style';
import {
  countNearbySummits,
  getMassifProgress,
  summitAltitude,
  summitMassif,
  summitsToGeoJson,
  validCoordinates,
  type Coordinates,
  type Summit,
} from './explore-model';

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/outdoors-v12';
const INITIAL_CENTER: Coordinates = [6.13, 45.9];

if (MAPBOX_ACCESS_TOKEN) {
  void Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
}

type ExploreMapProps = {
  allSummits: Summit[];
  error: boolean;
  loading: boolean;
  onClose: () => void;
  onRetry: () => void;
  onSelect: (id: string) => void;
  query: string;
  selected?: Summit;
  selectedMassif: string | null;
  status: 'all' | 'undiscovered' | 'discovered';
  summits: Summit[];
};

export function ExploreMap({
  allSummits,
  error,
  loading,
  onClose,
  onRetry,
  onSelect,
  query,
  selected,
  selectedMassif,
  status,
  summits,
}: ExploreMapProps) {
  const camera = useRef<ElementRef<typeof Mapbox.Camera>>(null);
  const source = useRef<Mapbox.ShapeSource>(null);
  const [is3D, setIs3D] = useState(true);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const geoJson = useMemo(
    () => summitsToGeoJson(summits, selected?.id),
    [selected?.id, summits],
  );
  const userGeoJson = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: location
        ? [
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'Point', coordinates: [...location] },
            },
          ]
        : [],
    }),
    [location],
  );
  const nearbyCount = location
    ? countNearbySummits(summits, location)
    : null;
  const visibleCoordinates = useMemo(
    () => summits.map(validCoordinates).filter(isCoordinates),
    [summits],
  );
  const searchSuggestions = query.trim().length >= 2 ? summits.slice(0, 4) : [];
  const contextualCount = location
    ? `${nearbyCount ?? 0} à proximité`
    : selectedMassif
      ? `${selectedMassif} · ${visibleCoordinates.length} sommet${visibleCoordinates.length > 1 ? 's' : ''}`
      : status === 'discovered'
        ? `${visibleCoordinates.length} découvert${visibleCoordinates.length > 1 ? 's' : ''}`
        : status === 'undiscovered'
          ? `${visibleCoordinates.length} à découvrir`
          : `${visibleCoordinates.length} sommet${visibleCoordinates.length > 1 ? 's' : ''}`;

  useEffect(() => {
    const selectedCoordinates = selected && validCoordinates(selected);
    if (!selectedCoordinates) return;
    camera.current?.setCamera({
      centerCoordinate: selectedCoordinates,
      zoomLevel: 13,
      pitch: is3D ? 42 : 0,
      heading: is3D ? -10 : 0,
      padding: {
        paddingTop: 36,
        paddingRight: 24,
        paddingBottom: 220,
        paddingLeft: 24,
      },
      animationDuration: 380,
      animationMode: 'easeTo',
    });
  }, [is3D, selected]);

  useEffect(() => {
    if (selected) return;
    camera.current?.setCamera({
      pitch: is3D ? 34 : 0,
      heading: is3D ? -8 : 0,
      animationDuration: 320,
      animationMode: 'easeTo',
    });
  }, [is3D, selected]);

  useEffect(() => {
    if (selected || !visibleCoordinates.length) return;
    const [first] = visibleCoordinates;
    if (!first) return;
    if (visibleCoordinates.length === 1) {
      camera.current?.setCamera({
        centerCoordinate: first,
        zoomLevel: 12.2,
        animationDuration: 420,
      });
      return;
    }
    const bounds = visibleCoordinates.reduce(
      (current, coordinates) => ({
        ne: [
          Math.max(current.ne[0], coordinates[0]),
          Math.max(current.ne[1], coordinates[1]),
        ] as Coordinates,
        sw: [
          Math.min(current.sw[0], coordinates[0]),
          Math.min(current.sw[1], coordinates[1]),
        ] as Coordinates,
      }),
      { ne: first, sw: first },
    );
    camera.current?.fitBounds(bounds.ne, bounds.sw, [56, 42, 70, 42], 460);
  }, [selected, visibleCoordinates]);

  const locate = async () => {
    if (locating) return;
    setLocating(true);
    setLocationMessage(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationMessage('Localisation non autorisée');
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coordinates: Coordinates = [
        current.coords.longitude,
        current.coords.latitude,
      ];
      setLocation(coordinates);
      camera.current?.setCamera({
        centerCoordinate: coordinates,
        zoomLevel: 10.6,
        pitch: is3D ? 32 : 0,
        animationDuration: 360,
        animationMode: 'easeTo',
      });
    } catch {
      setLocationMessage('Position momentanément indisponible');
    } finally {
      setLocating(false);
    }
  };

  const handleSourcePress = async (event: {
    features: GeoJSON.Feature[];
  }) => {
    Keyboard.dismiss();
    const feature = event.features[0];
    if (!feature) return;
    if (feature.properties?.cluster) {
      const coordinates = pointCoordinates(feature);
      if (!coordinates) return;
      const zoomLevel = await source.current?.getClusterExpansionZoom(feature);
      camera.current?.setCamera({
        centerCoordinate: coordinates,
        zoomLevel: zoomLevel ?? 11,
        animationDuration: 320,
      });
      return;
    }
    const summitId = feature.properties?.id;
    if (typeof summitId === 'string') onSelect(summitId);
  };

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <View style={styles.unavailable}>
        <ContentState
          icon="map-outline"
          title="La carte attend sa clé publique"
          message="Ajoute EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN pour afficher le relief. La liste reste disponible."
        />
      </View>
    );
  }

  if (!loading && error && !allSummits.length) {
    return (
      <View style={styles.unavailable}>
        <ContentState
          icon="cloud-offline-outline"
          title="La carte est indisponible"
          message="Vérifie ta connexion et réessaie."
          action={<Button label="Réessayer" onPress={onRetry} />}
        />
      </View>
    );
  }

  if (!loading && !visibleCoordinates.length) {
    return (
      <View style={styles.unavailable}>
        <ContentState
          icon="location-outline"
          title="Aucun sommet à afficher"
          message="Élargis ta recherche ou passe en Liste pour retrouver le catalogue."
        />
      </View>
    );
  }

  return (
    <View style={styles.mapShell}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={MAPBOX_STYLE_URL}
        compassEnabled
        compassFadeWhenNorth
        compassViewMargins={{ x: 12, y: 162 }}
        logoEnabled
        attributionEnabled
        scaleBarEnabled={false}
        onPress={() => Keyboard.dismiss()}
      >
        <Mapbox.Camera
          ref={camera}
          defaultSettings={{
            centerCoordinate: [...INITIAL_CENTER],
            zoomLevel: 8.8,
            pitch: 34,
            heading: -8,
          }}
          minZoomLevel={4}
          maxZoomLevel={17}
        />
        <HovrenMapStyle is3D={is3D} />
        <Mapbox.ShapeSource
          ref={source}
          id="hovren-summits"
          shape={geoJson}
          cluster
          clusterRadius={48}
          clusterMaxZoomLevel={11}
          hitbox={{ width: 48, height: 48 }}
          onPress={(event) => void handleSourcePress(event)}
        >
          <Mapbox.CircleLayer
            id="hovren-clusters"
            filter={['has', 'point_count']}
            style={{
              circleColor: colors.forest,
              circleRadius: ['step', ['get', 'point_count'], 19, 12, 23, 35, 28],
              circleStrokeColor: colors.surfaceStrong,
              circleStrokeWidth: 3,
            }}
          />
          <Mapbox.SymbolLayer
            id="hovren-cluster-count"
            filter={['has', 'point_count']}
            style={{
              textField: ['get', 'point_count_abbreviated'],
              textColor: colors.surfaceStrong,
              textSize: 13,
            }}
          />
          <Mapbox.CircleLayer
            id="hovren-undiscovered"
            filter={[
              'all',
              ['!', ['has', 'point_count']],
              ['==', ['get', 'discovered'], false],
            ]}
            style={{
              circleColor: colors.surfaceStrong,
              circleRadius: 12,
              circleStrokeColor: colors.forest,
              circleStrokeWidth: 2.5,
            }}
          />
          <Mapbox.SymbolLayer
            id="hovren-undiscovered-icon"
            filter={[
              'all',
              ['!', ['has', 'point_count']],
              ['==', ['get', 'discovered'], false],
            ]}
            style={{
              textField: '△',
              textColor: colors.forest,
              textSize: 14,
              textOffset: [0, -0.05],
            }}
          />
          <Mapbox.CircleLayer
            id="hovren-discovered"
            filter={[
              'all',
              ['!', ['has', 'point_count']],
              ['==', ['get', 'discovered'], true],
            ]}
            style={{
              circleColor: colors.terracotta,
              circleRadius: 12,
              circleStrokeColor: colors.surfaceStrong,
              circleStrokeWidth: 2.5,
            }}
          />
          <Mapbox.SymbolLayer
            id="hovren-discovered-icon"
            filter={[
              'all',
              ['!', ['has', 'point_count']],
              ['==', ['get', 'discovered'], true],
            ]}
            style={{
              textField: '✓',
              textColor: colors.surfaceStrong,
              textSize: 13,
              textOffset: [0, -0.05],
            }}
          />
          <Mapbox.CircleLayer
            id="hovren-selected"
            filter={[
              'all',
              ['!', ['has', 'point_count']],
              ['==', ['get', 'selected'], true],
            ]}
            style={{
              circleColor: 'transparent',
              circleRadius: 18,
              circleStrokeColor: colors.terracotta,
              circleStrokeWidth: 3,
            }}
          />
          <Mapbox.SymbolLayer
            id="hovren-summit-labels"
            minZoomLevel={11.2}
            filter={['!', ['has', 'point_count']]}
            style={{
              textField: ['get', 'label'],
              textColor: colors.forestDeep,
              textSize: 11,
              textOffset: [0, 1.8],
              textHaloColor: colors.surfaceStrong,
              textHaloWidth: 1.5,
              textLineHeight: 1.05,
              textMaxWidth: 13,
              textOptional: true,
            }}
          />
        </Mapbox.ShapeSource>
        {location ? (
          <Mapbox.ShapeSource id="hovren-user-location" shape={userGeoJson}>
            <Mapbox.CircleLayer
              id="hovren-user-location-halo"
              style={{
                circleColor: colors.white,
                circleRadius: 11,
                circleOpacity: 0.7,
              }}
            />
            <Mapbox.CircleLayer
              id="hovren-user-location-dot"
              style={{
                circleColor: colors.forest,
                circleRadius: 6,
                circleStrokeColor: colors.white,
                circleStrokeWidth: 2,
              }}
            />
          </Mapbox.ShapeSource>
        ) : null}
      </Mapbox.MapView>

      <View style={styles.mapTopBar} pointerEvents="box-none">
        <View style={styles.mapCount}>
          <Ionicons name="triangle" color={colors.forest} size={12} />
          <Text variant="caption">
            {contextualCount}
          </Text>
        </View>
        {nearbyCount !== null ? (
          <View style={styles.nearbyPill}>
            <Text variant="caption" style={styles.nearbyText}>
              {nearbyCount} à moins de 30 km
            </Text>
          </View>
        ) : null}
      </View>

      {searchSuggestions.length ? (
        <View style={styles.searchResults}>
          {searchSuggestions.map((summit) => (
            <Pressable
              key={summit.id}
              accessibilityRole="button"
              onPress={() => onSelect(summit.id)}
              style={({ pressed }) => [
                styles.searchResult,
                pressed && styles.controlPressed,
              ]}
            >
              <View style={styles.searchResultIcon}>
                <Ionicons
                  name={summit.discovered ? 'checkmark' : 'triangle-outline'}
                  size={15}
                  color={summit.discovered ? colors.terracotta : colors.forest}
                />
              </View>
              <View style={styles.searchResultCopy}>
                <Text variant="label" numberOfLines={1}>
                  {summit.name}
                </Text>
                <Text variant="caption" tone="secondary" numberOfLines={1}>
                  {[summitAltitude(summit), summitMassif(summit)]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <Ionicons name="locate-outline" size={17} color={colors.forest} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.mapControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Passer en vue ${is3D ? '2D' : '3D'}`}
          onPress={() => setIs3D((value) => !value)}
          style={({ pressed }) => [
            styles.mapControl,
            pressed && styles.controlPressed,
          ]}
        >
          <Text variant="caption" style={styles.controlLabel}>
            {is3D ? '3D' : '2D'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Me localiser"
          disabled={locating}
          onPress={() => void locate()}
          style={({ pressed }) => [
            styles.mapControl,
            location && styles.mapControlActive,
            pressed && styles.controlPressed,
            locating && styles.controlDisabled,
          ]}
        >
          <Ionicons
            name={locating ? 'hourglass-outline' : 'locate'}
            size={20}
            color={location ? colors.surfaceStrong : colors.forest}
          />
        </Pressable>
      </View>

      {locationMessage ? (
        <View style={styles.locationNotice}>
          <Text variant="caption">{locationMessage}</Text>
        </View>
      ) : null}
      {error ? (
        <View style={styles.errorNotice}>
          <DataNotice onRetry={onRetry} />
        </View>
      ) : null}
      {loading ? (
        <View style={styles.loadingPill}>
          <Text variant="caption">Actualisation de la carte…</Text>
        </View>
      ) : null}
      {selected ? (
        <MapSummitCard
          allSummits={allSummits}
          summit={selected}
          onClose={onClose}
        />
      ) : null}
    </View>
  );
}

function MapSummitCard({
  allSummits,
  onClose,
  summit,
}: {
  allSummits: Summit[];
  onClose: () => void;
  summit: Summit;
}) {
  const image = getRefugeSummitImage(summit.name);
  const progress = getMassifProgress(allSummits, summit);
  return (
    <View style={styles.summitCard}>
      <View style={styles.sheetHandle} />
      <View style={styles.cardRow}>
        {image ? (
          <Image
            source={image.source}
            style={styles.cardImage}
            accessibilityLabel={summit.name}
          />
        ) : (
          <View style={[styles.cardImage, styles.cardImageFallback]}>
            <Ionicons name="triangle-outline" size={27} color={colors.moss} />
          </View>
        )}
        <View style={styles.cardCopy}>
          <View style={styles.cardEyebrow}>
            <Text variant="eyebrow" tone="accent">
              {summit.discovered ? 'Dans ton carnet' : 'À découvrir'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer la fiche"
              hitSlop={10}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.controlPressed,
              ]}
            >
              <Ionicons name="close" size={20} color={colors.forest} />
            </Pressable>
          </View>
          <Text variant="heading" numberOfLines={2} style={styles.cardTitle}>
            {summit.name}
          </Text>
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {[summitAltitude(summit), summitMassif(summit)]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      </View>
      {progress ? (
        <View style={styles.progressRow}>
          <View style={styles.progressCopy}>
            <Text variant="caption" numberOfLines={1}>
              Progression · {progress.massif}
            </Text>
            <Text variant="caption" tone="secondary">
              {progress.discovered}/{progress.total} sommets
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress.percent}%` },
              ]}
            />
          </View>
          <Text variant="label">{progress.percent} %</Text>
        </View>
      ) : null}
    </View>
  );
}

function isCoordinates(
  coordinates: Coordinates | null,
): coordinates is Coordinates {
  return coordinates !== null;
}

function pointCoordinates(feature: GeoJSON.Feature): Coordinates | null {
  if (feature.geometry.type !== 'Point') return null;
  const [longitude, latitude] = feature.geometry.coordinates;
  return typeof longitude === 'number' && typeof latitude === 'number'
    ? [longitude, latitude]
    : null;
}

const styles = StyleSheet.create({
  mapShell: { flex: 1, overflow: 'hidden', backgroundColor: colors.sageMist },
  map: { flex: 1 },
  unavailable: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  mapTopBar: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mapCount: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 253, 248, 0.94)',
    ...shadows.card,
  },
  nearbyPill: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(32, 55, 43, 0.92)',
  },
  nearbyText: { color: colors.surfaceStrong },
  mapControls: {
    position: 'absolute',
    top: 58,
    right: spacing.sm,
    gap: spacing.xs,
  },
  mapControl: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 253, 248, 0.96)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmGraySoft,
    ...shadows.card,
  },
  mapControlActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  controlLabel: { color: colors.forest },
  controlPressed: { opacity: 0.76, transform: [{ scale: 0.97 }] },
  controlDisabled: { opacity: 0.54 },
  searchResults: {
    position: 'absolute',
    top: 58,
    left: spacing.sm,
    right: 68,
    overflow: 'hidden',
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmGraySoft,
    ...shadows.card,
  },
  searchResult: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.warmGraySoft,
  },
  searchResultIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.sageMist,
  },
  searchResultCopy: { flex: 1 },
  locationNotice: {
    position: 'absolute',
    right: spacing.sm,
    top: 158,
    maxWidth: 220,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceStrong,
    ...shadows.card,
  },
  errorNotice: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    top: 60,
  },
  loadingPill: {
    position: 'absolute',
    alignSelf: 'center',
    top: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 253, 248, 0.94)',
  },
  summitCard: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmGraySoft,
    ...shadows.floating,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    alignSelf: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.warmGraySoft,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardImage: { width: 76, height: 78, borderRadius: radii.md },
  cardImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sageSoft,
  },
  cardCopy: { flex: 1, gap: spacing.xxs },
  cardEyebrow: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.xs,
    marginRight: -spacing.xs,
    borderRadius: radii.pill,
  },
  cardTitle: { fontSize: 23, lineHeight: 27 },
  progressRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressCopy: { maxWidth: 148 },
  progressTrack: {
    flex: 1,
    height: 7,
    overflow: 'hidden',
    borderRadius: radii.pill,
    backgroundColor: colors.sageSoft,
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.terracotta,
  },
});
