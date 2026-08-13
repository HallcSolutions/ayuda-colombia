import {
  AlertStatus,
  SupplyCategory,
} from '../../common/constants/app.constants';
import { RegionFilters } from '../../common/interfaces/region-filters.interface';

export interface AidAlertFilters extends RegionFilters {
  status?: AlertStatus;
  category?: SupplyCategory;
  reliefPointId?: string;
}
