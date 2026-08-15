import {
  HelperCredentialType,
  HelperVerificationLevel,
  HelperVerificationMethod,
  RecoveryApplicationStatus,
  RecoveryProjectKind,
  RecoveryProjectStatus,
  RecoveryRiskLevel,
  RecoverySalesMode,
  RecoveryTaskCategory,
  RecoveryTaskStatus,
} from '../constants/app.constants';

export interface RecoveryTask {
  id: string;
  title: string;
  description: string;
  category: RecoveryTaskCategory;
  riskLevel: RecoveryRiskLevel;
  status: RecoveryTaskStatus;
  peopleNeeded: number;
  acceptedHelpers: number;
  applicationCount: number;
  scheduledFor: string | null;
  durationHours: number | null;
  skillsRequired: string;
  materialsNeeded: string;
  professionalRequired: boolean;
  reviewedBy: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryProject {
  id: string;
  kind: RecoveryProjectKind;
  name: string;
  story: string;
  department: string;
  municipality: string;
  areaReference: string;
  productsOrServices: string;
  priceReference: string;
  salesModes: RecoverySalesMode[];
  schedule: string;
  publicContactPhone: string;
  status: RecoveryProjectStatus;
  verifiedBy: string;
  verifiedAt: string | null;
  pendingTaskCount: number;
  tasks: RecoveryTask[];
  createdAt: string;
  updatedAt: string;
}

export interface NewRecoveryProject {
  kind: RecoveryProjectKind;
  name: string;
  story: string;
  organizerName: string;
  contactPhone: string;
  department: string;
  municipality: string;
  areaReference: string;
  productsOrServices?: string;
  priceReference?: string;
  salesModes?: RecoverySalesMode[];
  schedule?: string;
  shareContactPublicly?: boolean;
  consentToVerification: boolean;
}

export interface PublishedRecoveryProject extends RecoveryProject {
  editPin: string;
}

export interface NewRecoveryTask {
  title: string;
  description: string;
  category: RecoveryTaskCategory;
  peopleNeeded: number;
  scheduledFor?: string;
  durationHours?: number;
  skillsRequired?: string;
  materialsNeeded?: string;
}

export interface NewRecoveryHelper {
  fullName: string;
  displayName: string;
  documentType: string;
  documentNumber: string;
  contactPhone: string;
  department: string;
  municipality: string;
  skills: RecoveryTaskCategory[];
  bio?: string;
  yearsExperience: number;
  credentialType: HelperCredentialType;
  credentialNumber?: string;
  credentialIssuer?: string;
  referenceName?: string;
  referencePhone?: string;
  consentToVerification: boolean;
}

export interface RecoveryHelperProfile {
  id: string;
  displayName: string;
  department: string;
  municipality: string;
  skills: RecoveryTaskCategory[];
  verifiedSkills: RecoveryTaskCategory[];
  bio: string;
  yearsExperience: number;
  verificationLevel: HelperVerificationLevel;
  verificationMethod: HelperVerificationMethod | null;
  verifiedBy: string;
  verifiedAt: string | null;
  verificationSourceName: string;
}

export interface RegisteredRecoveryHelper extends RecoveryHelperProfile {
  editPin: string;
}

export interface RecoveryApplication {
  id: string;
  projectId: string;
  projectName: string;
  taskId: string;
  taskTitle: string;
  helperId: string;
  helperName: string;
  helperPhone: string;
  helperVerificationLevel: HelperVerificationLevel;
  helperVerifiedSkills: RecoveryTaskCategory[];
  helperVerificationSource: string;
  message: string;
  availability: string;
  status: RecoveryApplicationStatus;
  projectContactName: string;
  projectContactPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryProjectReviewItem extends Omit<
  NewRecoveryProject,
  'consentToVerification'
> {
  id: string;
  status: RecoveryProjectStatus;
  createdAt: string;
  productsOrServices: string;
  priceReference: string;
  salesModes: RecoverySalesMode[];
  schedule: string;
  shareContactPublicly: boolean;
}

export interface RecoveryTaskReviewItem extends NewRecoveryTask {
  id: string;
  projectId: string;
  projectName: string;
  organizerName: string;
  contactPhone: string;
  department: string;
  municipality: string;
  riskLevel: RecoveryRiskLevel;
  status: RecoveryTaskStatus;
  skillsRequired: string;
  materialsNeeded: string;
  createdAt: string;
}

export interface RecoveryHelperReviewItem extends Omit<NewRecoveryHelper, 'consentToVerification'> {
  id: string;
  verificationLevel: HelperVerificationLevel;
  createdAt: string;
  bio: string;
  credentialNumber: string;
  credentialIssuer: string;
  referenceName: string;
  referencePhone: string;
}

export interface RecoveryVerificationQueue {
  projects: RecoveryProjectReviewItem[];
  tasks: RecoveryTaskReviewItem[];
  helpers: RecoveryHelperReviewItem[];
}
