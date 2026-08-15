import { ReportStatus, UrgencyLevel } from '../constants/app.constants';
import { DirectHelpContact } from './direct-help-contact.interface';
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
  location: ReportLocation | null;
  directContact: DirectHelpContact | null;
  fieldVerified: boolean;
  verifiedAt: string | null;
  status: ReportStatus;
  consentToShareLocation: boolean;
  createdAt: string;
  updatedAt: string;
}
