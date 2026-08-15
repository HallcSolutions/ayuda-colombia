import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  RECOVERY_TASK_CATEGORIES,
  RecoveryApplicationStatus,
  RecoveryProjectStatus,
  RecoveryTaskCategory,
  RecoveryTaskStatus,
} from '../../../core/constants/app.constants';
import {
  helperVerificationKey,
  recoveryApplicationStatusKey,
  recoveryTaskCategoryKey,
} from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import {
  RecoveryApplication,
  RecoveryProject,
  RecoveryTask,
} from '../../../core/models/recovery.model';
import { RecoveryService } from '../../../core/services/recovery.service';

@Component({
  selector: 'app-recovery-manage-panel',
  imports: [ReactiveFormsModule],
  templateUrl: './recovery-manage-panel.html',
  styleUrl: './recovery-manage-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoveryManagePanel {
  private readonly fb = inject(FormBuilder);
  private readonly recovery = inject(RecoveryService);
  protected readonly t = inject(I18nService).t;
  protected readonly statuses = RecoveryApplicationStatus;
  protected readonly taskStatuses = RecoveryTaskStatus;
  protected readonly RecoveryProjectStatus = RecoveryProjectStatus;
  protected readonly categories = RECOVERY_TASK_CATEGORIES;
  protected readonly categoryKey = recoveryTaskCategoryKey;
  protected readonly verificationKey = helperVerificationKey;
  protected readonly applicationStatusKey = recoveryApplicationStatusKey;

  readonly project = input.required<RecoveryProject>();
  readonly pin = signal('');
  readonly applications = signal<RecoveryApplication[]>([]);
  readonly tasks = signal<RecoveryTask[]>([]);
  readonly projectStatus = signal<RecoveryProjectStatus | null>(null);
  readonly authenticated = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly taskCreated = signal(false);

  readonly taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(160)]],
    description: ['', [Validators.required, Validators.maxLength(900)]],
    category: [RecoveryTaskCategory.CLEANING, Validators.required],
    peopleNeeded: [4, [Validators.required, Validators.min(1), Validators.max(100)]],
    skillsRequired: ['', Validators.maxLength(400)],
    materialsNeeded: ['', Validators.maxLength(500)],
  });

  updatePin(event: Event): void {
    this.pin.set((event.target as HTMLInputElement).value.trim());
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.applications.set(
        await firstValueFrom(this.recovery.getProjectApplications(this.project().id, this.pin())),
      );
      this.tasks.set(this.project().tasks);
      this.projectStatus.set(this.project().status);
      this.authenticated.set(true);
    } catch {
      this.error.set(this.t('recovery.manage.badPin'));
    } finally {
      this.loading.set(false);
    }
  }

  async decide(application: RecoveryApplication, status: RecoveryApplicationStatus): Promise<void> {
    this.error.set('');
    try {
      const updated = await firstValueFrom(
        this.recovery.updateApplication(this.project().id, application.id, status, this.pin()),
      );
      this.applications.update((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch {
      this.error.set(this.t('recovery.manage.actionError'));
    }
  }

  async addTask(): Promise<void> {
    this.taskForm.markAllAsTouched();
    if (this.taskForm.invalid) return;
    const value = this.taskForm.getRawValue();
    this.loading.set(true);
    this.error.set('');
    try {
      await firstValueFrom(
        this.recovery.createTask(
          this.project().id,
          {
            title: value.title.trim(),
            description: value.description.trim(),
            category: value.category,
            peopleNeeded: value.peopleNeeded,
            skillsRequired: value.skillsRequired.trim(),
            materialsNeeded: value.materialsNeeded.trim(),
          },
          this.pin(),
        ),
      );
      this.taskCreated.set(true);
      this.taskForm.reset({
        title: '',
        description: '',
        category: RecoveryTaskCategory.CLEANING,
        peopleNeeded: 4,
        skillsRequired: '',
        materialsNeeded: '',
      });
    } catch {
      this.error.set(this.t('recovery.manage.actionError'));
    } finally {
      this.loading.set(false);
    }
  }

  async changeTask(taskId: string, status: RecoveryTaskStatus): Promise<void> {
    try {
      const updated = await firstValueFrom(
        this.recovery.updateTask(this.project().id, taskId, status, this.pin()),
      );
      this.tasks.update((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      this.recovery.loadProjects();
    } catch {
      this.error.set(this.t('recovery.manage.actionError'));
    }
  }

  async changeProject(status: RecoveryProjectStatus): Promise<void> {
    try {
      const updated = await firstValueFrom(
        this.recovery.updateProject(this.project().id, status, this.pin()),
      );
      this.projectStatus.set(updated.status);
    } catch {
      this.error.set(this.t('recovery.manage.actionError'));
    }
  }
}
