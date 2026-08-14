import { AidAlert } from '../models/aid-alert.model';

/**
 * Una alerta suele enumerar varias necesidades en una sola frase ("guantes, cascos,
 * agua"). Separarlas deja una etiqueta por necesidad: se lee de un vistazo y se puede
 * retirar sola cuando esa ya llegó, sin cerrar lo que todavía hace falta.
 *
 * Si el mensaje no enumera nada, la necesidad es el titular de la alerta: así siempre
 * hay algo que retirar.
 */
export function alertNeeds(alert: AidAlert): string[] {
  const needs = alert.message
    .split(/[,;·]/)
    .map((need) => need.trim().replace(/\.+$/, ''))
    .filter(Boolean);
  return (needs.length ? needs : [alert.title.trim()].filter(Boolean)).map(
    (need) => need[0].toUpperCase() + need.slice(1),
  );
}
