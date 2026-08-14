import { ReportStatus, UrgencyLevel } from '../constants/app.constants';
import { ReportLocation } from './report-location.interface';

export interface HouseReport {
  id: string;
  department: string;
  municipality: string;
  addressReference: string;
  householdSize: number;
  urgency: UrgencyLevel;
  needs: string[];
  notice: string;
  photos: string[];
  location: ReportLocation;
  status: ReportStatus;
  consentToShareLocation: boolean;
  createdAt: string;
  updatedAt: string;
}
