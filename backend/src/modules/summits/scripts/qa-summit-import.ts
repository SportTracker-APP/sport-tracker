import path from 'node:path';

import { PrismaClient } from '@prisma/client';

import { runSummitImportQa } from '../import/summit-import-qa';

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

async function main() {
  const prisma = new PrismaClient();
  try {
    const reportArgument = getArgument('report');
    const report = await runSummitImportQa(
      prisma,
      requiredArgument('import-run'),
      reportArgument ? path.resolve(reportArgument) : undefined,
    );
    console.log(JSON.stringify(report, null, 2));
    if (process.argv.includes('--strict') && report.status === 'BLOCKED') {
      throw new Error('QA import bloquante : consultez les checks en échec.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
