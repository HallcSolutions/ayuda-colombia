import { ReliefPointStatus } from '../../core/constants/app.constants';
import { ReliefPoint } from '../../core/models/relief-point.model';
import { MapMarker, MapMarkerTone } from '../../shared/colombia-map/colombia-map.model';

const TONE_BY_STATUS: Record<ReliefPointStatus, MapMarkerTone> = {
  [ReliefPointStatus.ACTIVE]: 'active',
  [ReliefPointStatus.FULL]: 'warning',
  [ReliefPointStatus.CLOSED]: 'muted',
};

/** Convierte un punto de ayuda en la chincheta que dibuja el mapa. */
export function toMapMarker(point: ReliefPoint, urgent: boolean): MapMarker {
  return {
    id: point.id,
    latitude: point.latitude,
    longitude: point.longitude,
    department: point.department,
    municipality: point.municipality,
    label: `${point.name} · ${point.municipality}`,
    tone: TONE_BY_STATUS[point.status],
    urgent,
  };
}
