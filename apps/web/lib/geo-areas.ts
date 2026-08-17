import { api } from "./api";
import type { SummitGeoArea } from "./summits";

export type GeoArea = SummitGeoArea & {
  children?: SummitGeoArea[];
  parent?: SummitGeoArea | null;
  _count?: { summitLinks: number };
};

export type GeoAreaQuery = {
  type?: SummitGeoArea["type"];
  parentId?: string;
  published?: boolean;
};

export async function getGeoAreas(query: GeoAreaQuery = {}) {
  const { data } = await api.get<GeoArea[]>("/geo-areas", { params: query });
  return data;
}

export async function getGeoArea(slug: string) {
  const { data } = await api.get<GeoArea>(`/geo-areas/${slug}`);
  return data;
}
