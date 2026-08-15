import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
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
import { whatsappUrl } from '../../core/utils/phone.util';
import { ColombiaWatermark } from '../../shared/colombia-watermark/colombia-watermark';
import { Modal } from '../../shared/modal/modal';
import { RecoveryApplyForm } from './recovery-apply-form/recovery-apply-form';
import { RecoveryHelperForm } from './recovery-helper-form/recovery-helper-form';
import { RecoveryManagePanel } from './recovery-manage-panel/recovery-manage-panel';
import { RecoveryProjectForm } from './recovery-project-form/recovery-project-form';
import { RecoveryVerifierPanel } from './recovery-verifier-panel/recovery-verifier-panel';

type RecoveryModal = 'project' | 'helper' | 'verify' | 'apply' | 'manage' | null;

@Component({
  selector: 'app-recovery-page',
  imports: [
    Modal,
    ColombiaWatermark,
    RecoveryApplyForm,
    RecoveryHelperForm,
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
  protected readonly t = inject(I18nService).t;
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
  readonly openTasks = computed(
    () =>
      this.visibleProjects()
        .flatMap((project) => project.tasks)
        .filter((task) => task.status === RecoveryTaskStatus.OPEN).length,
  );
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
}
