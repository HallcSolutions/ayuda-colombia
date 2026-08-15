import {
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
  photos: string[];
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
  /** Dice si la copia del código y el PIN salió al correo indicado al publicar. */
  accessEmailSent: boolean;
}

export interface RecoveryHelperProfile {
  id: string;
  displayName: string;
  department: string;
  municipality: string;
  skills: RecoveryTaskCategory[];
}

export interface RegisteredRecoveryHelper extends RecoveryHelperProfile {
  editPin: string;
  /** Dice si la copia del código y el PIN salió al correo indicado al registrarse. */
  accessEmailSent: boolean;
}

/** Una publicación con su llave privada, tal como se escribe en el correo. */
export interface RecoveryAccessEntry {
  title: string;
  codeLabel: string;
  code: string;
  pin: string;
}

/**
 * Respuesta de la recuperación por correo: nunca dice si la dirección existe,
 * para no convertir el formulario en un buscador de personas registradas.
 */
export interface RecoveryAccessRequest {
  requested: true;
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
  photos: string[];
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
  helperSkills: RecoveryTaskCategory[];
  message: string;
  availability: string;
  status: RecoveryApplicationStatus;
  projectContactName: string;
  projectContactPhone: string;
  createdAt: string;
  updatedAt: string;
}
