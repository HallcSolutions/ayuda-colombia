import { LodgingStatus } from '../../core/constants/app.constants';
import { LodgingOffer } from '../../core/models/lodging-offer.model';
import { MapMarker, MapMarkerTone } from '../../shared/colombia-map/colombia-map.model';

const TONE_BY_STATUS: Record<LodgingStatus, MapMarkerTone> = {
  [LodgingStatus.AVAILABLE]: 'active',
  [LodgingStatus.FULL]: 'warning',
  [LodgingStatus.CLOSED]: 'muted',
};

/**
 * Convierte un alojamiento en su chincheta.
 * Devuelve `null` cuando quien lo ofreció no marcó el punto en el mapa.
 */
export function toMapMarker(offer: LodgingOffer): MapMarker | null {
  if (!offer.coordinates) return null;
  return {
    id: offer.id,
    latitude: offer.coordinates.latitude,
    longitude: offer.coordinates.longitude,
    department: offer.department,
    municipality: offer.municipality,
    label: `${offer.placeName} · ${offer.municipality}`,
    tone: TONE_BY_STATUS[offer.status],
    // El halo señala lo que sirve ahora mismo: quedan cupos libres.
    urgent: offer.status === LodgingStatus.AVAILABLE,
  };
}
