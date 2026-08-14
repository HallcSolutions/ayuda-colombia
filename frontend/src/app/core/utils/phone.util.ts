/** Colombia marca 10 dígitos; el enlace de WhatsApp necesita el indicativo del país. */
const COLOMBIA_DIALING_CODE = '57';

/** Lo único que puede llevar un teléfono: dígitos y la puntuación con la que se escribe. */
const PHONE_CHARACTERS = /[^0-9+()\s-]/g;

/** Largo máximo aceptado; también es el `maxlength` del campo. */
export const PHONE_MAX_LENGTH = 20;

/** Un número al que se pueda llamar: sin letras y con al menos siete dígitos. */
export const PHONE_PATTERN = /^[0-9+()\s-]{7,20}$/;

/** Quita del texto todo lo que un teléfono no puede llevar. */
export function sanitizePhone(value: string): string {
  return value.replace(PHONE_CHARACTERS, '').slice(0, PHONE_MAX_LENGTH);
}

/** Enlace de WhatsApp a un teléfono escrito con espacios, guiones o paréntesis. */
export function whatsappUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits.length === 10 ? COLOMBIA_DIALING_CODE + digits : digits}`;
}
