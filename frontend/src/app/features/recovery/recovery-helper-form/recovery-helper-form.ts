import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  RECOVERY_TASK_CATEGORIES,
  RecoveryTaskCategory,
} from '../../../core/constants/app.constants';
import { COLOMBIA_DEPARTMENTS } from '../../../core/constants/colombia.constants';
import { recoveryTaskCategoryKey } from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslationKey } from '../../../core/i18n/es.translations';
import { NewRecoveryHelper } from '../../../core/models/recovery.model';
import { RecoveryService } from '../../../core/services/recovery.service';
import { PHONE_PATTERN } from '../../../core/utils/phone.util';
import { AccessResult } from '../../../shared/access-result/access-result';
import { PhoneFieldDirective } from '../../../shared/phone-field/phone-field.directive';

@Component({
  selector: 'app-recovery-helper-form',
  imports: [ReactiveFormsModule, PhoneFieldDirective, AccessResult],
  templateUrl: './recovery-helper-form.html',
  styleUrl: './recovery-helper-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoveryHelperForm {
  private readonly fb = inject(FormBuilder);
  private readonly recovery = inject(RecoveryService);
  protected readonly t = inject(I18nService).t;
  protected readonly departments = COLOMBIA_DEPARTMENTS;
  protected readonly categories = RECOVERY_TASK_CATEGORIES;
  protected readonly categoryKey = recoveryTaskCategoryKey;

  readonly closed = output<void>();
  readonly submitting = signal(false);
  readonly selectedSkills = signal<RecoveryTaskCategory[]>([]);
  readonly helperId = signal('');
  readonly helperPin = signal('');
  /** Correo al que salió la copia del acceso; vacío si no se envió. */
  readonly accessEmail = signal('');
  readonly errorKey = signal<TranslationKey | null>(null);

  readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(80)]],
    contactPhone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    contactEmail: ['', [Validators.email, Validators.maxLength(160)]],
    department: ['', Validators.required],
    municipality: ['', [Validators.required, Validators.maxLength(80)]],
    consentToShareContact: [false, Validators.requiredTrue],
  });

  toggleSkill(category: RecoveryTaskCategory): void {
    this.selectedSkills.update((items) =>
      items.includes(category)
        ? items.filter((item) => item !== category)
        : items.length < 8
          ? [...items, category]
          : items,
    );
  }

  isIncomplete(): boolean {
    return this.form.invalid || !this.selectedSkills().length;
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    this.errorKey.set(null);
    if (this.isIncomplete()) {
      this.errorKey.set('recovery.helper.invalid');
      return;
    }
    this.submitting.set(true);
    try {
      const helper = await firstValueFrom(this.recovery.registerHelper(this.payload()));
      this.helperId.set(helper.id);
      this.helperPin.set(helper.editPin);
      this.accessEmail.set(
        helper.accessEmailSent ? this.form.controls.contactEmail.value.trim() : '',
      );
    } catch {
      this.errorKey.set('recovery.helper.error');
    } finally {
      this.submitting.set(false);
    }
  }

  private payload(): NewRecoveryHelper {
    const value = this.form.getRawValue();
    return {
      displayName: value.displayName.trim(),
      contactPhone: value.contactPhone.trim(),
      contactEmail: value.contactEmail.trim() || undefined,
      department: value.department,
      municipality: value.municipality.trim(),
      skills: this.selectedSkills(),
      consentToShareContact: value.consentToShareContact,
    };
  }
}
