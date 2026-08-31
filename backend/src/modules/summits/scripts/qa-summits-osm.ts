import path from 'node:path';

import { getDepartmentImportDefinition } from '../import/summit-department-import';
import { runOsmSummitQa } from '../import/summit-import-osm-qa';

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
  const department = getDepartmentImportDefinition(
    requiredArgument('department'),
    { requireEnabled: false },
  );
  const report = await runOsmSummitQa({
    snapshotDirectory: path.resolve(requiredArgument('snapshot-dir')),
    sourceVersion: requiredArgument('source-version'),
    departmentCode: department.departmentCode,
    osmSnapshotPath: path.resolve(requiredArgument('osm-snapshot')),
    reportPath: getArgument('report')
      ? path.resolve(requiredArgument('report'))
      : undefined,
  });

  console.log(
    JSON.stringify(
      {
        counts: report.counts,
        reviewRequired: report.matches.filter(
          ({ positionReviewRequired, altitudeReviewRequired }) =>
            positionReviewRequired || altitudeReviewRequired,
        ),
      },
      null,
      2,
    ),
  );
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
