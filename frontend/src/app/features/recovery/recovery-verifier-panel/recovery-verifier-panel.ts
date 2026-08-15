import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  RecoveryProjectStatus,
  RecoveryRiskLevel,
  RecoveryTaskStatus,
} from '../../../core/constants/app.constants';
import {
  recoveryProjectKindKey,
  recoveryRiskKey,
  recoveryTaskCategoryKey,
} from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { RecoveryVerificationQueue } from '../../../core/models/recovery.model';
import { RecoveryService } from '../../../core/services/recovery.service';

@Component({
  selector: 'app-recovery-verifier-panel',
  templateUrl: './recovery-verifier-panel.html',
  styleUrl: './recovery-verifier-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoveryVerifierPanel {
  private readonly recovery = inject(RecoveryService);
  protected readonly t = inject(I18nService).t;
  protected readonly projectKindKey = recoveryProjectKindKey;
  protected readonly categoryKey = recoveryTaskCategoryKey;
  protected readonly riskKey = recoveryRiskKey;
  protected readonly risks = Object.values(RecoveryRiskLevel);
  protected readonly RecoveryProjectStatus = RecoveryProjectStatus;
  protected readonly RecoveryTaskStatus = RecoveryTaskStatus;

  readonly key = signal('');
  readonly reviewer = signal('');
  readonly queue = signal<RecoveryVerificationQueue | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly taskRisks = signal<Record<string, RecoveryRiskLevel>>({});

  updateKey(event: Event): void {
    this.key.set((event.target as HTMLInputElement).value);
  }
  updateReviewer(event: Event): void {
    this.reviewer.set((event.target as HTMLInputElement).value);
  }
  updateRisk(id: string, event: Event): void {
    const risk = (event.target as HTMLSelectElement).value as RecoveryRiskLevel;
    this.taskRisks.update((items) => ({ ...items, [id]: risk }));
  }

  async load(): Promise<void> {
    if (!this.key().trim() || !this.reviewer().trim()) {
      this.error.set(this.t('recovery.verify.credentialsRequired'));
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.recovery.verificationQueue(this.key()).subscribe({
      next: (queue) => {
        this.queue.set(queue);
        this.taskRisks.set(
          Object.fromEntries(queue.tasks.map((task) => [task.id, task.riskLevel])),
        );
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.t('recovery.verify.loadError'));
        this.loading.set(false);
      },
    });
  }

  reviewProject(id: string, status: RecoveryProjectStatus): void {
    this.recovery.reviewProject(id, status, this.reviewer(), this.key()).subscribe({
      next: () => {
        this.remove('projects', id);
        this.recovery.loadProjects();
      },
      error: () => this.error.set(this.t('recovery.verify.actionError')),
    });
  }

  reviewTask(id: string, status: RecoveryTaskStatus): void {
    const risk = this.taskRisks()[id];
    this.recovery.reviewTask(id, risk, status, this.reviewer(), this.key()).subscribe({
      next: () => this.remove('tasks', id),
      error: () => this.error.set(this.t('recovery.verify.actionError')),
    });
  }

  private remove(group: keyof RecoveryVerificationQueue, id: string): void {
    this.queue.update((queue) =>
      queue ? { ...queue, [group]: queue[group].filter((item) => item.id !== id) } : queue,
    );
  }
}
