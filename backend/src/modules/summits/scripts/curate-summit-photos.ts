import '../../../instrument';

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';

import {
  applySummitPhotoCandidates,
  curateSummitPhotos,
  isSupportedCommonsLicense,
  SummitPhotoCandidate,
  SummitPhotoCurationResult,
} from '../import/summit-photo-curation';

const PRODUCTION_CONFIRMATION = 'HOVREN-SUMMIT-PHOTOS-2026-08-26';
const LOCAL_DATABASE_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

function getArgument(name: string) {
  const prefix = `--${name}=`;
  return process.argv
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
}

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL est requis');
  return new URL(value);
}

function assertApplySafety() {
  const databaseUrl = getDatabaseUrl();
  const hostname = databaseUrl.hostname;
  const databaseName = decodeURIComponent(
    databaseUrl.pathname.replace(/^\/+/, ''),
  );

  if (LOCAL_DATABASE_HOSTS.has(hostname)) {
    if (!process.argv.includes('--confirm-local-test')) {
      throw new Error('Une base locale/test exige --confirm-local-test.');
    }
    return;
  }

  if (getArgument('confirm-production') !== PRODUCTION_CONFIRMATION) {
    throw new Error(
      `Base distante détectée. Utilisez --confirm-production=${PRODUCTION_CONFIRMATION} après validation du dry-run.`,
    );
  }
  if (getArgument('expected-db-host') !== hostname) {
    throw new Error(`Hôte distant refusé. Hôte réel : ${hostname}.`);
  }
  if (getArgument('expected-db-name') !== databaseName) {
    throw new Error(`Base distante refusée. Base réelle : ${databaseName}.`);
  }
}

function assertApprovedCandidates(
  candidates: SummitPhotoCandidate[],
  expectedCandidates: number,
) {
  if (candidates.length !== expectedCandidates) {
    throw new Error(
      `Rapport refusé : ${candidates.length} candidats au lieu de ${expectedCandidates}.`,
    );
  }

  const summitIds = new Set<string>();
  const sourceUrls = new Set<string>();
  for (const candidate of candidates) {
    const imageHost = new URL(candidate.imageUrl).hostname;
    const sourceHost = new URL(candidate.sourceUrl).hostname;
    const expectedCredit =
      candidate.license.toUpperCase() === 'PUBLIC DOMAIN'
        ? `${candidate.author} · Domaine public`
        : `© ${candidate.author} · ${candidate.license}`;

    if (
      imageHost !== 'upload.wikimedia.org' ||
      sourceHost !== 'commons.wikimedia.org' ||
      !candidate.author ||
      !isSupportedCommonsLicense(candidate.license) ||
      candidate.imageCredit !== expectedCredit ||
      summitIds.has(candidate.summitId) ||
      sourceUrls.has(candidate.sourceUrl)
    ) {
      throw new Error(
        `Rapport refusé : métadonnées invalides pour ${candidate.summitName}.`,
      );
    }

    summitIds.add(candidate.summitId);
    sourceUrls.add(candidate.sourceUrl);
  }
}

async function loadApprovedReport(reportPath: string) {
  const parsed = JSON.parse(
    await readFile(path.resolve(reportPath), 'utf8'),
  ) as SummitPhotoCurationResult;
  if (parsed.mode !== 'DRY_RUN' || !Array.isArray(parsed.candidates)) {
    throw new Error('Le rapport approuvé doit provenir d’un dry-run.');
  }
  return parsed;
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (apply) assertApplySafety();

  const limitArgument = getArgument('limit');
  const limit = limitArgument ? Number.parseInt(limitArgument, 10) : undefined;
  if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
    throw new Error('--limit doit être un entier positif');
  }

  const prisma = new PrismaClient();
  try {
    const approvedReportPath = getArgument('approved-report');
    if (approvedReportPath && !apply) {
      throw new Error('--approved-report exige --apply.');
    }

    let report: SummitPhotoCurationResult;
    if (approvedReportPath) {
      const expectedCandidates = Number.parseInt(
        getArgument('expected-candidates') ?? '',
        10,
      );
      if (!Number.isInteger(expectedCandidates) || expectedCandidates <= 0) {
        throw new Error(
          '--approved-report exige --expected-candidates=<nombre>.',
        );
      }
      const approvedReport = await loadApprovedReport(approvedReportPath);
      assertApprovedCandidates(approvedReport.candidates, expectedCandidates);
      const applied = await applySummitPhotoCandidates(
        prisma,
        approvedReport.candidates,
      );
      report = {
        ...approvedReport,
        mode: 'APPLY',
        counts: { ...approvedReport.counts, applied },
      };
    } else {
      report = await curateSummitPhotos(prisma, { apply, limit });
    }
    const reportPath = getArgument('report');
    if (reportPath) {
      const resolvedReportPath = path.resolve(reportPath);
      await writeFile(
        resolvedReportPath,
        `${JSON.stringify(report, null, 2)}\n`,
        'utf8',
      );
      console.log(
        JSON.stringify(
          {
            mode: report.mode,
            counts: report.counts,
            reportPath: resolvedReportPath,
          },
          null,
          2,
        ),
      );
    } else {
      console.log(JSON.stringify(report, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
