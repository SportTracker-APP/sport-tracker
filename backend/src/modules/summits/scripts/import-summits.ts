import path from 'node:path';

import { PrismaClient } from '@prisma/client';

import {
  applyPreparedSummitImport,
  previewPreparedSummitImport,
  runSummitImport,
} from '../import/summit-import-runner';

function getArgument(name: string) {
  const prefix = `--${name}=`;
  return process.argv
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
}

function requiredArgument(name: string) {
  const value = getArgument(name);
  if (!value) throw new Error(`Argument --${name}=... requis`);
  return value;
}

function assertLocalTestDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL est requis');

  const hostname = new URL(databaseUrl).hostname;
  if (!['127.0.0.1', 'localhost', '::1'].includes(hostname)) {
    throw new Error(
      `Écriture refusée sur l’hôte ${hostname}. Utilisez une base locale/test isolée.`,
    );
  }
}

async function main() {
  const apply = process.argv.includes('--apply');
  const previewApply = process.argv.includes('--preview-apply');
  const prepare = process.argv.includes('--prepare');
  const dryRun =
    process.argv.includes('--dry-run') || (!apply && !previewApply && !prepare);

  if ([dryRun, prepare, previewApply, apply].filter(Boolean).length !== 1) {
    throw new Error(
      'Choisissez exactement un mode : --dry-run, --prepare, --preview-apply ou --apply',
    );
  }

  if (
    (prepare || previewApply || apply) &&
    !process.argv.includes('--confirm-local-test')
  ) {
    throw new Error(
      'Les modes prepare/preview/apply exigent --confirm-local-test avant le STOP GATE',
    );
  }
  if (prepare || previewApply || apply) assertLocalTestDatabase();
  if (apply && !process.argv.includes('--confirm-core-release')) {
    throw new Error(
      'Relancez après lecture du preview avec --confirm-core-release',
    );
  }

  const prisma = new PrismaClient();
  if (previewApply) {
    try {
      const result = await previewPreparedSummitImport(
        prisma,
        requiredArgument('import-run'),
      );
      console.log(JSON.stringify(result, null, 2));
    } finally {
      await prisma.$disconnect();
    }
    return;
  }
  if (apply) {
    try {
      const result = await applyPreparedSummitImport(
        prisma,
        requiredArgument('import-run'),
      );
      console.log(JSON.stringify(result, null, 2));
    } finally {
      await prisma.$disconnect();
    }
    return;
  }

  const snapshotDirectory = path.resolve(requiredArgument('snapshot-dir'));
  const osmSnapshotPath = path.resolve(requiredArgument('osm-snapshot'));
  const sourceVersion = requiredArgument('source-version');
  const cacheDirectory = path.resolve(
    getArgument('cache-dir') ??
      path.join(snapshotDirectory, '.hovren-import-cache'),
  );
  const reportArgument = getArgument('report');
  const reportPath = reportArgument ? path.resolve(reportArgument) : undefined;
  const catalogMode =
    getArgument('catalog') === 'bootstrap' ? 'bootstrap' : 'database';

  if (prepare && catalogMode === 'bootstrap') {
    throw new Error('Le catalogue bootstrap est réservé au dry-run');
  }

  try {
    const report = await runSummitImport(prisma, {
      snapshotDirectory,
      osmSnapshotPath,
      sourceVersion,
      sourceChecksum: getArgument('source-checksum'),
      cacheDirectory,
      reportPath,
      mode: prepare ? 'prepare' : 'dry-run',
      catalogMode,
    });
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
