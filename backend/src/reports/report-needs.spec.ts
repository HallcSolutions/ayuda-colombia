import { hasValidReportNeeds, parseReportNeeds } from './report-needs';

describe('report needs', () => {
  it('normaliza JSON y elimina duplicados sin alterar el orden', () => {
    expect(
      parseReportNeeds('[" Agua potable ","Alimentos","Agua potable"]'),
    ).toEqual(['Agua potable', 'Alimentos']);
  });

  it('mantiene compatibilidad con texto separado por comas', () => {
    expect(parseReportNeeds('Agua potable, Medicinas')).toEqual([
      'Agua potable',
      'Medicinas',
    ]);
  });

  it.each(['[]', '   ', '{}', '[""]', '[1]', '["x",""]', '[mal'])(
    'rechaza el valor sin necesidades válidas %s',
    (value) => {
      expect(hasValidReportNeeds(value)).toBe(false);
      expect(parseReportNeeds(value)).toEqual([]);
    },
  );

  it('rechaza más de 12 necesidades y elementos mayores de 80 caracteres', () => {
    expect(hasValidReportNeeds(JSON.stringify(Array(13).fill('Agua')))).toBe(
      false,
    );
    expect(hasValidReportNeeds(JSON.stringify(['x'.repeat(81)]))).toBe(false);
  });
});
