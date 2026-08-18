import { describe, expect, it } from "vitest";

import type { ExplorationSummit } from "@/lib/summit-discovery";

import { getSummitsGeoJson } from "./components/exploration-map";

function createSyntheticSummits(volume: number): ExplorationSummit[] {
  return Array.from({ length: volume }, (_, index) => ({
    id: `synthetic-summit-${index}`,
    name: `Sommet synthétique ${index}`,
    altitude: 800 + (index % 3_200),
    coordinates: [-4.8 + (index % 180) * 0.06, 42.3 + (index % 120) * 0.045],
    discovered: index % 11 === 0,
    firstDiscoveredAt: index % 11 === 0 ? "2026-08-01T08:00:00.000Z" : null,
    latestDiscoveredAt: index % 11 === 0 ? "2026-08-01T08:00:00.000Z" : null,
  }));
}

describe.each([100, 1_000, 5_000])(
  "Exploration with %i synthetic summits",
  (volume) => {
    it("keeps one compact GeoJSON feature per summit", () => {
      const summits = createSyntheticSummits(volume);
      const startedAt = performance.now();
      const geoJson = getSummitsGeoJson(summits);
      const serialized = JSON.stringify(geoJson);
      const durationMs = performance.now() - startedAt;

      expect(geoJson.features).toHaveLength(volume);
      expect(serialized.length / volume).toBeLessThan(260);

      if (process.env.PHASE7_BENCHMARK === "true") {
        console.info(
          `[phase-7] ${volume} sommets: ${durationMs.toFixed(2)} ms, ${(serialized.length / 1024).toFixed(1)} KiB GeoJSON`,
        );
      }
    });
  },
);
