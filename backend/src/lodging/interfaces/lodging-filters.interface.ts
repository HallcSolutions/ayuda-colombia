import {
  LodgingKind,
  LodgingStatus,
} from '../../common/constants/app.constants';
import { RegionFilters } from '../../common/interfaces/region-filters.interface';

export interface LodgingFilters extends RegionFilters {
  kind?: LodgingKind;
  status?: LodgingStatus;
  /** Solo los alojamientos que hoy tienen cupos libres. */
  onlyAvailable?: boolean;
}
