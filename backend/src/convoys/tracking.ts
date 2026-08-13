import { GeoPoint } from '../common/interfaces/convoy-trip.interface';
import { pathLengthKm } from './geo';

/** Una miga del camino con la hora en que se registró. */
export interface TrailPoint extends GeoPoint {
  recordedAt: Date;
}

/** Ventana con la que se mide la marcha: lo de hace una hora ya no dice cómo va ahora. */
const SPEED_WINDOW_MINUTES = 20;
/** Ningún camión de ayuda va más rápido que esto: por encima, el GPS mintió. */
const MAX_TRUCK_SPEED_KMH = 100;
/** Debajo de esta marcha el camión está detenido o en trancón: no sirve para proyectar. */
export const MIN_RELIABLE_SPEED_KMH = 8;
/** Marcha de referencia de un camión cargado en carretera colombiana. */
export const DEFAULT_TRUCK_SPEED_KMH = 45;

const HOUR_IN_MS = 3_600_000;

/**
 * Velocidad media reciente, medida sobre el camino que el camión de verdad recorrió.
 * Devuelve `null` cuando todavía no hay tramo suficiente para afirmar nada.
 */
export function observedSpeedKmh(
  trail: readonly TrailPoint[],
  now: Date,
): number | null {
  const since = now.getTime() - SPEED_WINDOW_MINUTES * 60_000;
  const recent = trail.filter((point) => point.recordedAt.getTime() >= since);
  if (recent.length < 2) return null;

  const hours =
    (recent[recent.length - 1].recordedAt.getTime() -
      recent[0].recordedAt.getTime()) /
    HOUR_IN_MS;
  if (hours <= 0) return null;

  const speed = pathLengthKm(recent) / hours;
  return Math.round(Math.min(speed, MAX_TRUCK_SPEED_KMH) * 10) / 10;
}

/**
 * Hora de llegada: los kilómetros que faltan por carretera a la marcha que el camión
 * lleva de verdad. Si va detenido se proyecta con la marcha de referencia, porque un
 * trancón no significa que ya no vaya a llegar.
 */
export function estimateArrival(
  remainingKm: number | null,
  speedKmh: number | null,
  now: Date,
): Date | null {
  if (remainingKm === null) return null;
  const speed =
    speedKmh && speedKmh >= MIN_RELIABLE_SPEED_KMH
      ? speedKmh
      : DEFAULT_TRUCK_SPEED_KMH;
  return new Date(now.getTime() + (remainingKm / speed) * HOUR_IN_MS);
}
