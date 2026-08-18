import { expect, test, type Page, type Route } from "@playwright/test";

const user = {
  id: "exploration-user",
  firstName: "Camille",
  email: "camille@example.test",
  role: "USER",
  avatarUrl: null,
  needsDiscoveryOnboarding: false,
};

const activity = {
  id: "mandalaz",
  title: "EP27 - Trail Tête de Mandalaz",
  description: null,
  stravaActivityId: "strava-mandalaz",
  type: "ACTIVITY",
  sport: "TRAIL",
  status: "COMPLETED",
  plannedWorkoutId: null,
  completedActivityId: null,
  completedAt: null,
  celebrationSeenAt: null,
  distance: 14.2,
  duration: 126,
  movingTime: 6900,
  elevationGain: 720,
  elevationLoss: 718,
  maxAltitude: 900,
  minAltitude: 450,
  calories: null,
  averageSpeed: null,
  maxSpeed: null,
  pace: null,
  averageHeartRate: null,
  maxHeartRate: null,
  temperature: null,
  weather: null,
  city: "Annecy",
  country: "France",
  startLatitude: 45.9,
  startLongitude: 6.1,
  endLatitude: 45.91,
  endLongitude: 6.11,
  routePolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
  coverImageUrl: null,
  photoUrls: [],
  photoCount: 0,
  altitudeStream: null,
  distanceStream: null,
  startedAt: "2026-08-10T07:00:00.000Z",
  createdAt: "2026-08-10T10:00:00.000Z",
  updatedAt: "2026-08-10T10:00:00.000Z",
};

const summits = [
  {
    id: "mont-veyrier",
    name: "Mont Veyrier",
    altitude: 1291,
    coordinates: [6.194, 45.9],
    discovered: true,
    firstDiscoveredAt: "2026-07-20T08:00:00.000Z",
    latestDiscoveredAt: "2026-07-20T08:00:00.000Z",
  },
  {
    id: "mont-a-decouvrir",
    name: "Mont à découvrir",
    altitude: 1480,
    coordinates: [6.23, 45.92],
    discovered: false,
    firstDiscoveredAt: null,
    latestDiscoveredAt: null,
  },
];

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installMapboxHarness(page: Page) {
  await page.addInitScript(() => {
    type Layer = {
      id: string;
      minzoom?: number;
      layout?: Record<string, unknown>;
      [key: string]: unknown;
    };
    type Source = {
      data: unknown;
      setData: (data: unknown) => void;
    };
    type Harness = {
      layers: Record<string, Layer>;
      sources: Record<string, Source>;
      layoutCalls: Array<[string, string, unknown]>;
    };

    const harness: Harness = {
      layers: {},
      sources: {},
      layoutCalls: [],
    };
    const browserWindow = window as typeof window & {
      mapboxgl?: unknown;
      __hovrenMapState?: Harness;
    };
    browserWindow.__hovrenMapState = harness;

    class FakeBounds {
      extend() {
        return this;
      }
    }

    class FakeMap {
      private readonly canvas = document.createElement("canvas");
      private zoom = 9.4;

      constructor() {
        this.canvas.style.cursor = "";
      }

      on(event: string, layerOrListener: unknown, listener?: unknown) {
        const callback =
          typeof layerOrListener === "function" ? layerOrListener : listener;
        if (
          (event === "load" || event === "idle") &&
          typeof callback === "function"
        ) {
          queueMicrotask(() => callback());
        }
      }

      off() {}
      remove() {}
      resize() {}
      setTerrain() {}
      setFog() {}
      resetNorthPitch() {}
      fitBounds() {}
      setFilter() {}
      setPaintProperty() {}
      zoomIn() {
        this.zoom += 1;
      }
      zoomOut() {
        this.zoom -= 1;
      }
      easeTo(options: { zoom?: number }) {
        if (typeof options.zoom === "number") this.zoom = options.zoom;
      }
      getZoom() {
        return this.zoom;
      }
      getCenter() {
        return { lat: 45.9, lng: 6.13 };
      }
      getCanvas() {
        return this.canvas;
      }
      getStyle() {
        return { layers: [{ id: "place-label", type: "symbol" }] };
      }
      addSource(id: string, source: { data: unknown }) {
        harness.sources[id] = {
          data: source.data,
          setData(data: unknown) {
            harness.sources[id]!.data = data;
          },
        };
      }
      getSource(id: string) {
        return harness.sources[id];
      }
      addLayer(layer: Layer) {
        harness.layers[layer.id] = {
          ...layer,
          layout: { ...(layer.layout ?? {}) },
        };
      }
      getLayer(id: string) {
        return harness.layers[id];
      }
      setLayoutProperty(id: string, property: string, value: unknown) {
        const layer = harness.layers[id];
        if (!layer) return;
        layer.layout = { ...(layer.layout ?? {}), [property]: value };
        harness.layoutCalls.push([id, property, value]);
      }
    }

    browserWindow.mapboxgl = {
      accessToken: "",
      Map: FakeMap,
      LngLatBounds: FakeBounds,
    };
  });
}

async function mockExploration(page: Page) {
  const summitScopes: string[] = [];
  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "exploration-e2e-token");
  });
  await installMapboxHarness(page);
  await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, (route) =>
    route.abort(),
  );
  await page.route("**/users/me", (route) => fulfillJson(route, user));
  await page.route("**/users/me/geo-preferences", (route) =>
    fulfillJson(route, {
      discovery: [
        {
          id: "aravis",
          name: "Aravis",
          slug: "aravis",
          type: "MASSIF",
          _count: { summitLinks: 1 },
        },
      ],
      onboardingCompleted: true,
    }),
  );
  await page.route("**/auth/refresh", (route) =>
    fulfillJson(route, { accessToken: "exploration-e2e-token", user }),
  );
  await page.route("**/strava/status", (route) =>
    fulfillJson(route, { connected: false }),
  );
  await page.route("**/activities", (route) => fulfillJson(route, [activity]));
  await page.route("**/summits/map**", (route) => {
    const scope = new URL(route.request().url()).searchParams.get("geoAreaIds");
    summitScopes.push(scope ?? "ALL");
    return fulfillJson(route, summits);
  });

  return { getSummitScopes: () => summitScopes };
}

test("la couche Sommets révèle les noms sans jamais masquer les traces", async ({
  page,
}) => {
  await mockExploration(page);
  await page.goto("/carte", { waitUntil: "domcontentloaded" });

  const toggle = page.getByRole("button", { name: "Sommets", exact: true });
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = (
          window as typeof window & {
            __hovrenMapState?: {
              layers: Record<string, { minzoom?: number }>;
              sources: Record<
                string,
                {
                  data?: {
                    features?: Array<{
                      properties?: { name?: string; status?: string };
                    }>;
                  };
                }
              >;
            };
          }
        ).__hovrenMapState;
        const features = state?.sources["sport-summits"]?.data?.features ?? [];
        return {
          hasTraceLayer: Boolean(state?.layers["sport-traces"]),
          undiscoveredLabelZoom:
            state?.layers["sport-summit-undiscovered-labels"]?.minzoom,
          undiscoveredSummit: features.find(
            ({ properties }) => properties?.status === "UNDISCOVERED",
          )?.properties?.name,
        };
      }),
    )
    .toEqual({
      hasTraceLayer: true,
      undiscoveredLabelZoom: 11.2,
      undiscoveredSummit: "Mont à découvrir",
    });

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const layers = (
          window as typeof window & {
            __hovrenMapState?: {
              layers: Record<string, { layout?: { visibility?: string } }>;
            };
          }
        ).__hovrenMapState?.layers;
        return {
          summit: layers?.["sport-summits-undiscovered"]?.layout?.visibility,
          trace: layers?.["sport-traces"]?.layout?.visibility ?? "visible",
        };
      }),
    )
    .toEqual({ summit: "none", trace: "visible" });

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              __hovrenMapState?: {
                layers: Record<string, { layout?: { visibility?: string } }>;
              };
            }
          ).__hovrenMapState?.layers["sport-summits-undiscovered"]?.layout
            ?.visibility,
      ),
    )
    .toBe("visible");
});

test("le filtre Sommets conserve une cible tactile confortable sur mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockExploration(page);
  await page.goto("/carte", { waitUntil: "domcontentloaded" });

  const toggle = page.getByRole("button", { name: "Sommets", exact: true });
  await expect(toggle).toBeVisible();
  const box = await toggle.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);

  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - window.innerWidth,
    document: document.documentElement.scrollWidth - window.innerWidth,
  }));
  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.document).toBeLessThanOrEqual(1);
});

test("Mes territoires filtre explicitement les sommets et Tous restaure le catalogue", async ({
  page,
}) => {
  const mock = await mockExploration(page);
  await page.goto("/carte", { waitUntil: "domcontentloaded" });

  await expect.poll(() => mock.getSummitScopes().at(-1)).toBe("aravis");
  await expect(
    page.getByRole("button", { name: "Mes territoires" }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Tous les sommets" }).click();

  await expect.poll(() => mock.getSummitScopes().at(-1)).toBe("ALL");
  await expect(
    page.getByRole("button", { name: "Tous les sommets" }),
  ).toHaveAttribute("aria-pressed", "true");
});
