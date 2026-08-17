import { GeoAreaType } from '@prisma/client';

export type GeoAreaCatalogEntry = {
  id: string;
  name: string;
  slug: string;
  type: GeoAreaType;
  parentSlug: string | null;
  isPublished: boolean;
};

function northernAlpsMassif(
  id: string,
  name: string,
  slug: string,
  isPublished: boolean,
): GeoAreaCatalogEntry {
  return {
    id,
    name,
    slug,
    type: GeoAreaType.MASSIF,
    parentSlug: 'alpes-du-nord',
    isPublished,
  };
}

function frenchMountainChain(
  id: string,
  name: string,
  slug: string,
): GeoAreaCatalogEntry {
  return {
    id,
    name,
    slug,
    type: GeoAreaType.MOUNTAIN_CHAIN,
    parentSlug: 'france',
    isPublished: false,
  };
}

export const GEO_AREA_CATALOG: GeoAreaCatalogEntry[] = [
  {
    id: 'geo-france',
    name: 'France',
    slug: 'france',
    type: GeoAreaType.COUNTRY,
    parentSlug: null,
    isPublished: true,
  },
  {
    id: 'geo-alpes',
    name: 'Alpes',
    slug: 'alpes',
    type: GeoAreaType.MOUNTAIN_CHAIN,
    parentSlug: 'france',
    isPublished: true,
  },
  {
    id: 'geo-alpes-du-nord',
    name: 'Alpes du Nord',
    slug: 'alpes-du-nord',
    type: GeoAreaType.SECTOR,
    parentSlug: 'alpes',
    isPublished: true,
  },
  {
    id: 'geo-alpes-du-sud',
    name: 'Alpes du Sud',
    slug: 'alpes-du-sud',
    type: GeoAreaType.SECTOR,
    parentSlug: 'alpes',
    isPublished: false,
  },
  northernAlpsMassif(
    'geo-massif-du-mont-blanc',
    'Mont-Blanc',
    'massif-du-mont-blanc',
    true,
  ),
  northernAlpsMassif('geo-bauges', 'Bauges', 'bauges', true),
  northernAlpsMassif('geo-aravis', 'Aravis', 'aravis', true),
  northernAlpsMassif('geo-vanoise', 'Vanoise', 'vanoise', false),
  northernAlpsMassif('geo-chartreuse', 'Chartreuse', 'chartreuse', false),
  northernAlpsMassif('geo-annecy', 'Annecy', 'annecy', true),
  northernAlpsMassif('geo-bornes', 'Bornes', 'bornes', true),
  northernAlpsMassif('geo-bargy', 'Bargy', 'bargy', true),
  northernAlpsMassif('geo-chablais', 'Chablais', 'chablais', true),
  northernAlpsMassif(
    'geo-aiguilles-rouges',
    'Aiguilles Rouges',
    'aiguilles-rouges',
    true,
  ),
  frenchMountainChain('geo-pyrenees', 'Pyrénées', 'pyrenees'),
  frenchMountainChain('geo-jura', 'Jura', 'jura'),
  frenchMountainChain('geo-vosges', 'Vosges', 'vosges'),
  frenchMountainChain('geo-massif-central', 'Massif central', 'massif-central'),
  frenchMountainChain('geo-corse', 'Corse', 'corse'),
];
