import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  RECOVERY_PROJECT_KINDS,
  RECOVERY_SALES_MODES,
  RECOVERY_TASK_CATEGORIES,
  RecoveryProjectKind,
  RecoverySalesMode,
  RecoveryTaskCategory,
} from '../../../core/constants/app.constants';
import { COLOMBIA_DEPARTMENTS } from '../../../core/constants/colombia.constants';
import {
  RECOVERY_PROJECT_KIND_ICONS,
  recoveryProjectKindKey,
  recoverySalesModeKey,
  recoveryTaskCategoryKey,
} from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslationKey } from '../../../core/i18n/es.translations';
import { NewRecoveryProject, NewRecoveryTask } from '../../../core/models/recovery.model';
import { RecoveryService } from '../../../core/services/recovery.service';
import { PHONE_PATTERN } from '../../../core/utils/phone.util';
import { AccessResult } from '../../../shared/access-result/access-result';
import { PhoneFieldDirective } from '../../../shared/phone-field/phone-field.directive';

@Component({
  selector: 'app-recovery-project-form',
  imports: [ReactiveFormsModule, PhoneFieldDirective, AccessResult],
  templateUrl: './recovery-project-form.html',
  styleUrl: './recovery-project-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoveryProjectForm {
  private readonly fb = inject(FormBuilder);
  private readonly recovery = inject(RecoveryService);
  protected readonly t = inject(I18nService).t;
  protected readonly kinds = RECOVERY_PROJECT_KINDS;
  protected readonly salesModes = RECOVERY_SALES_MODES;
  protected readonly taskCategories = RECOVERY_TASK_CATEGORIES;
  protected readonly departments = COLOMBIA_DEPARTMENTS;
  protected readonly kindKey = recoveryProjectKindKey;
  protected readonly kindIcons = RECOVERY_PROJECT_KIND_ICONS;
  protected readonly salesModeKey = recoverySalesModeKey;
  protected readonly taskCategoryKey = recoveryTaskCategoryKey;

  readonly closed = output<void>();
  readonly submitting = signal(false);
  readonly publishedPin = signal('');
  readonly publishedId = signal('');
  readonly errorKey = signal<TranslationKey | null>(null);
  readonly selectedSalesModes = signal<RecoverySalesMode[]>([]);
  commerce(): boolean {
    return [
      RecoveryProjectKind.BUSINESS,
      RecoveryProjectKind.RESTAURANT,
      RecoveryProjectKind.ARTISAN,
    ].includes(this.form.controls.kind.value);
  }

  publicPlace(): boolean {
    return this.form.controls.kind.value !== RecoveryProjectKind.HOME;
  }

  readonly form = this.fb.nonNullable.group({
    kind: [RecoveryProjectKind.HOME, Validators.required],
    name: ['', [Validators.required, Validators.maxLength(140)]],
    story: ['', [Validators.required, Validators.maxLength(1200)]],
    organizerName: ['', [Validators.required, Validators.maxLength(100)]],
    contactPhone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    department: ['', Validators.required],
    municipality: ['', [Validators.required, Validators.maxLength(80)]],
    areaReference: ['', [Validators.required, Validators.maxLength(180)]],
    productsOrServices: ['', Validators.maxLength(700)],
    priceReference: ['', Validators.maxLength(180)],
    schedule: ['', Validators.maxLength(180)],
    shareContactPublicly: [false],
    needsTask: [true],
    taskTitle: ['', Validators.maxLength(160)],
    taskDescription: ['', Validators.maxLength(900)],
    taskCategory: [RecoveryTaskCategory.CLEANING, Validators.required],
    peopleNeeded: [4, [Validators.required, Validators.min(1), Validators.max(100)]],
    skillsRequired: ['', Validators.maxLength(400)],
    materialsNeeded: ['', Validators.maxLength(500)],
    consentToVerification: [false, Validators.requiredTrue],
  });

  toggleSalesMode(mode: RecoverySalesMode): void {
    this.selectedSalesModes.update((items) =>
      items.includes(mode) ? items.filter((item) => item !== mode) : [...items, mode],
    );
  }

  isIncomplete(): boolean {
    const value = this.form.getRawValue();
    return (
      this.form.invalid ||
      (value.needsTask && (!value.taskTitle.trim() || !value.taskDescription.trim()))
    );
  }

  async submit(): Promise<void> {
    this.errorKey.set(null);
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (
      this.form.invalid ||
      (value.needsTask && (!value.taskTitle.trim() || !value.taskDescription.trim()))
    ) {
      this.errorKey.set('recovery.form.invalid');
      return;
    }
    this.submitting.set(true);
    try {
      const project = await firstValueFrom(this.recovery.createProject(this.projectPayload()));
      this.publishedId.set(project.id);
      this.publishedPin.set(project.editPin);
      if (value.needsTask) {
        await firstValueFrom(
          this.recovery.createTask(project.id, this.taskPayload(), project.editPin),
        );
      }
      this.errorKey.set(null);
    } catch {
      this.errorKey.set(this.publishedPin() ? 'recovery.form.taskError' : 'recovery.form.error');
    } finally {
      this.submitting.set(false);
    }
  }

  private projectPayload(): NewRecoveryProject {
    const value = this.form.getRawValue();
    return {
      kind: value.kind,
      name: value.name.trim(),
      story: value.story.trim(),
      organizerName: value.organizerName.trim(),
      contactPhone: value.contactPhone.trim(),
      department: value.department,
      municipality: value.municipality.trim(),
      areaReference: value.areaReference.trim(),
      productsOrServices: this.commerce() ? value.productsOrServices.trim() : '',
      priceReference: this.commerce() ? value.priceReference.trim() : '',
      salesModes: this.commerce() ? this.selectedSalesModes() : [],
      schedule: this.commerce() ? value.schedule.trim() : '',
      shareContactPublicly: this.commerce() && value.shareContactPublicly,
      consentToVerification: value.consentToVerification,
    };
  }

  private taskPayload(): NewRecoveryTask {
    const value = this.form.getRawValue();
    return {
      title: value.taskTitle.trim(),
      description: value.taskDescription.trim(),
      category: value.taskCategory,
      peopleNeeded: value.peopleNeeded,
      skillsRequired: value.skillsRequired.trim(),
      materialsNeeded: value.materialsNeeded.trim(),
    };
  }
}
