import { PHONE_PATTERN, sanitizePhone, whatsappUrl } from './phone.util';

describe('teléfonos de contacto', () => {
  it('descarta las letras: a un número con letras nadie puede llamar', () => {
    expect(sanitizePhone('asasas121212')).toBe('121212');
  });

  it('respeta cómo se escribe un número de verdad', () => {
    expect(sanitizePhone('+57 (300) 123-4567')).toBe('+57 (300) 123-4567');
  });

  it('corta lo que pase del largo aceptado', () => {
    expect(sanitizePhone('1'.repeat(30))).toHaveLength(20);
  });

  it('lo que queda limpio pasa la validación del formulario', () => {
    expect(PHONE_PATTERN.test(sanitizePhone('300abc1234'))).toBe(true);
  });

  it('sigue sin valer un número demasiado corto', () => {
    expect(PHONE_PATTERN.test('12345')).toBe(false);
  });

  it('arma el enlace de WhatsApp con el indicativo del país', () => {
    expect(whatsappUrl('300 123 4567')).toBe('https://wa.me/573001234567');
  });
});
