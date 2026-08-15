import { EMAIL_PATTERN } from './email.util';

describe('correos de contacto', () => {
  it('acepta un correo corriente', () => {
    expect(EMAIL_PATTERN.test('ana.perez@gmail.com')).toBe(true);
  });

  it('acepta un dominio compuesto', () => {
    expect(EMAIL_PATTERN.test('brigada@ayuda.gov.co')).toBe(true);
  });

  it('rechaza un dominio sin terminación: es lo que la API devolvía como error genérico', () => {
    expect(EMAIL_PATTERN.test('juan@correo')).toBe(false);
  });

  it('rechaza una dirección sin arroba', () => {
    expect(EMAIL_PATTERN.test('juan.correo.com')).toBe(false);
  });

  it('rechaza espacios: se cuelan al copiar y pegar', () => {
    expect(EMAIL_PATTERN.test('juan perez@gmail.com')).toBe(false);
  });

  it('rechaza una terminación de una sola letra', () => {
    expect(EMAIL_PATTERN.test('juan@gmail.c')).toBe(false);
  });
});
