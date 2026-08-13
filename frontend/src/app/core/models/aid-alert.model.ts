import { AlertStatus, SupplyCategory, UrgencyLevel } from '../constants/app.constants';
import { ReliefPointSummary } from './relief-point.model';

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

export interface CreateAidAlertPayload {
  reliefPointId: string;
  category: SupplyCategory;
  severity: UrgencyLevel;
  title: string;
  message: string;
  requestedQuantity?: string;
  createdBy: string;
}
