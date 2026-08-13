import { MealType } from '../constants/app.constants';

export interface MealService {
  id: string;
  reliefPointId: string;
  mealType: MealType;
  servedOn: string;
  startsAt: string;
  portionsPlanned: number;
  portionsDelivered: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
