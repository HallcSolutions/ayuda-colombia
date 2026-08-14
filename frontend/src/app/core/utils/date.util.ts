/**
 * Todo lo que se ve en RedAyuda va en hora de Colombia. Quien lee "el camión sale a las
 * 5:30 p. m." necesita la hora del punto, no la del aparato desde el que mira: la red la
 * consultan también desde fuera del país y una hora corrida manda a una familia tarde.
 *
 * Colombia no cambia de hora, así que el desfase es fijo y exacto todo el año.
 */
export const COLOMBIA_TIME_ZONE = 'America/Bogota';

/** El mismo huso para el pipe `date`, que solo entiende desplazamientos. */
export const COLOMBIA_UTC_OFFSET = '-0500';

/** Fecha en Colombia, formato AAAA-MM-DD, que es el contrato de `servedOn`. */
export function toIsoDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: COLOMBIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Hora en Colombia, formato HH:mm, que es el contrato de `startsAt`. */
export function toIsoTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: COLOMBIA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/** Día y hora de Colombia, con el mismo formato en toda la app. */
export function colombiaDateTime(value: string | Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-CO' : 'en-US', {
    timeZone: COLOMBIA_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

/** Valor inicial de un campo `datetime-local`: ahora mismo, en hora de Colombia. */
export function colombiaInputValue(date: Date = new Date()): string {
  return `${toIsoDate(date)}T${toIsoTime(date)}`;
}

/**
 * Lo que se escribe en un campo `datetime-local` es hora de Colombia, la del sitio del
 * que se habla, aunque quien lo escriba esté en otro país.
 */
export function colombiaInputToIso(value: string): string {
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  return new Date(`${withSeconds}-05:00`).toISOString();
}
