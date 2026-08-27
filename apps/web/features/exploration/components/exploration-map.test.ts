import { describe, expect, it, vi } from "vitest";

import type { ExplorationSummit } from "@/lib/summit-discovery";

import type { MapboxMapLike } from "../exploration-types";
import {
  DISCOVERED_SUMMIT_LABEL_MIN_ZOOM,
  DISCOVERED_SUMMIT_MARKER_MIN_ZOOM,
  getSummitsGeoJson,
  SECONDARY_SUMMIT_LABEL_MIN_ZOOM,
  SECONDARY_SUMMIT_MARKER_MIN_ZOOM,
  setSummitLayersVisibility,
  SUMMIT_LAYER_IDS,
  UNDISCOVERED_SUMMIT_LABEL_MIN_ZOOM,
  UNDISCOVERED_SUMMIT_MARKER_MIN_ZOOM,
} from "./exploration-map";

function createSummit(
  overrides: Partial<ExplorationSummit> = {},
): ExplorationSummit {
  return {
    id: "mont-veyrier",
    name: "Mont Veyrier",
    altitude: 1291,
    coordinates: [6.18, 45.9],
    discovered: false,
    firstDiscoveredAt: null,
    latestDiscoveredAt: null,
    ...overrides,
  };
}

describe("Exploration summit map layer", () => {
  it("distinguishes a discovered summit from a summit to discover", () => {
    const geoJson = getSummitsGeoJson([
      createSummit(),
      createSummit({
        id: "la-tournette",
        name: "La Tournette",
        discovered: true,
        firstDiscoveredAt: "2026-08-12T08:00:00.000Z",
      }),
    ]);

    expect(geoJson.features).toHaveLength(2);
    expect(geoJson.features[0]?.properties).toMatchObject({
      label: "Mont Veyrier",
      status: "UNDISCOVERED",
      bookIndex: "",
    });
    expect(geoJson.features[1]?.properties).toMatchObject({
      label: "La Tournette",
      status: "LATEST",
      bookIndex: "1",
    });
  });

  it("projects the stored longitude and latitude without a visual offset", () => {
    const feature = getSummitsGeoJson([
      createSummit({
        altitude: 3901,
        coordinates: [7.020211, 45.959721],
      }),
    ]).features[0];

    expect(feature?.geometry.coordinates).toEqual([7.020211, 45.959721]);
    expect(feature?.geometry.coordinates).toHaveLength(2);
    expect(feature?.properties.altitude).toBe(3901);
  });

  it("hides only summit layers and leaves trace layers untouched", () => {
    const setLayoutProperty = vi.fn();
    const map = {
      getLayer: vi.fn((layerId: string) =>
        SUMMIT_LAYER_IDS.includes(layerId as (typeof SUMMIT_LAYER_IDS)[number])
          ? {}
          : undefined,
      ),
      setLayoutProperty,
    } as unknown as MapboxMapLike;

    setSummitLayersVisibility(map, false);

    expect(setLayoutProperty).toHaveBeenCalledTimes(SUMMIT_LAYER_IDS.length);
    for (const layerId of SUMMIT_LAYER_IDS) {
      expect(setLayoutProperty).toHaveBeenCalledWith(
        layerId,
        "visibility",
        "none",
      );
    }
    expect(setLayoutProperty).not.toHaveBeenCalledWith(
      "sport-traces",
      expect.anything(),
      expect.anything(),
    );
  });

  it("reveals markers before labels and keeps undiscovered names for close zoom", () => {
    expect(DISCOVERED_SUMMIT_MARKER_MIN_ZOOM).toBeLessThan(
      DISCOVERED_SUMMIT_LABEL_MIN_ZOOM,
    );
    expect(UNDISCOVERED_SUMMIT_MARKER_MIN_ZOOM).toBeLessThan(
      UNDISCOVERED_SUMMIT_LABEL_MIN_ZOOM,
    );
    expect(UNDISCOVERED_SUMMIT_LABEL_MIN_ZOOM).toBe(11.2);
    expect(SECONDARY_SUMMIT_MARKER_MIN_ZOOM).toBe(10.6);
    expect(SECONDARY_SUMMIT_LABEL_MIN_ZOOM).toBe(13);
  });

  it("keeps a secondary point outside the numbered summit notebook", () => {
    const secondary = getSummitsGeoJson([
      createSummit({
        catalogTier: "SECONDARY",
        discovered: true,
        firstDiscoveredAt: "2026-08-12T08:00:00.000Z",
      }),
    ]).features[0]?.properties;

    expect(secondary).toMatchObject({ tier: "SECONDARY", bookIndex: "" });
  });
});
