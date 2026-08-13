/** Fecha local en formato AAAA-MM-DD, que es el contrato de `servedOn`. */
export function toIsoDate(date: Date = new Date()): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Hora local en formato HH:mm, que es el contrato de `startsAt`. */
export function toIsoTime(date: Date = new Date()): string {
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}
