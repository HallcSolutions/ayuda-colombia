import {
  MissingStatus,
  MissingSubjectKind,
} from '../../common/constants/app.constants';
import { RegionFilters } from '../../common/interfaces/region-filters.interface';

export interface MissingFilters extends RegionFilters {
  kind?: MissingSubjectKind;
  status?: MissingStatus;
}
