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
  /** Confirma que hay necesidades declaradas sin exponer tareas aún no revisadas. */
  pendingTaskCount: number;
  tasks: RecoveryTask[];
  createdAt: string;
  updatedAt: string;
}

export interface PublishedRecoveryProject extends RecoveryProject {
  editPin: string;
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

/** Solo lo ve el equipo verificador; documento, contacto y credencial nunca son públicos. */
export interface RecoveryHelperReviewItem {
  id: string;
  fullName: string;
  displayName: string;
  documentType: string;
  documentNumber: string;
  contactPhone: string;
  department: string;
  municipality: string;
  skills: RecoveryTaskCategory[];
  bio: string;
  yearsExperience: number;
  credentialType: HelperCredentialType;
  credentialNumber: string;
  credentialIssuer: string;
  referenceName: string;
  referencePhone: string;
  verificationLevel: HelperVerificationLevel;
  createdAt: string;
}

export interface RecoveryProjectReviewItem {
  id: string;
  kind: RecoveryProjectKind;
  name: string;
  story: string;
  organizerName: string;
  contactPhone: string;
  department: string;
  municipality: string;
  areaReference: string;
  productsOrServices: string;
  priceReference: string;
  salesModes: RecoverySalesMode[];
  schedule: string;
  shareContactPublicly: boolean;
  status: RecoveryProjectStatus;
  createdAt: string;
}

export interface RecoveryTaskReviewItem {
  id: string;
  projectId: string;
  projectName: string;
  organizerName: string;
  contactPhone: string;
  department: string;
  municipality: string;
  title: string;
  description: string;
  category: RecoveryTaskCategory;
  riskLevel: RecoveryRiskLevel;
  status: RecoveryTaskStatus;
  peopleNeeded: number;
  skillsRequired: string;
  materialsNeeded: string;
  createdAt: string;
}

export interface RecoveryVerificationQueue {
  projects: RecoveryProjectReviewItem[];
  tasks: RecoveryTaskReviewItem[];
  helpers: RecoveryHelperReviewItem[];
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
  helperVerifiedBy: string;
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
