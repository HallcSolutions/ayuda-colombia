import {
  AlertStatus,
  SupplyCategory,
  UrgencyLevel,
} from '../constants/app.constants';
import { ReliefPointSummary } from './relief-point.interface';

export interface AidAlert {
  id: string;
  reliefPointId: string;
  reliefPoint: ReliefPointSummary;
  category: SupplyCategory;
  severity: UrgencyLevel;
  title: string;
  message: string;
  requestedQuantity: string;
  status: AlertStatus;
  createdBy: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
