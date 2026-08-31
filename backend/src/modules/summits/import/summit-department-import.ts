export type SummitDepartmentImportDefinition = {
  departmentCode: string;
  scope: string;
  geoAreaSlug: string;
  releaseConfirmationPrefix: string;
  enabled: boolean;
  blockedReason?: string;
};

const DEPARTMENT_IMPORT_DEFINITIONS = [
  {
    departmentCode: '74',
    scope: 'D074',
    geoAreaSlug: 'haute-savoie',
    releaseConfirmationPrefix: 'HAUTE-SAVOIE-CORE',
    enabled: true,
  },
  {
    departmentCode: '73',
    scope: 'D073',
    geoAreaSlug: 'savoie',
    releaseConfirmationPrefix: 'SAVOIE-CORE',
    enabled: false,
    blockedReason:
      'Le GO Savoie exige la validation explicite du jalon « 74 stabilisé ».',
  },
] as const satisfies readonly SummitDepartmentImportDefinition[];

function normalizeDepartmentCode(value: string) {
  const normalized = value
    .trim()
    .replace(/^D/i, '')
    .replace(/^0+(?=\d)/, '');
  if (!/^\d{1,3}$/.test(normalized)) {
    throw new Error(`Code département invalide : ${value}`);
  }
  return normalized.padStart(2, '0');
}

function assertEnabled(definition: SummitDepartmentImportDefinition) {
  if (!definition.enabled) {
    throw new Error(
      definition.blockedReason ??
        `Le département ${definition.departmentCode} n'est pas autorisé à l'import.`,
    );
  }
  return definition;
}

export function getDepartmentImportDefinition(
  departmentCode: string,
  options: { requireEnabled?: boolean } = {},
) {
  const normalized = normalizeDepartmentCode(departmentCode);
  const definition = DEPARTMENT_IMPORT_DEFINITIONS.find(
    (entry) => entry.departmentCode === normalized,
  );
  if (!definition) {
    throw new Error(
      `Département ${normalized} absent de la liste blanche d'import.`,
    );
  }
  return options.requireEnabled === false
    ? definition
    : assertEnabled(definition);
}

export function getDepartmentImportDefinitionByScope(
  scope: string,
  options: { requireEnabled?: boolean } = {},
) {
  const definition = DEPARTMENT_IMPORT_DEFINITIONS.find(
    (entry) => entry.scope === scope,
  );
  if (!definition) {
    throw new Error(`Périmètre ${scope} absent de la liste blanche d'import.`);
  }
  return options.requireEnabled === false
    ? definition
    : assertEnabled(definition);
}

export function getProductionConfirmation(
  definition: SummitDepartmentImportDefinition,
  sourceVersion: string,
) {
  return `${definition.releaseConfirmationPrefix}-${sourceVersion}`;
}

export function listDepartmentImportDefinitions() {
  return [...DEPARTMENT_IMPORT_DEFINITIONS];
}
