import { z } from 'zod';

import { IGN_SUMMIT_NATURES } from './summit-import.constants';

export const ignDetailPropertiesSchema = z
  .object({
    ID: z.string().min(1),
    NATURE: z.string().min(1),
    NAT_DETAIL: z.string().nullish(),
    TOPONYME: z.string().nullish(),
    STATUT_TOP: z.string().nullish(),
    IMPORTANCE: z.union([z.string(), z.number()]).nullish(),
    DATE_CREAT: z.string().nullish(),
    DATE_MAJ: z.string().nullish(),
    SOURCE: z.string().nullish(),
    ID_SOURCE: z.string().nullish(),
    ACQU_PLANI: z.string().nullish(),
    PREC_PLANI: z.union([z.string(), z.number()]).nullish(),
    INSEE_COM: z.string().nullish(),
  })
  .passthrough();

export const ignToponymPropertiesSchema = z
  .object({
    ID: z.string().min(1),
    CLASSE: z.string().min(1),
    GRAPHIE: z.string().nullish(),
    STATUT_TOP: z.string().nullish(),
    SOURCE: z.string().nullish(),
    LANGUE: z.string().nullish(),
  })
  .passthrough();

export const ignDepartmentPropertiesSchema = z
  .object({
    ID: z.string().min(1),
    NOM: z.string().min(1),
    INSEE_DEP: z.string().min(1),
  })
  .passthrough();

export const normalizedIgnSummitSchema = z.object({
  externalId: z.string().min(1),
  name: z.string().min(1),
  normalizedName: z.string().min(1),
  aliases: z.array(z.string()),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  elevation: z.number().int().positive().nullable(),
  sourceNature: z.enum(IGN_SUMMIT_NATURES),
  sourceVersion: z.string().min(1),
  boundaryReview: z.boolean(),
  boundaryDistanceMeters: z.number().nonnegative(),
  sourceProperties: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()]),
  ),
});

export type NormalizedIgnSummit = z.infer<typeof normalizedIgnSummitSchema>;

export type ImportRejectionReason =
  | 'INVALID_SOURCE'
  | 'MISSING_NAME'
  | 'NOT_A_SUMMIT'
  | 'OUTSIDE_SCOPE';

export type ImportRejectedFeature = {
  externalId: string | null;
  name: string | null;
  reason: ImportRejectionReason;
  detail: string;
};

export type IgnSnapshotReadResult = {
  sourceCount: number;
  candidates: NormalizedIgnSummit[];
  rejected: ImportRejectedFeature[];
};

export type ExistingSummitForMatch = {
  id: string;
  name: string;
  aliases: string[];
  altitude: number;
  latitude: number;
  longitude: number;
  externalReferences: Array<{
    provider: string;
    externalId: string;
  }>;
};

export type SummitMatchDecision = {
  candidate: NormalizedIgnSummit;
  status: 'NEW' | 'MATCHED' | 'CONFLICT' | 'REJECTED' | 'READY';
  matchedSummitId: string | null;
  reason: string;
};
