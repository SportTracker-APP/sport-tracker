import { GeoAreaType } from '@prisma/client';

import { GEO_AREA_CATALOG } from './geo-area-catalog';

describe('national GeoArea catalog', () => {
  it('uses stable unique identifiers and slugs', () => {
    const ids = GEO_AREA_CATALOG.map((area) => area.id);
    const slugs = GEO_AREA_CATALOG.map((area) => area.slug);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('defines parents before their children', () => {
    const knownSlugs = new Set<string>();

    for (const area of GEO_AREA_CATALOG) {
      if (area.parentSlug) {
        expect(knownSlugs.has(area.parentSlug)).toBe(true);
      }
      knownSlugs.add(area.slug);
    }
  });

  it('contains the minimal national hierarchy without publishing empty catalogs', () => {
    const bySlug = new Map(GEO_AREA_CATALOG.map((area) => [area.slug, area]));

    expect(bySlug.get('france')).toMatchObject({
      type: GeoAreaType.COUNTRY,
      parentSlug: null,
      isPublished: true,
    });
    expect(bySlug.get('alpes-du-nord')?.parentSlug).toBe('alpes');
    expect(bySlug.get('massif-du-mont-blanc')).toMatchObject({
      type: GeoAreaType.MASSIF,
      parentSlug: 'alpes-du-nord',
      isPublished: true,
    });

    for (const slug of [
      'pyrenees',
      'jura',
      'vosges',
      'massif-central',
      'corse',
    ]) {
      expect(bySlug.get(slug)?.isPublished).toBe(false);
    }
  });
});
