import {
  getDepartmentImportDefinition,
  getDepartmentImportDefinitionByScope,
  getProductionConfirmation,
} from './summit-department-import';

describe('department summit import definitions', () => {
  it('keeps the validated Haute-Savoie release contract', () => {
    const definition = getDepartmentImportDefinition('074');

    expect(definition).toMatchObject({
      departmentCode: '74',
      scope: 'D074',
      geoAreaSlug: 'haute-savoie',
      enabled: true,
    });
    expect(getDepartmentImportDefinitionByScope('D074')).toBe(definition);
    expect(getProductionConfirmation(definition, '2026-06-15')).toBe(
      'HAUTE-SAVOIE-CORE-2026-06-15',
    );
  });

  it('keeps Savoie blocked before the 74 stabilization gate', () => {
    expect(() => getDepartmentImportDefinition('73')).toThrow('74 stabilisé');
    expect(() => getDepartmentImportDefinitionByScope('D073')).toThrow(
      '74 stabilisé',
    );
    expect(
      getDepartmentImportDefinition('73', { requireEnabled: false }),
    ).toMatchObject({ scope: 'D073', enabled: false });
  });

  it('refuses any department absent from the explicit allowlist', () => {
    expect(() => getDepartmentImportDefinition('75')).toThrow(
      "liste blanche d'import",
    );
  });
});
