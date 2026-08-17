import { ConvoyStatus } from '../../core/constants/app.constants';
import { ConvoyTrip } from '../../core/models/convoy-trip.model';
import { MapMarker, MapMarkerTone, MapTrail } from '../../shared/colombia-map/colombia-map.model';

const TONE_BY_STATUS: Record<ConvoyStatus, MapMarkerTone> = {
  [ConvoyStatus.SCHEDULED]: 'warning',
  [ConvoyStatus.EN_ROUTE]: 'active',
  [ConvoyStatus.PAUSED]: 'warning',
  [ConvoyStatus.ARRIVED]: 'muted',
  [ConvoyStatus.CANCELLED]: 'muted',
};

/** Un viaje se dibuja mientras esté rodando; después ya es historia. */
const isTravelling = (trip: ConvoyTrip): boolean =>
  trip.status === ConvoyStatus.EN_ROUTE || trip.status === ConvoyStatus.PAUSED;

/** Rumbo de la última miga GPS para orientar el camión sin predecir una ubicación falsa. */
function vehicleHeading(trip: ConvoyTrip): number {
  if (trip.trail.length < 2) return 0;
  const from = trip.trail[trip.trail.length - 2];
  const to = trip.trail[trip.trail.length - 1];
  const latitude = ((from.latitude + to.latitude) / 2) * (Math.PI / 180);
  const east = (to.longitude - from.longitude) * Math.cos(latitude);
  const north = to.latitude - from.latitude;
  return ((Math.atan2(east, north) * 180) / Math.PI + 360) % 360;
}

/**
 * La chincheta del camión va donde va el camión. Devuelve `null` cuando quien conduce
 * no autorizó compartir su ubicación: entonces el viaje se anuncia, pero no se ubica.
 *
 * La zona es la de su punto de destino, que es quien lo está esperando: así el camión
 * aparece al enfocar el departamento o la ciudad del acopio al que lleva la ayuda.
 */
export function toMapMarker(trip: ConvoyTrip): MapMarker | null {
  if (!trip.position) return null;
  return {
    id: trip.id,
    latitude: trip.position.latitude,
    longitude: trip.position.longitude,
    department: trip.destination.department,
    municipality: trip.destination.municipality,
    label: `${trip.driverName} · ${trip.destination.name}`,
    tone: TONE_BY_STATUS[trip.status],
    urgent: false,
    symbol: 'vehicle',
    rotation: vehicleHeading(trip),
  };
}

/** Dos caminos por viaje: el recorrido que ya hizo y la carretera que le falta. */
export function toMapTrails(trip: ConvoyTrip): MapTrail[] {
  if (!trip.position || !isTravelling(trip)) return [];

  const zone = {
    department: trip.destination.department,
    municipality: trip.destination.municipality,
    tone: TONE_BY_STATUS[trip.status],
  };
  // Sin carretera calculada, lo que falta se insinúa con una recta hasta el destino.
  const ahead = trip.remainingRoute.length ? trip.remainingRoute : [trip.destination];

  return [
    { id: `${trip.id}:done`, ...zone, points: trip.trail, pending: false },
    { id: `${trip.id}:ahead`, ...zone, points: [trip.position, ...ahead], pending: true },
  ].filter((trail) => trail.points.length > 1);
}
