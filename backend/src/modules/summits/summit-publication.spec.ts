import { SummitCatalogStatus, SummitCatalogTier } from '@prisma/client';

import {
  isCollectibleSummitTier,
  isSummitPublic,
  PUBLIC_SUMMIT_WHERE,
} from './summit-publication';

describe('public summit publication rule', () => {
  it.each([
    [SummitCatalogStatus.READY, true, true],
    [SummitCatalogStatus.READY, false, false],
    [SummitCatalogStatus.REVIEW, true, false],
    [SummitCatalogStatus.DRAFT, true, false],
    [SummitCatalogStatus.ARCHIVED, true, false],
  ])(
    'exposes status %s with active=%s as public=%s',
    (catalogStatus, isActive, expected) => {
      expect(
        isSummitPublic({
          catalogStatus,
          isActive,
          catalogTier: SummitCatalogTier.CORE,
        }),
      ).toBe(expected);
    },
  );

  it('keeps the database filter aligned with the same rule', () => {
    expect(PUBLIC_SUMMIT_WHERE).toEqual({
      isActive: true,
      catalogStatus: SummitCatalogStatus.READY,
      catalogTier: SummitCatalogTier.CORE,
    });
  });

  it('never exposes a REFERENCE summit', () => {
    expect(
      isSummitPublic({
        catalogStatus: SummitCatalogStatus.READY,
        catalogTier: SummitCatalogTier.REFERENCE,
        isActive: true,
      }),
    ).toBe(false);
  });

  it('counts only one CORE near a trace containing secondary and reference points', () => {
    const nearby = [
      SummitCatalogTier.CORE,
      ...Array.from({ length: 3 }, () => SummitCatalogTier.SECONDARY),
      ...Array.from({ length: 4 }, () => SummitCatalogTier.REFERENCE),
    ];

    expect(nearby.filter(isCollectibleSummitTier)).toHaveLength(1);
  });
});
