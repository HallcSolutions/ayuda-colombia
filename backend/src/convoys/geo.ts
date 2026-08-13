import { GeoPoint } from '../common/interfaces/convoy-trip.interface';

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Distancia en línea recta entre dos puntos del territorio. */
export function distanceKm(from: GeoPoint, to: GeoPoint): number {
  const latitudeGap = toRadians(to.latitude - from.latitude);
  const longitudeGap = toRadians(to.longitude - from.longitude);
  const chord =
    Math.sin(latitudeGap / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeGap / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(chord)));
}

/** Largo de un camino punto por punto. */
export function pathLengthKm(points: readonly GeoPoint[]): number {
  return points.reduce(
    (total, point, index) =>
      index === 0 ? 0 : total + distanceKm(points[index - 1], point),
    0,
  );
}

/** Lo que falta de una carretera ya calculada, visto desde donde va el camión. */
export interface RouteAhead {
  /** Tramo que aún no ha recorrido. */
  points: GeoPoint[];
  km: number;
  /** Cuánto se separó de la carretera: si crece, es que tomó otro camino. */
  offRouteKm: number;
}

/**
 * Recorta la carretera guardada por el punto más cercano al camión. Así el tramo que
 * falta y los kilómetros restantes bajan con cada ping sin volver a pedirle la ruta al
 * motor, y una desviación grande queda a la vista en `offRouteKm`.
 */
export function routeAhead(
  route: readonly GeoPoint[],
  position: GeoPoint,
): RouteAhead | null {
  if (route.length < 2) return null;

  let nearestIndex = 0;
  let offRouteKm = Infinity;
  route.forEach((point, index) => {
    const gap = distanceKm(position, point);
    if (gap < offRouteKm) {
      offRouteKm = gap;
      nearestIndex = index;
    }
  });

  const points = route.slice(nearestIndex);
  return { points, km: offRouteKm + pathLengthKm(points), offRouteKm };
}

/** Recorta un camino a `max` puntos conservando el primero, el último y el reparto. */
export function downsample<T>(points: readonly T[], max: number): T[] {
  if (points.length <= max) return [...points];
  const step = (points.length - 1) / (max - 1);
  return Array.from(
    { length: max },
    (_, index) => points[Math.round(index * step)],
  );
}
