import { MealType } from '../../common/constants/app.constants';
import { RegionFilters } from '../../common/interfaces/region-filters.interface';

export interface MealServiceFilters extends RegionFilters {
  reliefPointId?: string;
  servedOn?: string;
  mealType?: MealType;
}
