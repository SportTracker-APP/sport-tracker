import { api } from "./api";

export type DiscoveryGeoArea = {
  id: string;
  name: string;
  slug: string;
  type: "DEPARTMENT" | "MASSIF";
  _count: { summitLinks: number };
};

export type DiscoveryDepartment = DiscoveryGeoArea & {
  type: "DEPARTMENT";
  massifs: Array<DiscoveryGeoArea & { type: "MASSIF" }>;
};

export type GeoPreferencesResponse = {
  discovery: DiscoveryGeoArea[];
  onboardingCompleted: boolean;
};

export async function getDiscoveryGeoOptions() {
  const { data } = await api.get<DiscoveryDepartment[]>(
    "/geo-areas/discovery-options",
  );
  return data;
}

export async function getGeoPreferences() {
  const { data } = await api.get<GeoPreferencesResponse>(
    "/users/me/geo-preferences",
  );
  return data;
}

export async function updateDiscoveryGeoPreferences(geoAreaIds: string[]) {
  const { data } = await api.put<GeoPreferencesResponse>(
    "/users/me/geo-preferences/discovery",
    { geoAreaIds },
  );
  return data;
}
