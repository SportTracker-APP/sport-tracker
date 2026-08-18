import { ConfigService } from '@nestjs/config';

import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GeoAreasService } from '../geography/geo-areas.service';
import { SummitsService } from './summits.service';

describe.each([100, 1_000, 5_000])(
  'map API with %i synthetic summits',
  (volume) => {
    it('returns a linear and compact payload without rich catalogue relations', async () => {
      const summits = Array.from({ length: volume }, (_, index) => ({
        id: `synthetic-summit-${index}`,
        name: `Sommet synthétique ${index}`,
        altitude: 800 + (index % 3_200),
        longitude: -4.8 + (index % 180) * 0.06,
        latitude: 42.3 + (index % 120) * 0.045,
        discoveries:
          index % 11 === 0
            ? [{ confirmedAt: new Date('2026-08-01T08:00:00Z') }]
            : [],
      }));
      const prisma = {
        summit: { findMany: jest.fn().mockResolvedValue(summits) },
        summitDiscovery: { count: jest.fn().mockResolvedValue(1) },
      };
      const service = new SummitsService(
        prisma as unknown as PrismaService,
        {} as MailService,
        {} as ConfigService,
        {} as GeoAreasService,
      );
      const startedAt = performance.now();

      const result = await service.findMapSummits('benchmark-user');
      const serialized = JSON.stringify(result);
      const durationMs = performance.now() - startedAt;

      expect(result).toHaveLength(volume);
      expect(serialized.length / volume).toBeLessThan(240);

      if (process.env.PHASE7_BENCHMARK === 'true') {
        console.info(
          `[phase-7] API map ${volume} sommets: ${durationMs.toFixed(2)} ms, ${(serialized.length / 1024).toFixed(1)} KiB JSON`,
        );
      }
    });
  },
);
