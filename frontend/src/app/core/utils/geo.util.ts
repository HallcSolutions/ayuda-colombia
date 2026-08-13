import { Coordinates } from '../models/coordinates.model';

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Distancia en kilómetros entre dos coordenadas (fórmula de Haversine). */
export function distanceInKm(origin: Coordinates, target: Coordinates): number {
  const deltaLatitude = toRadians(target.latitude - origin.latitude);
  const deltaLongitude = toRadians(target.longitude - origin.longitude);
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(origin.latitude)) *
      Math.cos(toRadians(target.latitude)) *
      Math.sin(deltaLongitude / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

/**
 * Enlace para llegar hasta el punto. Abre Google Maps con la ruta desde donde esté quien
 * consulta: en el teléfono salta a la app y da las indicaciones de una vez, que es lo que
 * hace falta en una emergencia. Es un enlace normal, no necesita clave ni pago.
 */
export function mapUrl({ latitude, longitude }: Coordinates): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

/** Cercanía del callejero incrustado: la cuadra del punto, no la ciudad entera. */
const STREET_ZOOM = 16;

/** Mapa de calles incrustable alrededor del punto; el dibujo del país no llega a ese detalle. */
export function streetMapUrl({ latitude, longitude }: Coordinates): string {
  return `https://maps.google.com/maps?q=${latitude},${longitude}&z=${STREET_ZOOM}&output=embed`;
}
