import {
  Prisma,
  SummitCatalogStatus,
  SummitCatalogTier,
} from '@prisma/client';

export const PUBLIC_SUMMIT_WHERE = {
  isActive: true,
  catalogStatus: SummitCatalogStatus.READY,
  catalogTier: SummitCatalogTier.CORE,
} satisfies Prisma.SummitWhereInput;

export const PUBLIC_MAP_SUMMIT_WHERE = {
  isActive: true,
  catalogStatus: SummitCatalogStatus.READY,
  catalogTier: {
    in: [SummitCatalogTier.CORE, SummitCatalogTier.SECONDARY],
  },
} satisfies Prisma.SummitWhereInput;

export function isSummitPublic(summit: {
  isActive: boolean;
  catalogStatus: SummitCatalogStatus;
  catalogTier: SummitCatalogTier;
}) {
  return (
    summit.isActive &&
    summit.catalogStatus === SummitCatalogStatus.READY &&
    summit.catalogTier !== SummitCatalogTier.REFERENCE
  );
}

export function isCollectibleSummitTier(tier: SummitCatalogTier) {
  return tier === SummitCatalogTier.CORE;
}
