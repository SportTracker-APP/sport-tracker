import '../../../instrument';

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';

import {
  applySummitMassifCandidates,
  curateSummitMassifs,
  getSummitMassifQa,
  isKnownMassifCandidate,
  SummitMassifCurationResult,
} from '../import/summit-massif-curation';

const PRODUCTION_CONFIRMATION = 'HOVREN-MASSIFS-74-2026-09-01';
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

function assertApprovedReport(
  report: SummitMassifCurationResult,
  expectedCandidates: number,
  expectedUnresolved: number,
) {
  if (report.mode !== 'DRY_RUN') {
    throw new Error('Le rapport approuvé doit provenir d’un dry-run.');
  }
  if (
    report.candidates.length !== expectedCandidates ||
    report.counts.eligible !== expectedCandidates
  ) {
    throw new Error(
      `Rapport refusé : ${report.candidates.length} candidats au lieu de ${expectedCandidates}.`,
    );
  }
  if (
    report.unresolved.length !== expectedUnresolved ||
    report.counts.unresolved !== expectedUnresolved
  ) {
    throw new Error(
      `Rapport refusé : ${report.unresolved.length} non résolus au lieu de ${expectedUnresolved}.`,
    );
  }

  const summitIds = new Set<string>();
  const wikidataIds = new Set<string>();
  for (const candidate of report.candidates) {
    if (
      !isKnownMassifCandidate(candidate) ||
      summitIds.has(candidate.summitId) ||
      wikidataIds.has(candidate.wikidataId)
    ) {
      throw new Error(
        `Rapport refusé : preuve invalide ou dupliquée pour ${candidate.summitName}.`,
      );
    }
    summitIds.add(candidate.summitId);
    wikidataIds.add(candidate.wikidataId);
  }
}

async function main() {
  const apply = process.argv.includes('--apply');
  const prisma = new PrismaClient();

  try {
    if (!apply) {
      const report = await curateSummitMassifs(prisma);
      const reportPath = getArgument('report');
      if (reportPath) {
        const resolvedPath = path.resolve(reportPath);
        await writeFile(
          resolvedPath,
          `${JSON.stringify(report, null, 2)}\n`,
          'utf8',
        );
        console.log(
          JSON.stringify(
            {
              mode: report.mode,
              counts: report.counts,
              reportPath: resolvedPath,
            },
            null,
            2,
          ),
        );
      } else {
        console.log(JSON.stringify(report, null, 2));
      }
      return;
    }

    assertApplySafety();
    const approvedReportPath = getArgument('approved-report');
    const expectedCandidates = Number.parseInt(
      getArgument('expected-candidates') ?? '',
      10,
    );
    const expectedUnresolved = Number.parseInt(
      getArgument('expected-unresolved') ?? '',
      10,
    );
    if (
      !approvedReportPath ||
      !Number.isInteger(expectedCandidates) ||
      expectedCandidates <= 0 ||
      !Number.isInteger(expectedUnresolved) ||
      expectedUnresolved < 0
    ) {
      throw new Error(
        '--apply exige --approved-report, --expected-candidates et --expected-unresolved.',
      );
    }

    const report = JSON.parse(
      await readFile(path.resolve(approvedReportPath), 'utf8'),
    ) as SummitMassifCurationResult;
    assertApprovedReport(report, expectedCandidates, expectedUnresolved);
    const applied = await applySummitMassifCandidates(
      prisma,
      report.candidates,
    );
    const qa = await getSummitMassifQa(prisma);
    if (
      qa.mismatchedLabel ||
      qa.missingLink ||
      qa.invalidMassif ||
      qa.missingHierarchy
    ) {
      throw new Error(`QA massif incohérente : ${JSON.stringify(qa)}`);
    }

    console.log(
      JSON.stringify(
        {
          mode: 'APPLY',
          counts: { ...report.counts, applied },
          qa,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
