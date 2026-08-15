import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  RECOVERY_PROJECT_KINDS,
  RecoveryProjectKind,
  RecoveryTaskStatus,
} from '../../core/constants/app.constants';
import { COLOMBIA_DEPARTMENTS } from '../../core/constants/colombia.constants';
import {
  recoveryProjectKindKey,
  recoveryProjectStatusKey,
  recoveryRiskKey,
  recoverySalesModeKey,
  recoveryTaskCategoryKey,
  recoveryTaskStatusKey,
} from '../../core/i18n/domain-keys';
import { I18nService } from '../../core/i18n/i18n.service';
import { RecoveryProject, RecoveryTask } from '../../core/models/recovery.model';
import { RecoveryService } from '../../core/services/recovery.service';
import { RegionService } from '../../core/services/region.service';
import { COLOMBIA_UTC_OFFSET } from '../../core/utils/date.util';
import { mapUrlForAddress, streetMapUrlForAddress } from '../../core/utils/geo.util';
import { whatsappUrl } from '../../core/utils/phone.util';
import { ColombiaWatermark } from '../../shared/colombia-watermark/colombia-watermark';
import { Modal } from '../../shared/modal/modal';
import { RecoveryApplyForm } from './recovery-apply-form/recovery-apply-form';
import { RecoveryHelperForm } from './recovery-helper-form/recovery-helper-form';
import { RecoveryHelperManagePanel } from './recovery-helper-manage-panel/recovery-helper-manage-panel';
import { RecoveryManagePanel } from './recovery-manage-panel/recovery-manage-panel';
import { RecoveryProjectForm } from './recovery-project-form/recovery-project-form';
import { RecoveryVerifierPanel } from './recovery-verifier-panel/recovery-verifier-panel';

type RecoveryModal = 'project' | 'helper' | 'helper-manage' | 'verify' | 'apply' | 'manage' | null;

/** Un caso con lo único que hace falta saber de un vistazo: qué le falta todavía. */
interface RecoveryRow {
  project: RecoveryProject;
  openTasks: number;
  missingPeople: number;
  pendingApplications: number;
}

@Component({
  selector: 'app-recovery-page',
  imports: [
    DatePipe,
    Modal,
    ColombiaWatermark,
    RecoveryApplyForm,
    RecoveryHelperForm,
    RecoveryHelperManagePanel,
    RecoveryManagePanel,
    RecoveryProjectForm,
    RecoveryVerifierPanel,
  ],
  templateUrl: './recovery-page.html',
  styleUrl: './recovery-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoveryPage {
  readonly recovery = inject(RecoveryService);
  readonly region = inject(RegionService);
  readonly i18n = inject(I18nService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly t = this.i18n.t;
  /** Todas las fechas de la app se leen en hora de Colombia, no en la del aparato. */
  protected readonly colombiaTime = COLOMBIA_UTC_OFFSET;
  protected readonly departments = COLOMBIA_DEPARTMENTS;
  protected readonly kinds = RECOVERY_PROJECT_KINDS;
  protected readonly projectKindKey = recoveryProjectKindKey;
  protected readonly projectStatusKey = recoveryProjectStatusKey;
  protected readonly categoryKey = recoveryTaskCategoryKey;
  protected readonly riskKey = recoveryRiskKey;
  protected readonly taskStatusKey = recoveryTaskStatusKey;
  protected readonly salesModeKey = recoverySalesModeKey;
  protected readonly taskStatuses = RecoveryTaskStatus;
  protected readonly projectKinds = RecoveryProjectKind;

  readonly search = signal('');
  readonly kind = signal<'' | RecoveryProjectKind>('');
  readonly modal = signal<RecoveryModal>(null);
  readonly selectedTask = signal<RecoveryTask | null>(null);
  readonly selectedProject = signal<RecoveryProject | null>(null);

  readonly municipalities = computed(() =>
    [
      ...new Set(
        this.recovery
          .projects()
          .filter(
            (item) => !this.region.department() || item.department === this.region.department(),
          )
          .map((item) => item.municipality),
      ),
    ].sort(),
  );
  readonly visibleProjects = computed(() => {
    const search = this.search().trim().toLocaleLowerCase('es');
    const kind = this.kind();
    return this.recovery.projectsInRegion().filter((project) => {
      const matches =
        !search ||
        [
          project.name,
          project.story,
          project.productsOrServices,
          project.areaReference,
          project.municipality,
        ]
          .join(' ')
          .toLocaleLowerCase('es')
          .includes(search);
      return matches && (!kind || project.kind === kind);
    });
  });
  /** Cada fila lleva ya calculado lo que le falta al caso, para no repetirlo en la plantilla. */
  readonly rows = computed<RecoveryRow[]>(() =>
    this.visibleProjects().map((project) => {
      const open = project.tasks.filter((task) => task.status === RecoveryTaskStatus.OPEN);
      return {
        project,
        openTasks: open.length,
        missingPeople: open.reduce(
          (total, task) => total + Math.max(0, task.peopleNeeded - task.acceptedHelpers),
          0,
        ),
        pendingApplications: project.tasks.reduce(
          (total, task) => total + task.applicationCount,
          0,
        ),
      };
    }),
  );
  readonly openTasks = computed(() => this.rows().reduce((total, row) => total + row.openTasks, 0));
  readonly localOffers = computed(
    () => this.visibleProjects().filter((project) => Boolean(project.productsOrServices)).length,
  );

  constructor() {
    effect(() => {
      this.region.selection();
      this.recovery.loadProjects();
    });
  }

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
  updateKind(event: Event): void {
    this.kind.set((event.target as HTMLSelectElement).value as '' | RecoveryProjectKind);
  }
  updateDepartment(event: Event): void {
    this.region.setDepartment((event.target as HTMLSelectElement).value);
  }
  updateMunicipality(event: Event): void {
    this.region.setMunicipality((event.target as HTMLSelectElement).value);
  }
  openModal(modal: Exclude<RecoveryModal, 'apply' | 'manage' | null>): void {
    this.modal.set(modal);
  }
  closeModal(): void {
    this.modal.set(null);
    this.selectedTask.set(null);
    this.selectedProject.set(null);
  }
  apply(task: RecoveryTask): void {
    this.selectedTask.set(task);
    this.modal.set('apply');
  }
  manage(project: RecoveryProject): void {
    this.selectedProject.set(project);
    this.modal.set('manage');
  }
  whatsapp(phone: string): string {
    return whatsappUrl(phone);
  }

  /** Solo los lugares públicos activan el mapa con una dirección declarada como exacta. */
  hasPublicLocation(project: RecoveryProject): boolean {
    return project.kind !== RecoveryProjectKind.HOME && Boolean(project.areaReference.trim());
  }

  /** En viviendas, el destino contiene únicamente la zona que ya aparece en el listado público. */
  directions(project: RecoveryProject): string {
    return mapUrlForAddress(this.locationQuery(project));
  }

  streetMap(project: RecoveryProject): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      streetMapUrlForAddress(this.locationQuery(project)),
    );
  }

  private locationQuery(project: RecoveryProject): string {
    return [project.areaReference, project.municipality, project.department, 'Colombia']
      .filter(Boolean)
      .join(', ');
  }
}
