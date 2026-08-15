import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  HELPER_CREDENTIAL_TYPES,
  RECOVERY_TASK_CATEGORIES,
  HelperCredentialType,
  RecoveryTaskCategory,
} from '../../../core/constants/app.constants';
import { COLOMBIA_DEPARTMENTS } from '../../../core/constants/colombia.constants';
import { helperCredentialKey, recoveryTaskCategoryKey } from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslationKey } from '../../../core/i18n/es.translations';
import { NewRecoveryHelper } from '../../../core/models/recovery.model';
import { RecoveryService } from '../../../core/services/recovery.service';
import { PHONE_PATTERN } from '../../../core/utils/phone.util';
import { PhoneFieldDirective } from '../../../shared/phone-field/phone-field.directive';

@Component({
  selector: 'app-recovery-helper-form',
  imports: [ReactiveFormsModule, PhoneFieldDirective],
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
  protected readonly credentials = HELPER_CREDENTIAL_TYPES;
  protected readonly categoryKey = recoveryTaskCategoryKey;
  protected readonly credentialKey = helperCredentialKey;

  readonly closed = output<void>();
  readonly submitting = signal(false);
  readonly selectedSkills = signal<RecoveryTaskCategory[]>([]);
  readonly helperId = signal('');
  readonly helperPin = signal('');
  readonly errorKey = signal<TranslationKey | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    displayName: ['', [Validators.required, Validators.maxLength(80)]],
    documentType: ['CC', [Validators.required, Validators.maxLength(20)]],
    documentNumber: ['', [Validators.required, Validators.maxLength(40)]],
    contactPhone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    department: ['', Validators.required],
    municipality: ['', [Validators.required, Validators.maxLength(80)]],
    bio: ['', Validators.maxLength(600)],
    yearsExperience: [0, [Validators.required, Validators.min(0), Validators.max(80)]],
    credentialType: [HelperCredentialType.NONE, Validators.required],
    credentialNumber: ['', Validators.maxLength(80)],
    credentialIssuer: ['', Validators.maxLength(160)],
    referenceName: ['', Validators.maxLength(100)],
    referencePhone: ['', Validators.maxLength(30)],
    consentToVerification: [false, Validators.requiredTrue],
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
    const value = this.form.getRawValue();
    const missingProfessionalEvidence =
      value.credentialType === HelperCredentialType.PROFESSIONAL_LICENSE &&
      (!value.credentialNumber.trim() || !value.credentialIssuer.trim());
    return this.form.invalid || !this.selectedSkills().length || missingProfessionalEvidence;
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
    } catch {
      this.errorKey.set('recovery.helper.error');
    } finally {
      this.submitting.set(false);
    }
  }

  async copyAccess(): Promise<void> {
    try {
      await navigator.clipboard.writeText(
        `${this.t('recovery.helper.helperCode')}: ${this.helperId()}\nPIN: ${this.helperPin()}`,
      );
    } catch {
      // Los valores continúan visibles.
    }
  }

  private payload(): NewRecoveryHelper {
    const value = this.form.getRawValue();
    return {
      fullName: value.fullName.trim(),
      displayName: value.displayName.trim(),
      documentType: value.documentType.trim(),
      documentNumber: value.documentNumber.trim(),
      contactPhone: value.contactPhone.trim(),
      department: value.department,
      municipality: value.municipality.trim(),
      skills: this.selectedSkills(),
      bio: value.bio.trim(),
      yearsExperience: value.yearsExperience,
      credentialType: value.credentialType,
      credentialNumber: value.credentialNumber.trim(),
      credentialIssuer: value.credentialIssuer.trim(),
      referenceName: value.referenceName.trim(),
      referencePhone: value.referencePhone.trim(),
      consentToVerification: value.consentToVerification,
    };
  }
}
