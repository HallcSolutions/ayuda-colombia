/**
 * Una alerta enumera varias necesidades en una sola frase ("guantes, cascos, agua").
 * Separarlas permite retirar la que ya llegó y dejar en pie el resto, en vez de
 * cerrar la alerta entera y perder lo que todavía hace falta.
 */
export function splitNeeds(alert: {
  title: string;
  message: string;
}): string[] {
  const needs = alert.message
    .split(/[,;·]/)
    .map((need) => need.trim().replace(/\.+$/, ''))
    .filter(Boolean);
  return needs.length ? needs : [alert.title.trim()].filter(Boolean);
}

/** Quien retira escribe lo que ve en pantalla: se compara sin acentos ni mayúsculas. */
export function withoutNeed(needs: string[], need: string): string[] {
  const target = normalize(need);
  return needs.filter((item) => normalize(item) !== target);
}

const normalize = (need: string): string =>
  need
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
