import {
  colombiaDateTime,
  colombiaInputToIso,
  colombiaInputValue,
  toIsoDate,
  toIsoTime,
} from './date.util';

/** 14 de agosto, 03:56 UTC = 13 de agosto, 22:56 en Colombia: el día también cambia. */
const LATE_NIGHT = new Date('2026-08-14T03:56:00.000Z');

describe('fechas en hora de Colombia', () => {
  it('toma el día de Colombia, no el del meridiano de Greenwich', () => {
    expect(toIsoDate(LATE_NIGHT)).toBe('2026-08-13');
  });

  it('toma la hora de Colombia', () => {
    expect(toIsoTime(LATE_NIGHT)).toBe('22:56');
  });

  it('arma el valor inicial de un campo de fecha y hora', () => {
    expect(colombiaInputValue(LATE_NIGHT)).toBe('2026-08-13T22:56');
  });

  it('lee lo escrito en el formulario como hora de Colombia', () => {
    expect(colombiaInputToIso('2026-08-13T22:56')).toBe('2026-08-14T03:56:00.000Z');
  });

  it('muestra la hora del sitio, mire quien mire desde donde mire', () => {
    expect(colombiaDateTime(LATE_NIGHT, 'es')).toContain('13');
    expect(colombiaDateTime(LATE_NIGHT, 'es')).toContain('10:56');
  });
});
