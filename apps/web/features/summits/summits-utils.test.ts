import { describe, expect, it } from "vitest";

import { getMassifProgress, type SummitView } from "@/lib/summit-discovery";

import {
  filterSummits,
  getFeaturedMassif,
  getLatestDiscoveredSummit,
  getNextSummitForMassif,
  getRecommendedSummit,
  getSummitCardViewModels,
  getSummitSummary,
  getSummitVisualSource,
  getSummitVisualSources,
  parseSummitFilters,
  serializeSummitFilters,
} from "./summits-utils";

function createSummit(
  overrides: Partial<SummitView> & Pick<SummitView, "id" | "name">,
): SummitView {
  const { id, name, ...optionalOverrides } = overrides;

  return {
    id,
    name,
    aliases: [],
    altitude: 1800,
    massif: "Bornes",
    difficulty: "Modérée",
    type: "Sommet",
    coordinates: [6.2, 45.9],
    discovered: false,
    closestDistance: null,
    activityCount: 0,
    firstActivity: null,
    latestActivity: null,
    firstDiscoveredAt: null,
    latestDiscoveredAt: null,
    pendingDiscoveries: [],
    ...optionalOverrides,
  };
}

describe("summits utilities", () => {
  const discovered = createSummit({
    id: "veyrier",
    name: "Mont Veyrier",
    discovered: true,
    altitude: 1291,
    activityCount: 2,
    latestActivity: {
      id: "activity-2",
      title: "Boucle du Veyrier",
      sport: "Trail",
      startedAt: "2026-07-20T08:00:00.000Z",
      distance: 12,
      elevationGain: 740,
      coverImageUrl: null,
    },
  });
  const pending = createSummit({
    id: "talamarche",
    name: "Pointe de Talamarche",
    altitude: 1852,
    massif: "Bornes",
    pendingDiscoveries: [
      {
        id: "pending-1",
        confidence: 0.82,
        closestDistance: 48,
        activity: {
          id: "activity-3",
          title: "Trail des Bornes",
          sport: "Trail",
          startedAt: "2026-07-21T08:00:00.000Z",
          distance: 18,
          elevationGain: 1200,
          coverImageUrl: null,
        },
      },
    ],
  });
  const missing = createSummit({
    id: "sous-dine",
    name: "Montagne de Sous-Dine",
    altitude: 2004,
    massif: "Bornes",
    closestDistance: 620,
  });

  it("calcule les statuts et la progression réelle", () => {
    expect(getSummitSummary([discovered, pending, missing])).toEqual({
      discoveredCount: 1,
      pendingCount: 1,
      missingCount: 1,
      totalCount: 3,
      coveredMassifs: 1,
      completedMassifs: 0,
      totalPassages: 2,
      discoveryProgress: 33,
      highestAltitude: 1291,
    });
  });

  it("filtre par statut, recherche et altitude", () => {
    expect(
      filterSummits([discovered, pending, missing], {
        status: "MISSING",
        viewMode: "CARDS",
        searchQuery: "sous dine",
        massif: "Bornes",
        altitude: "MID",
        sort: "NAME",
      }).map((summit) => summit.id),
    ).toEqual(["sous-dine"]);
  });

  it("rend un sommet secondaire accessible uniquement par une recherche explicite", () => {
    const secondary = createSummit({
      id: "pointe-secondaire",
      name: "Pointe secondaire",
      catalogTier: "SECONDARY",
    });
    const filters = {
      status: "DISCOVERED" as const,
      viewMode: "CARDS" as const,
      searchQuery: "pointe secondaire",
      massif: "ALL",
      altitude: "ALL" as const,
      sort: "NAME" as const,
    };

    expect(filterSummits([discovered, secondary], filters)).toEqual([
      secondary,
    ]);

    expect(getSummitCardViewModels([secondary], [])[0]).toMatchObject({
      statusLabel: "Point remarquable",
      passageLabel: "Hors progression principale",
      ctaLabel: "Voir le repère",
      secondaryInfo: {
        label: "Sommet secondaire · repère informatif",
      },
    });
  });

  it("recommande un sommet réellement manquant dans un massif en cours", () => {
    expect(getRecommendedSummit([discovered, pending, missing])?.id).toBe(
      "sous-dine",
    );
  });

  it("privilégie la photo du sommet et ignore les médias de sortie", () => {
    const withActivityPhoto = createSummit({
      ...discovered,
      imageUrl: "https://commons.wikimedia.org/summit.jpg",
      imageCredit: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Summit.jpg",
      firstActivity: {
        ...discovered.latestActivity!,
        id: "activity-first",
        coverImageUrl: "https://example.test/discovery-activity.jpg",
      },
      latestActivity: {
        ...discovered.latestActivity!,
        coverImageUrl: "https://example.test/latest-passage.jpg",
      },
    });
    const withVerifiedEditorialPhoto = createSummit({
      id: "editorial",
      name: "Sommet éditorial",
      imageUrl: "https://commons.wikimedia.org/summit.jpg",
      imageCredit: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Summit.jpg",
    });
    const withAdminEditorialPhoto = createSummit({
      id: "admin-editorial",
      name: "Sommet éditorial administré",
      imageUrl:
        "https://project-ref.supabase.co/storage/v1/object/public/summit-images/summit.webp?v=1",
      imageCredit: "CC BY-SA 3.0",
    });
    const withGenericPhoto = createSummit({
      id: "generic",
      name: "Sommet générique",
      imageUrl: "https://images.pexels.com/mountain.jpg",
      imageCredit: "Image montagne",
    });
    const withoutCatalogPhoto = createSummit({
      id: "without-catalog-photo",
      name: "Sommet sans photo",
      firstActivity: {
        ...discovered.latestActivity!,
        id: "activity-with-photo",
        coverImageUrl: "https://dgtzuqphqg23d.cloudfront.net/strava-photo.jpg",
      },
    });

    expect(getSummitVisualSource(withActivityPhoto).kind).toBe("editorial");
    expect(getSummitVisualSource(withActivityPhoto).src).toBe(
      "https://commons.wikimedia.org/summit.jpg",
    );
    expect(getSummitVisualSource(withVerifiedEditorialPhoto).kind).toBe(
      "editorial",
    );
    expect(getSummitVisualSource(withAdminEditorialPhoto)).toMatchObject({
      kind: "editorial",
      src: withAdminEditorialPhoto.imageUrl,
      credit: "CC BY-SA 3.0",
    });
    expect(getSummitVisualSource(withGenericPhoto)).toMatchObject({
      kind: "fallback",
      src: null,
      credit: "Illustration HOVREN",
    });
    expect(getSummitVisualSource(withoutCatalogPhoto)).toMatchObject({
      kind: "fallback",
      src: null,
      credit: "Illustration HOVREN",
    });
    expect(getSummitVisualSource(withoutCatalogPhoto).src).not.toBe(
      "https://dgtzuqphqg23d.cloudfront.net/strava-photo.jpg",
    );
  });

  it("évite de répéter la même photo dans la grille visible", () => {
    const sharedPhoto =
      "https://commons.wikimedia.org/photos/sommet-partage.jpg";
    const firstSummit = createSummit({
      ...discovered,
      id: "first-photo",
      name: "Premier sommet",
      imageUrl: sharedPhoto,
      imageCredit: "Auteur vérifié",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Sommet-partage.jpg",
    });
    const secondSummit = createSummit({
      ...pending,
      id: "second-photo",
      name: "Deuxième sommet",
      imageUrl: sharedPhoto,
      imageCredit: "Auteur vérifié",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Sommet-partage.jpg",
    });

    const visuals = getSummitVisualSources([firstSummit, secondSummit]);

    expect(visuals[firstSummit.id]?.src).toBe(sharedPhoto);
    expect(visuals[secondSummit.id]).toMatchObject({
      kind: "fallback",
      src: null,
    });
  });

  it("n’emprunte jamais la photo d’un autre sommet du même massif", () => {
    const summitWithoutPhoto = createSummit({
      id: "without-photo",
      name: "Sommet sans photo",
      massif: "Aravis",
    });
    const massifReference = createSummit({
      id: "massif-reference",
      name: "Référence Aravis",
      massif: "Aravis",
      imageUrl: "https://commons.wikimedia.org/aravis.jpg",
      imageCredit: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Aravis.jpg",
    });

    const visuals = getSummitVisualSources([summitWithoutPhoto]);

    expect(visuals[summitWithoutPhoto.id]).toMatchObject({
      kind: "fallback",
      src: null,
    });
    expect(getSummitVisualSource(massifReference).src).toBe(
      "https://commons.wikimedia.org/aravis.jpg",
    );
  });

  it("refuse une image générique même si une photo voisine est disponible", () => {
    const genericSummit = createSummit({
      id: "generic-summit",
      name: "Sommet générique",
      massif: "Aravis",
      imageUrl:
        "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg",
      imageCredit: "Image montagne",
    });
    const massifReference = createSummit({
      id: "verified-aravis",
      name: "Référence Aravis",
      massif: "Aravis",
      imageUrl: "https://commons.wikimedia.org/aravis.jpg",
      imageCredit: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Aravis.jpg",
    });

    expect(
      getSummitVisualSources([genericSummit])[genericSummit.id],
    ).toMatchObject({
      kind: "fallback",
      src: null,
    });
    expect(getSummitVisualSource(massifReference).kind).toBe("editorial");
  });

  it("construit des cartes typées avec une information secondaire utile", () => {
    const massifs = getMassifProgress([discovered, pending, missing]);
    const viewModels = getSummitCardViewModels(
      [discovered, pending, missing],
      massifs,
    );

    expect(viewModels[0]).toMatchObject({
      status: "DISCOVERED",
      statusLabel: "Découvert",
      passageLabel: "2 passages",
      secondaryInfo: {
        kind: "activity",
        label: "Découvert pendant « Boucle du Veyrier »",
      },
      href: "/activites/activity-2",
      ctaLabel: "Voir la trace",
    });
    expect(viewModels[1]).toMatchObject({
      status: "PENDING",
      statusLabel: "À confirmer",
      passageLabel: "Détection proche",
      secondaryInfo: {
        kind: "activity",
        label: "Proposé pendant « Trail des Bornes »",
      },
      pendingDiscoveryId: "pending-1",
    });
    expect(viewModels[2]).toMatchObject({
      status: "MISSING",
      statusLabel: "À découvrir",
      passageLabel: "1/3 dans Bornes",
      secondaryInfo: {
        kind: "massif",
        label: "Encore 2 sommets pour compléter Bornes",
      },
    });
  });

  it("désigne la dernière découverte selon son entrée dans le carnet", () => {
    const rediscoveredRecently = createSummit({
      ...discovered,
      id: "old-discovery",
      name: "Ancienne découverte",
      firstDiscoveredAt: "2026-06-01T08:00:00.000Z",
      latestDiscoveredAt: "2026-07-22T08:00:00.000Z",
    });
    const newestDiscovery = createSummit({
      ...discovered,
      id: "new-discovery",
      name: "Nouvelle découverte",
      firstDiscoveredAt: "2026-07-20T08:00:00.000Z",
      latestDiscoveredAt: "2026-07-20T08:00:00.000Z",
    });

    expect(
      getLatestDiscoveredSummit([rediscoveredRecently, newestDiscovery])?.id,
    ).toBe("new-discovery");
  });

  it("met en avant un massif commencé et retrouve son prochain sommet", () => {
    const massifs = getMassifProgress([discovered, pending, missing]);
    const featured = getFeaturedMassif(massifs, missing, discovered);

    expect(featured?.massif).toBe("Bornes");
    expect(
      getNextSummitForMassif([discovered, pending, missing], featured)?.id,
    ).toBe("sous-dine");
  });

  it("préserve le contrat des paramètres URL existants", () => {
    const parsed = parseSummitFilters(
      "?statut=a-decouvrir&vue=liste&recherche=veyrier&massif=Bornes&altitude=MID&tri=NAME",
    );

    expect(parsed.status).toBe("MISSING");
    expect(parsed.viewMode).toBe("TABLE");
    expect(serializeSummitFilters(parsed)).toContain("statut=a-decouvrir");
    expect(serializeSummitFilters(parsed)).toContain("vue=liste");
  });
});
