import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  RecoveryApplicationStatus,
  RecoveryProjectStatus,
  RecoveryRiskLevel,
  RecoveryTaskCategory,
  RecoveryTaskStatus,
} from '../constants/app.constants';
import { I18nService } from '../i18n/i18n.service';
import { ApiResponse } from '../interfaces/api-response.interface';
import {
  NewRecoveryHelper,
  NewRecoveryTask,
  PublishedRecoveryProject,
  RecoveryApplication,
  RecoveryHelperProfile,
  RecoveryProject,
  RecoveryTask,
  RecoveryVerificationQueue,
  RegisteredRecoveryHelper,
} from '../models/recovery.model';
import { withRegionParams } from '../utils/region-params.util';
import { RealtimeService } from './realtime.service';
import { RegionService } from './region.service';

const ENDPOINT = '/api/recovery';
const HELPER_STORAGE_KEY = 'redayuda.recovery.helperId';
const recoveryPinHeader = (pin: string) => ({ headers: { 'x-recovery-pin': pin } });
const helperPinHeader = (pin: string) => ({ headers: { 'x-helper-pin': pin } });
const verifierHeader = (key: string) => ({ headers: { 'x-recovery-verifier-key': key } });

@Injectable({ providedIn: 'root' })
export class RecoveryService {
  private readonly http = inject(HttpClient);
  private readonly region = inject(RegionService);
  private readonly i18n = inject(I18nService);
  private loadRequestId = 0;

  readonly projects = signal<RecoveryProject[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly helperId = signal(this.restoreHelperId());
  readonly projectsInRegion = computed(() =>
    this.projects().filter((project) => this.region.matches(project)),
  );

  constructor(realtime: RealtimeService) {
    realtime.listen<RecoveryProject>('/recovery', {
      'recovery.project.created': (project) => this.upsert(project),
      'recovery.project.updated': (project) => this.upsert(project),
    });
  }

  loadProjects(): void {
    const requestId = ++this.loadRequestId;
    this.loading.set(true);
    this.error.set('');
    const params = withRegionParams(new HttpParams(), this.region.selection());
    this.http.get<ApiResponse<RecoveryProject[]>>(`${ENDPOINT}/projects`, { params }).subscribe({
      next: (response) => {
        if (requestId !== this.loadRequestId) return;
        this.projects.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        if (requestId !== this.loadRequestId) return;
        this.error.set(this.i18n.t('recovery.loadError'));
        this.loading.set(false);
      },
    });
  }

  /** Viaja como multipart porque el caso puede llegar con fotos de lo que se necesita. */
  createProject(payload: FormData): Observable<PublishedRecoveryProject> {
    return this.unwrap(
      this.http.post<ApiResponse<PublishedRecoveryProject>>(`${ENDPOINT}/projects`, payload),
    ).pipe(tap((project) => this.upsert(project)));
  }

  createTask(projectId: string, payload: NewRecoveryTask, pin: string): Observable<RecoveryTask> {
    return this.unwrap(
      this.http.post<ApiResponse<RecoveryTask>>(
        `${ENDPOINT}/projects/${projectId}/tasks`,
        payload,
        recoveryPinHeader(pin),
      ),
    );
  }

  registerHelper(payload: NewRecoveryHelper): Observable<RegisteredRecoveryHelper> {
    return this.unwrap(
      this.http.post<ApiResponse<RegisteredRecoveryHelper>>(`${ENDPOINT}/helpers`, payload),
    ).pipe(tap((helper) => this.rememberHelper(helper.id)));
  }

  /**
   * Pide que el código y un PIN nuevo vuelvan al correo con el que se publicó.
   * La API responde igual exista o no la dirección: aquí no se sabe más que eso.
   */
  recoverAccess(email: string): Observable<void> {
    return this.unwrap(this.http.post<ApiResponse<void>>(`${ENDPOINT}/access/recover`, { email }));
  }

  getHelper(id: string, pin: string): Observable<RecoveryHelperProfile> {
    return this.unwrap(
      this.http.get<ApiResponse<RecoveryHelperProfile>>(
        `${ENDPOINT}/helpers/${id}`,
        helperPinHeader(pin),
      ),
    );
  }

  applyToTask(
    taskId: string,
    helperId: string,
    helperPin: string,
    message: string,
    availability: string,
  ): Observable<RecoveryApplication> {
    return this.unwrap(
      this.http.post<ApiResponse<RecoveryApplication>>(
        `${ENDPOINT}/tasks/${taskId}/applications`,
        { helperId, message, availability },
        helperPinHeader(helperPin),
      ),
    );
  }

  getProjectApplications(projectId: string, pin: string): Observable<RecoveryApplication[]> {
    return this.unwrap(
      this.http.get<ApiResponse<RecoveryApplication[]>>(
        `${ENDPOINT}/projects/${projectId}/applications`,
        recoveryPinHeader(pin),
      ),
    );
  }

  getHelperApplications(helperId: string, pin: string): Observable<RecoveryApplication[]> {
    return this.unwrap(
      this.http.get<ApiResponse<RecoveryApplication[]>>(
        `${ENDPOINT}/helpers/${helperId}/applications`,
        helperPinHeader(pin),
      ),
    );
  }

  withdrawApplication(applicationId: string, pin: string): Observable<RecoveryApplication> {
    return this.unwrap(
      this.http.patch<ApiResponse<RecoveryApplication>>(
        `${ENDPOINT}/applications/${applicationId}/withdraw`,
        {},
        helperPinHeader(pin),
      ),
    );
  }

  updateApplication(
    projectId: string,
    applicationId: string,
    status: RecoveryApplicationStatus,
    pin: string,
  ): Observable<RecoveryApplication> {
    return this.unwrap(
      this.http.patch<ApiResponse<RecoveryApplication>>(
        `${ENDPOINT}/projects/${projectId}/applications/${applicationId}`,
        { status },
        recoveryPinHeader(pin),
      ),
    );
  }

  updateProject(
    projectId: string,
    status: RecoveryProjectStatus,
    pin: string,
  ): Observable<RecoveryProject> {
    return this.unwrap(
      this.http.patch<ApiResponse<RecoveryProject>>(
        `${ENDPOINT}/projects/${projectId}`,
        { status },
        recoveryPinHeader(pin),
      ),
    ).pipe(tap((project) => this.upsert(project)));
  }

  updateTask(
    projectId: string,
    taskId: string,
    status: RecoveryTaskStatus,
    pin: string,
  ): Observable<RecoveryTask> {
    return this.unwrap(
      this.http.patch<ApiResponse<RecoveryTask>>(
        `${ENDPOINT}/projects/${projectId}/tasks/${taskId}`,
        { status },
        recoveryPinHeader(pin),
      ),
    );
  }

  verificationQueue(key: string): Observable<RecoveryVerificationQueue> {
    return this.unwrap(
      this.http.get<ApiResponse<RecoveryVerificationQueue>>(
        `${ENDPOINT}/verification/queue`,
        verifierHeader(key),
      ),
    );
  }

  reviewProject(
    id: string,
    status: RecoveryProjectStatus,
    verifiedBy: string,
    key: string,
  ): Observable<RecoveryProject> {
    return this.unwrap(
      this.http.patch<ApiResponse<RecoveryProject>>(
        `${ENDPOINT}/verification/projects/${id}`,
        { status, verifiedBy },
        verifierHeader(key),
      ),
    );
  }

  reviewTask(
    id: string,
    riskLevel: RecoveryRiskLevel,
    status: RecoveryTaskStatus,
    reviewedBy: string,
    key: string,
  ): Observable<RecoveryTask> {
    return this.unwrap(
      this.http.patch<ApiResponse<RecoveryTask>>(
        `${ENDPOINT}/verification/tasks/${id}`,
        { riskLevel, status, reviewedBy },
        verifierHeader(key),
      ),
    );
  }

  private unwrap<T>(request: Observable<ApiResponse<T>>): Observable<T> {
    return request.pipe(map((response) => response.data));
  }

  private upsert(project: RecoveryProject): void {
    const isPublic = [
      RecoveryProjectStatus.OPEN,
      RecoveryProjectStatus.IN_PROGRESS,
      RecoveryProjectStatus.PAUSED,
      RecoveryProjectStatus.COMPLETED,
    ].includes(project.status);
    if (!isPublic) {
      this.projects.update((items) => items.filter((item) => item.id !== project.id));
      return;
    }
    this.projects.update((items) =>
      items.some((item) => item.id === project.id)
        ? items.map((item) => (item.id === project.id ? project : item))
        : [project, ...items],
    );
  }

  private rememberHelper(id: string): void {
    this.helperId.set(id);
    try {
      localStorage.setItem(HELPER_STORAGE_KEY, id);
    } catch {
      // El código también se muestra para que la persona pueda conservarlo por su cuenta.
    }
  }

  private restoreHelperId(): string {
    try {
      return localStorage.getItem(HELPER_STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  }
}
