import Mapbox from '@rnmapbox/maps';
import { memo } from 'react';

import { colors } from '@/src/theme/tokens';

const HIDDEN_SYMBOL_LAYERS = [
  'airport-label',
  'block-number-label',
  'building-entrance',
  'building-number-label',
  'crosswalks',
  'gate-label',
  'golf-hole-label',
  'level-crossing',
  'poi-label',
  'road-exit-shield',
  'road-intersection',
  'transit-label',
] as const;

const MOTORWAY_LAYERS = [
  'road-motorway-trunk',
  'bridge-motorway-trunk',
  'tunnel-motorway-trunk',
] as const;

const PRIMARY_ROAD_LAYERS = [
  'road-primary',
  'bridge-primary',
  'tunnel-primary',
] as const;

const SECONDARY_ROAD_LAYERS = [
  'road-secondary-tertiary',
  'bridge-secondary-tertiary',
  'tunnel-secondary-tertiary',
] as const;

const MINOR_ROAD_LAYERS = [
  'road-minor',
  'road-minor-link',
  'road-street',
  'road-street-low',
  'bridge-minor',
  'bridge-minor-link',
  'bridge-street',
  'bridge-street-low',
  'tunnel-minor',
  'tunnel-minor-link',
  'tunnel-street',
  'tunnel-street-low',
] as const;

const ROAD_CASE_LAYERS = [
  'road-motorway-trunk-case',
  'road-primary-case',
  'road-secondary-tertiary-case',
  'road-minor-case',
  'road-minor-link-case',
  'road-street-case',
  'bridge-motorway-trunk-case',
  'bridge-primary-case',
  'bridge-secondary-tertiary-case',
  'bridge-minor-case',
  'bridge-minor-link-case',
  'bridge-street-case',
  'tunnel-motorway-trunk-case',
  'tunnel-primary-case',
  'tunnel-secondary-tertiary-case',
  'tunnel-minor-case',
  'tunnel-minor-link-case',
  'tunnel-street-case',
] as const;

const TRAIL_LAYERS = [
  'road-path-trail',
  'bridge-path-trail',
  'tunnel-path-trail',
] as const;

const PATH_LAYERS = [
  'road-path',
  'road-path-cycleway-piste',
  'bridge-path',
  'bridge-path-cycleway-piste',
  'tunnel-path',
  'tunnel-path-cycleway-piste',
] as const;

export const HovrenMapStyle = memo(function HovrenMapStyle({
  is3D,
}: {
  is3D: boolean;
}) {
  return (
    <>
      <Mapbox.BackgroundLayer
        existing
        id="land"
        style={{ backgroundColor: '#EFECE2' }}
      />
      <Mapbox.FillLayer
        existing
        id="water"
        style={{ fillColor: '#ACC6CA', fillOpacity: 0.88 }}
      />
      <Mapbox.FillLayer
        existing
        id="hillshade"
        style={{ fillOpacity: 0 }}
      />
      <Mapbox.LineLayer
        existing
        id="contour-line"
        minZoomLevel={10.6}
        style={{
          lineColor: '#8C7B68',
          lineOpacity: 0.42,
          lineWidth: [
            'interpolate',
            ['linear'],
            ['zoom'],
            10.6,
            0.35,
            14,
            0.72,
            16,
            1,
          ],
        }}
      />
      <Mapbox.SymbolLayer
        existing
        id="contour-label"
        style={{ textColor: '#756858', textOpacity: 0.54 }}
      />

      {TRAIL_LAYERS.map((id) => (
        <Mapbox.LineLayer
          key={id}
          existing
          id={id}
          style={{ lineColor: colors.moss, lineOpacity: 0.9 }}
        />
      ))}
      {PATH_LAYERS.map((id) => (
        <Mapbox.LineLayer
          key={id}
          existing
          id={id}
          style={{ lineColor: '#899180', lineOpacity: 0.66 }}
        />
      ))}
      <Mapbox.LineLayer
        existing
        id="road-path-bg"
        style={{ lineColor: '#F6F2E8', lineOpacity: 0.72 }}
      />

      {ROAD_CASE_LAYERS.map((id) => (
        <Mapbox.LineLayer
          key={id}
          existing
          id={id}
          style={{ lineColor: '#AFA89B', lineOpacity: 0.18 }}
        />
      ))}
      {MOTORWAY_LAYERS.map((id) => (
        <Mapbox.LineLayer
          key={id}
          existing
          id={id}
          style={{ lineColor: '#B7B0A4', lineOpacity: 0.58 }}
        />
      ))}
      {PRIMARY_ROAD_LAYERS.map((id) => (
        <Mapbox.LineLayer
          key={id}
          existing
          id={id}
          style={{ lineColor: '#C4BCAF', lineOpacity: 0.54 }}
        />
      ))}
      {SECONDARY_ROAD_LAYERS.map((id) => (
        <Mapbox.LineLayer
          key={id}
          existing
          id={id}
          style={{ lineColor: '#D2CBC0', lineOpacity: 0.46 }}
        />
      ))}
      {MINOR_ROAD_LAYERS.map((id) => (
        <Mapbox.LineLayer
          key={id}
          existing
          id={id}
          style={{ lineColor: '#DED9D0', lineOpacity: 0.34 }}
        />
      ))}

      <Mapbox.SymbolLayer
        existing
        id="road-label"
        style={{ textColor: '#716D64', textOpacity: 0.32 }}
      />
      <Mapbox.SymbolLayer
        existing
        id="road-number-shield"
        style={{ iconOpacity: 0.25, textOpacity: 0.25 }}
      />
      {HIDDEN_SYMBOL_LAYERS.map((id) => (
        <Mapbox.SymbolLayer
          key={id}
          existing
          id={id}
          style={{ visibility: 'none' }}
        />
      ))}
      <Mapbox.SymbolLayer
        existing
        id="settlement-minor-label"
        style={{ iconOpacity: 0.22, textOpacity: 0.3 }}
      />
      <Mapbox.SymbolLayer
        existing
        id="settlement-major-label"
        style={{ iconOpacity: 0.36, textOpacity: 0.58 }}
      />
      <Mapbox.SymbolLayer
        existing
        id="natural-line-label"
        style={{ textColor: '#4F5E50', textOpacity: 0.82 }}
      />
      <Mapbox.SymbolLayer
        existing
        id="natural-point-label"
        style={{ iconOpacity: 0.65, textColor: '#3D5143', textOpacity: 0.86 }}
      />
      <Mapbox.SymbolLayer
        existing
        id="water-line-label"
        style={{ textColor: '#59777B', textOpacity: 0.68 }}
      />
      <Mapbox.SymbolLayer
        existing
        id="water-point-label"
        style={{ textColor: '#59777B', textOpacity: 0.68 }}
      />
      <Mapbox.LineLayer
        existing
        id="admin-1-boundary"
        style={{ lineColor: '#8F8B82', lineOpacity: 0.16 }}
      />
      <Mapbox.LineLayer
        existing
        id="admin-0-boundary"
        style={{ lineColor: '#77736B', lineOpacity: 0.24 }}
      />

      <Mapbox.RasterDemSource
        id="hovren-terrain-dem"
        url="mapbox://mapbox.mapbox-terrain-dem-v1"
        tileSize={512}
      >
        <Mapbox.HillshadeLayer
          id="hovren-hillshade"
          belowLayerID="contour-line"
          style={{
            hillshadeAccentColor: '#6F796C',
            hillshadeExaggeration: 0.3,
            hillshadeHighlightColor: '#F7F4EB',
            hillshadeIlluminationDirection: 318,
            hillshadeShadowColor: '#263A30',
          }}
        />
      </Mapbox.RasterDemSource>
      {is3D ? (
        <Mapbox.Terrain
          sourceID="hovren-terrain-dem"
          style={{ exaggeration: 1.16 }}
        />
      ) : null}
    </>
  );
});
