import { z } from "zod";

export const adminSummitIdentitySchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire").max(160),
  aliasesText: z.string().max(1000),
  altitude: z.number().int().min(1).max(9000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  difficulty: z.string().trim().min(1).max(80),
  type: z.string().trim().min(1).max(80),
});

export type AdminSummitIdentityForm = z.infer<typeof adminSummitIdentitySchema>;
