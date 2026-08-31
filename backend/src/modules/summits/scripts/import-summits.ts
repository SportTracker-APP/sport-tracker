import path from 'node:path';

import { PrismaClient } from '@prisma/client';

import {
  applyPreparedSummitImport,
  previewPreparedSummitImport,
  runSummitImport,
} from '../import/summit-import-runner';
import {
  getDepartmentImportDefinition,
  getProductionConfirmation,
  type SummitDepartmentImportDefinition,
} from '../import/summit-department-import';
import { verifySourceArchiveChecksum } from '../import/summit-source-checksum';

const LOCAL_DATABASE_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

function getArgument(name: string) {
  const prefix = `--${name}=`;

  return process.argv
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
}

function requiredArgument(name: string) {
  const value = getArgument(name);

  if (!value) {
    throw new Error(`Argument --${name}=... requis`);
  }

  return value;
}

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;

  if (!value) {
    throw new Error('DATABASE_URL est requis');
  }

  try {
    return new URL(value);
  } catch {
    throw new Error('DATABASE_URL est invalide');
  }
}

function getDatabaseName(databaseUrl: URL) {
  const databaseName = decodeURIComponent(
    databaseUrl.pathname.replace(/^\/+/, ''),
  );

  if (!databaseName) {
    throw new Error(
      'Impossible de déterminer le nom de la base depuis DATABASE_URL',
    );
  }

  return databaseName;
}

function assertImportDatabaseSafety(
  department: SummitDepartmentImportDefinition,
  sourceVersion: string,
) {
  const databaseUrl = getDatabaseUrl();
  const hostname = databaseUrl.hostname;
  const databaseName = getDatabaseName(databaseUrl);

  const isLocalDatabase = LOCAL_DATABASE_HOSTS.has(hostname);

  if (isLocalDatabase) {
    if (!process.argv.includes('--confirm-local-test')) {
      throw new Error('Une base locale/test exige --confirm-local-test.');
    }

    return;
  }

  const productionConfirmation = getArgument('confirm-production');
  const expectedDatabaseHost = getArgument('expected-db-host');
  const expectedDatabaseName = getArgument('expected-db-name');
  const expectedConfirmation = getProductionConfirmation(
    department,
    sourceVersion,
  );

  if (productionConfirmation !== expectedConfirmation) {
    throw new Error(
      `Base distante détectée (${hostname}). ` +
        `Confirmez explicitement la release avec ` +
        `--confirm-production=${expectedConfirmation}`,
    );
  }

  if (!expectedDatabaseHost || expectedDatabaseHost !== hostname) {
    throw new Error(
      `Hôte distant refusé. Hôte réel : ${hostname}. ` +
        `Utilisez --expected-db-host=${hostname} après vérification.`,
    );
  }

  if (!expectedDatabaseName || expectedDatabaseName !== databaseName) {
    throw new Error(
      `Base distante refusée. Base réelle : ${databaseName}. ` +
        `Utilisez --expected-db-name=${databaseName} après vérification.`,
    );
  }

  console.warn(
    `IMPORT DISTANT EXPLICITEMENT AUTORISÉ ` +
      `SUR host=${hostname} database=${databaseName}`,
  );
}

async function main() {
  const apply = process.argv.includes('--apply');
  const previewApply = process.argv.includes('--preview-apply');
  const prepare = process.argv.includes('--prepare');
  const dryRun =
    process.argv.includes('--dry-run') || (!apply && !previewApply && !prepare);

  if ([dryRun, prepare, previewApply, apply].filter(Boolean).length !== 1) {
    throw new Error(
      'Choisissez exactement un mode : ' +
        '--dry-run, --prepare, --preview-apply ou --apply',
    );
  }

  const department = getDepartmentImportDefinition(
    requiredArgument('department'),
    { requireEnabled: prepare || previewApply || apply },
  );
  const sourceVersion = requiredArgument('source-version');

  if (prepare || previewApply || apply) {
    assertImportDatabaseSafety(department, sourceVersion);
  }

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
        { scope: department.scope, sourceVersion },
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
        { scope: department.scope, sourceVersion },
      );

      console.log(JSON.stringify(result, null, 2));
    } finally {
      await prisma.$disconnect();
    }

    return;
  }

  const snapshotDirectory = path.resolve(requiredArgument('snapshot-dir'));

  const osmSnapshotPath = path.resolve(requiredArgument('osm-snapshot'));

  const sourceChecksum = requiredArgument('source-checksum');
  const sourceArchivePath = path.resolve(requiredArgument('source-archive'));
  const checksum = await verifySourceArchiveChecksum(
    sourceArchivePath,
    sourceChecksum,
  );
  console.warn(
    `SOURCE VÉRIFIÉE ${checksum.algorithm}=${checksum.actual} scope=${department.scope}`,
  );

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
      departmentCode: department.departmentCode,
      scope: department.scope,
      sourceVersion,
      sourceChecksum: checksum.actual,
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
