import { ReliefPointStatus, ReliefPointType } from '../constants/app.constants';

export interface ReliefPointSummary {
  id: string;
  name: string;
  type: ReliefPointType;
  department: string;
  municipality: string;
  latitude: number;
  longitude: number;
}

export interface ReliefPoint extends ReliefPointSummary {
  addressReference: string;
  contactName: string;
  contactPhone: string;
  schedule: string;
  dailyMealCapacity: number | null;
  status: ReliefPointStatus;
  notes: string;
  /** Quién verificó el sitio; cadena vacía si nadie lo ha confirmado todavía. */
  verifiedBy: string;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
