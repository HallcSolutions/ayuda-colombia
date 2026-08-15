import { RecoveryProject } from '../../core/models/recovery.model';

/** Ventana abierta sobre la página; `null` es la página sin nada encima. */
export type RecoveryModal =
  'project' | 'helper' | 'helper-manage' | 'verify' | 'apply' | 'manage' | null;

/** Un caso con lo único que hace falta saber de un vistazo: qué le falta todavía. */
export interface RecoveryRow {
  project: RecoveryProject;
  openTasks: number;
  missingPeople: number;
  pendingApplications: number;
}
