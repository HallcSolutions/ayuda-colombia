import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  HelperCredentialType,
  HelperVerificationLevel,
  HelperVerificationMethod,
  RecoveryProjectStatus,
  RecoveryRiskLevel,
  RecoveryTaskCategory,
  RecoveryTaskStatus,
} from '../../../core/constants/app.constants';
import {
  helperCredentialKey,
  recoveryProjectKindKey,
  recoveryRiskKey,
  recoveryTaskCategoryKey,
} from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import {
  RecoveryHelperReviewItem,
  RecoveryVerificationQueue,
} from '../../../core/models/recovery.model';
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
  protected readonly credentialKey = helperCredentialKey;
  protected readonly riskKey = recoveryRiskKey;
  protected readonly risks = Object.values(RecoveryRiskLevel);
  protected readonly RecoveryProjectStatus = RecoveryProjectStatus;
  protected readonly RecoveryTaskStatus = RecoveryTaskStatus;
  protected readonly HelperVerificationLevel = HelperVerificationLevel;

  readonly key = signal('');
  readonly reviewer = signal('');
  readonly queue = signal<RecoveryVerificationQueue | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly taskRisks = signal<Record<string, RecoveryRiskLevel>>({});
  readonly selectedSkills = signal<Record<string, RecoveryTaskCategory[]>>({});
  readonly sourceNames = signal<Record<string, string>>({});
  readonly sourceUrls = signal<Record<string, string>>({});

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

  updateSourceName(id: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.sourceNames.update((items) => ({ ...items, [id]: value }));
  }

  updateSourceUrl(id: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.sourceUrls.update((items) => ({ ...items, [id]: value }));
  }

  toggleSkill(helperId: string, skill: RecoveryTaskCategory): void {
    this.selectedSkills.update((all) => {
      const current = all[helperId] ?? [];
      return {
        ...all,
        [helperId]: current.includes(skill)
          ? current.filter((item) => item !== skill)
          : [...current, skill],
      };
    });
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
        this.selectedSkills.set(
          Object.fromEntries(queue.helpers.map((helper) => [helper.id, helper.skills])),
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

  reviewHelper(helper: RecoveryHelperReviewItem, level: HelperVerificationLevel): void {
    const method = this.methodFor(helper, level);
    this.recovery
      .reviewHelper(
        helper.id,
        {
          verificationLevel: level,
          verificationMethod: method,
          verifiedSkills:
            level === HelperVerificationLevel.IDENTITY || level === HelperVerificationLevel.REJECTED
              ? []
              : (this.selectedSkills()[helper.id] ?? []),
          verifiedBy: this.reviewer(),
          verificationSourceName: this.sourceNames()[helper.id]?.trim(),
          verificationSourceUrl: this.sourceUrls()[helper.id]?.trim(),
        },
        this.key(),
      )
      .subscribe({
        next: () => this.remove('helpers', helper.id),
        error: () => this.error.set(this.t('recovery.verify.evidenceError')),
      });
  }

  canVerifyTrade(helper: RecoveryHelperReviewItem): boolean {
    return (
      helper.credentialType !== HelperCredentialType.NONE &&
      Boolean(this.sourceNames()[helper.id]?.trim())
    );
  }

  canVerifyProfessional(helper: RecoveryHelperReviewItem): boolean {
    return (
      helper.credentialType === HelperCredentialType.PROFESSIONAL_LICENSE &&
      Boolean(
        helper.credentialNumber &&
        helper.credentialIssuer &&
        this.sourceNames()[helper.id]?.trim() &&
        this.sourceUrls()[helper.id]?.trim(),
      )
    );
  }

  private methodFor(
    helper: RecoveryHelperReviewItem,
    level: HelperVerificationLevel,
  ): HelperVerificationMethod | undefined {
    if (level === HelperVerificationLevel.IDENTITY)
      return HelperVerificationMethod.IDENTITY_AND_PHONE;
    if (level === HelperVerificationLevel.PROFESSIONAL)
      return HelperVerificationMethod.OFFICIAL_REGISTRY;
    if (level !== HelperVerificationLevel.TRADE) return undefined;
    if (helper.credentialType === HelperCredentialType.TRADE_CERTIFICATE) {
      return HelperVerificationMethod.TRAINING_CERTIFICATE;
    }
    if (helper.credentialType === HelperCredentialType.EMPLOYER_REFERENCE) {
      return HelperVerificationMethod.EMPLOYER_REFERENCE;
    }
    return HelperVerificationMethod.COMMUNITY_REFERENCE;
  }

  private remove(group: keyof RecoveryVerificationQueue, id: string): void {
    this.queue.update((queue) =>
      queue ? { ...queue, [group]: queue[group].filter((item) => item.id !== id) } : queue,
    );
  }
}
