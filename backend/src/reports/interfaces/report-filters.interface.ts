import { ReportStatus } from '../../common/constants/app.constants';
import { RegionFilters } from '../../common/interfaces/region-filters.interface';

export interface ReportFilters extends RegionFilters {
  need?: string;
  status?: ReportStatus;
}
