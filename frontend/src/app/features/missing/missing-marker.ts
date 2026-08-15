import { MissingStatus } from '../../core/constants/app.constants';
import { MissingRecord } from '../../core/models/missing-record.model';
import { MapMarker, MapMarkerTone } from '../../shared/colombia-map/colombia-map.model';

const TONE_BY_STATUS: Record<MissingStatus, MapMarkerTone> = {
  [MissingStatus.SEARCHING]: 'warning',
  [MissingStatus.SHELTERED]: 'active',
  [MissingStatus.FOUND]: 'active',
  [MissingStatus.CLOSED]: 'muted',
};

/**
 * Convierte una búsqueda en la chincheta del último avistamiento.
 * Devuelve `null` cuando nadie pudo precisar dónde se le vio por última vez.
 */
export function toMapMarker(record: MissingRecord): MapMarker | null {
  if (!record.coordinates) return null;
  return {
    id: record.id,
    latitude: record.coordinates.latitude,
    longitude: record.coordinates.longitude,
    department: record.department,
    municipality: record.municipality,
    label: `${record.name} · ${record.lastSeenPlace}`,
    tone: TONE_BY_STATUS[record.status],
    urgent: record.status === MissingStatus.SEARCHING,
  };
}
