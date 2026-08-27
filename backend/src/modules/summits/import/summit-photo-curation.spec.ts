import {
  cleanCommonsAttribution,
  commonsPhotoIdentifiesSummit,
  commonsSearchPhotoIsReliable,
  isSupportedCommonsLicense,
  matchWikidataPhoto,
  parseCommonsPhotoMetadata,
} from './summit-photo-curation';

function wikidataEntity(overrides: Record<string, unknown> = {}) {
  return {
    labels: { fr: { language: 'fr', value: 'Mont Forchat' } },
    aliases: { fr: [] },
    claims: {
      P18: [
        {
          rank: 'normal',
          mainsnak: { datavalue: { value: 'Mont Forchat.jpg' } },
        },
      ],
      P625: [
        {
          rank: 'normal',
          mainsnak: {
            datavalue: {
              value: { latitude: 46.233, longitude: 6.49 },
            },
          },
        },
      ],
      P2044: [
        {
          rank: 'normal',
          mainsnak: { datavalue: { value: { amount: '+1539' } } },
        },
      ],
    },
    ...overrides,
  };
}

describe('summit photo curation', () => {
  it('confirms a Wikidata photo only when identity and geography agree', () => {
    const target = {
      id: 'mont-forchat',
      name: 'Mont Forchat',
      aliases: [],
      altitude: 1539,
      latitude: 46.2331,
      longitude: 6.4901,
      wikidataId: 'Q123',
    };

    expect(matchWikidataPhoto(target, wikidataEntity())).toMatchObject({
      wikidataId: 'Q123',
      commonsFile: 'Mont Forchat.jpg',
    });
    expect(
      matchWikidataPhoto(
        { ...target, name: 'Autre sommet', aliases: [] },
        wikidataEntity(),
      ),
    ).toBeNull();
    expect(
      matchWikidataPhoto(
        target,
        wikidataEntity({
          claims: {
            ...wikidataEntity().claims,
            P625: [
              {
                rank: 'normal',
                mainsnak: {
                  datavalue: {
                    value: { latitude: 45.8, longitude: 6.1 },
                  },
                },
              },
            ],
          },
        }),
      ),
    ).toBeNull();
  });

  it('conserve auteur, licence et page source Commons', () => {
    const result = parseCommonsPhotoMetadata('Mont Forchat.jpg', {
      imageinfo: [
        {
          thumburl:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Mont_Forchat.jpg/1600px-Mont_Forchat.jpg',
          url: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Mont_Forchat.jpg',
          descriptionurl:
            'https://commons.wikimedia.org/wiki/File:Mont_Forchat.jpg',
          mime: 'image/jpeg',
          user: 'Photographe',
          extmetadata: {
            Artist: { value: '<a href="/wiki/User:Auteur">Auteur Test</a>' },
            LicenseShortName: { value: 'CC BY-SA 4.0' },
            LicenseUrl: {
              value: 'https://creativecommons.org/licenses/by-sa/4.0/',
            },
            ImageDescription: {
              value: 'Le Mont Forchat depuis le col voisin.',
            },
            Categories: { value: 'Mont Forchat|Mountains of Haute-Savoie' },
            GPSLatitude: { value: '46.233' },
            GPSLongitude: { value: '6.49' },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      author: 'Auteur Test',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mont_Forchat.jpg',
      description: 'Le Mont Forchat depuis le col voisin.',
      categories: ['Mont Forchat', 'Mountains of Haute-Savoie'],
      cameraLatitude: 46.233,
      cameraLongitude: 6.49,
    });
  });

  it('refuse une homonymie Commons éloignée ou sans catégorie du sommet', () => {
    const target = {
      name: 'Mont Forchat',
      aliases: [],
      latitude: 46.233,
      longitude: 6.49,
    };
    const reliablePhoto = {
      commonsFile: 'Mont Forchat en hiver.jpg',
      description: 'Le Mont Forchat depuis le col voisin.',
      categories: ['Mont Forchat', 'Mountains of Haute-Savoie'],
      cameraLatitude: 46.24,
      cameraLongitude: 6.48,
    };

    expect(commonsSearchPhotoIsReliable(reliablePhoto, target)).toBe(true);
    expect(
      commonsSearchPhotoIsReliable(
        { ...reliablePhoto, cameraLatitude: 50.7, cameraLongitude: 3.1 },
        target,
      ),
    ).toBe(false);
    expect(
      commonsSearchPhotoIsReliable(
        { ...reliablePhoto, categories: ['Streets in Halluin'] },
        target,
      ),
    ).toBe(false);
    expect(
      commonsSearchPhotoIsReliable(
        {
          ...reliablePhoto,
          cameraLatitude: null,
          cameraLongitude: null,
        },
        target,
      ),
    ).toBe(false);
    expect(
      commonsSearchPhotoIsReliable(
        {
          ...reliablePhoto,
          commonsFile: 'Forêt @ Sous le Mont Baret (51140610891).jpg',
          categories: ['Mont Baret'],
        },
        {
          ...target,
          name: 'Mont Baret',
        },
      ),
    ).toBe(false);
  });

  it('refuse une vue générique qui ne nomme pas le sommet', () => {
    const target = { name: 'Mont Forchat', aliases: [] };

    expect(
      commonsPhotoIdentifiesSummit(
        {
          commonsFile: 'Mont Forchat depuis Très-le-Mont.jpg',
          description: null,
        },
        target,
      ),
    ).toBe(true);
    expect(
      commonsPhotoIdentifiesSummit(
        {
          commonsFile: 'Vue générale du Chablais.jpg',
          description: 'Panorama de Haute-Savoie.',
        },
        target,
      ),
    ).toBe(false);
  });

  it('refuse les licences non commerciales, sans dérivés ou sans auteur', () => {
    expect(isSupportedCommonsLicense('CC BY-SA 4.0')).toBe(true);
    expect(isSupportedCommonsLicense('Public domain')).toBe(true);
    expect(isSupportedCommonsLicense('CC BY-NC 4.0')).toBe(false);
    expect(isSupportedCommonsLicense('CC BY-ND 4.0')).toBe(false);
    expect(cleanCommonsAttribution('<b>Auteur</b>&nbsp;Test')).toBe(
      'Auteur Test',
    );

    expect(
      parseCommonsPhotoMetadata('Sans auteur.jpg', {
        imageinfo: [
          {
            url: 'https://upload.wikimedia.org/sans-auteur.jpg',
            descriptionurl:
              'https://commons.wikimedia.org/wiki/File:Sans_auteur.jpg',
            mime: 'image/jpeg',
            extmetadata: {
              LicenseShortName: { value: 'CC BY 4.0' },
            },
          },
        ],
      }),
    ).toBeNull();
  });
});
