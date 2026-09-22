import { SUMMIT_CATALOG } from './summit-catalog';

describe('bundled summit catalog', () => {
  it('uses stable unique identifiers', () => {
    const ids = SUMMIT_CATALOG.map((summit) => summit.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('publishes the verified Concors selection in Bouches-du-Rhône', () => {
    const byId = new Map(SUMMIT_CATALOG.map((summit) => [summit.id, summit]));

    expect(byId.get('vigie-de-marinas')).toMatchObject({
      name: 'Vigie de Marinas',
      aliases: expect.arrayContaining(['Vigie de Meyrargues']),
      administrativeAreaSlug: 'bouches-du-rhone',
      altitude: 498,
      massif: 'Massif du Concors',
      type: 'Belvédère',
      coordinates: [5.5429654, 43.626469],
    });
    expect(byId.get('le-concors')).toMatchObject({
      name: 'Le Concors',
      administrativeAreaSlug: 'bouches-du-rhone',
      altitude: 782,
      massif: 'Massif du Concors',
      type: 'Sommet',
      coordinates: [5.6141699, 43.5945673],
      imageUrl: '/summits/le-concors.webp',
    });
  });
});
