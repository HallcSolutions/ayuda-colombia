/** Colombia marca 10 dígitos; el enlace de WhatsApp necesita el indicativo del país. */
const COLOMBIA_DIALING_CODE = '57';

/** Enlace de WhatsApp a un teléfono escrito con espacios, guiones o paréntesis. */
export function whatsappUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits.length === 10 ? COLOMBIA_DIALING_CODE + digits : digits}`;
}
