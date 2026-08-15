import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { recoveryRiskKey, recoveryTaskCategoryKey } from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslationKey } from '../../../core/i18n/es.translations';
import { RecoveryTask } from '../../../core/models/recovery.model';
import { RecoveryService } from '../../../core/services/recovery.service';

@Component({
  selector: 'app-recovery-apply-form',
  imports: [ReactiveFormsModule],
  templateUrl: './recovery-apply-form.html',
  styleUrl: './recovery-apply-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoveryApplyForm {
  private readonly fb = inject(FormBuilder);
  readonly recovery = inject(RecoveryService);
  protected readonly t = inject(I18nService).t;
  protected readonly categoryKey = recoveryTaskCategoryKey;
  protected readonly riskKey = recoveryRiskKey;

  readonly task = input.required<RecoveryTask>();
  readonly closed = output<void>();
  readonly submitting = signal(false);
  readonly success = signal(false);
  readonly errorKey = signal<TranslationKey | null>(null);

  readonly form = this.fb.nonNullable.group({
    helperId: [this.recovery.helperId(), [Validators.required]],
    helperPin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    availability: ['', [Validators.required, Validators.maxLength(180)]],
    message: ['', Validators.maxLength(500)],
  });

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    this.errorKey.set(null);
    if (this.form.invalid) {
      this.errorKey.set('recovery.apply.invalid');
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.recovery.applyToTask(
          this.task().id,
          value.helperId.trim(),
          value.helperPin,
          value.message.trim(),
          value.availability.trim(),
        ),
      );
      this.success.set(true);
    } catch {
      this.errorKey.set('recovery.apply.error');
    } finally {
      this.submitting.set(false);
    }
  }
}
