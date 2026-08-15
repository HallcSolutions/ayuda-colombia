import { PublicNewsCategory } from '../../common/constants/app.constants';
import { RegionFilters } from '../../common/interfaces/region-filters.interface';

export interface PublicNewsFilters extends RegionFilters {
  category?: PublicNewsCategory;
}
