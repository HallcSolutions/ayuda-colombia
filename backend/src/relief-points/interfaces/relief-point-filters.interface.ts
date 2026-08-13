import {
  ReliefPointStatus,
  ReliefPointType,
} from '../../common/constants/app.constants';
import { RegionFilters } from '../../common/interfaces/region-filters.interface';

export interface ReliefPointFilters extends RegionFilters {
  type?: ReliefPointType;
  status?: ReliefPointStatus;
}
