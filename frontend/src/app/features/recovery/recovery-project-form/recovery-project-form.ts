import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_PHOTO_SIZE_BYTES,
  MAX_RECOVERY_PHOTOS,
  RECOVERY_DONATION_CATEGORIES,
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
import { I18nService, TranslationParams } from '../../../core/i18n/i18n.service';
import { TranslationKey } from '../../../core/i18n/es.translations';
import { NewRecoveryTask } from '../../../core/models/recovery.model';
import { SelectedPhoto } from '../../../core/models/selected-photo.model';
import { RecoveryService } from '../../../core/services/recovery.service';
import { EMAIL_MAX_LENGTH, EMAIL_PATTERN } from '../../../core/utils/email.util';
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
export class RecoveryProjectForm implements OnDestroy {
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
  protected readonly maxPhotos = MAX_RECOVERY_PHOTOS;

  readonly closed = output<void>();
  readonly submitting = signal(false);
  readonly publishedPin = signal('');
  /** Correo al que salió la copia del acceso; vacío si no se envió. */
  readonly accessEmail = signal('');
  readonly publishedId = signal('');
  readonly selectedPhotos = signal<SelectedPhoto[]>([]);
  readonly selectedSalesModes = signal<RecoverySalesMode[]>([]);
  private readonly errorKey = signal<TranslationKey | null>(null);
  private readonly errorParams = signal<TranslationParams | undefined>(undefined);
  readonly errorMessage = computed(() => {
    const key = this.errorKey();
    return key ? this.t(key, this.errorParams()) : '';
  });

  commerce(): boolean {
    return [
      RecoveryProjectKind.BUSINESS,
      RecoveryProjectKind.RESTAURANT,
      RecoveryProjectKind.ARTISAN,
    ].includes(this.form.controls.kind.value);
  }

  /** Una vivienda y una persona solo publican zona: su dirección exacta no sale nunca. */
  publicPlace(): boolean {
    return ![RecoveryProjectKind.HOME, RecoveryProjectKind.PERSON].includes(
      this.form.controls.kind.value,
    );
  }

  person(): boolean {
    return this.form.controls.kind.value === RecoveryProjectKind.PERSON;
  }

  /** Lo que hace falta es una cosa que alguien puede donar, no una jornada de trabajo. */
  donation(): boolean {
    return RECOVERY_DONATION_CATEGORIES.includes(this.form.controls.taskCategory.value);
  }

  readonly form = this.fb.nonNullable.group({
    kind: [RecoveryProjectKind.HOME, Validators.required],
    name: ['', [Validators.required, Validators.maxLength(140)]],
    story: ['', [Validators.required, Validators.maxLength(1200)]],
    organizerName: ['', [Validators.required, Validators.maxLength(100)]],
    contactPhone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    contactEmail: [
      '',
      [Validators.pattern(EMAIL_PATTERN), Validators.maxLength(EMAIL_MAX_LENGTH)],
    ],
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

  ngOnDestroy(): void {
    this.releasePreviews();
  }

  /** Cambiar de tipo reencuadra la necesidad: una persona pide que le donen algo. */
  selectKind(kind: RecoveryProjectKind): void {
    const person = kind === RecoveryProjectKind.PERSON;
    this.form.patchValue({
      kind,
      taskCategory: person ? RecoveryTaskCategory.ASSISTIVE_DEVICE : RecoveryTaskCategory.CLEANING,
      peopleNeeded: person ? 1 : 4,
    });
  }

  toggleSalesMode(mode: RecoverySalesMode): void {
    this.selectedSalesModes.update((items) =>
      items.includes(mode) ? items.filter((item) => item !== mode) : [...items, mode],
    );
  }

  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.errorKey.set(null);
    for (const file of Array.from(input.files ?? [])) {
      if (this.selectedPhotos().length >= MAX_RECOVERY_PHOTOS) {
        this.setError('recovery.form.tooManyPhotos', { max: MAX_RECOVERY_PHOTOS });
        break;
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        this.setError('recovery.form.invalidPhotoType');
        continue;
      }
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        this.setError('recovery.form.photoTooLarge', { name: file.name });
        continue;
      }
      this.selectedPhotos.update((photos) => [
        ...photos,
        { file, previewUrl: URL.createObjectURL(file) },
      ]);
    }
    input.value = '';
  }

  removePhoto(index: number): void {
    const photo = this.selectedPhotos()[index];
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    this.selectedPhotos.update((photos) => photos.filter((_, position) => position !== index));
  }

  isIncomplete(): boolean {
    const value = this.form.getRawValue();
    return (
      this.form.invalid ||
      (value.needsTask && (!value.taskTitle.trim() || !value.taskDescription.trim()))
    );
  }

  /** El correo es opcional, pero si se escribe mal hay que decirlo junto al campo. */
  emailRejected(): boolean {
    const control = this.form.controls.contactEmail;
    return control.touched && control.invalid;
  }

  async submit(): Promise<void> {
    this.errorKey.set(null);
    this.form.markAllAsTouched();
    if (this.isIncomplete()) {
      this.setError('recovery.form.invalid');
      return;
    }
    this.submitting.set(true);
    try {
      const project = await firstValueFrom(this.recovery.createProject(this.projectPayload()));
      this.publishedId.set(project.id);
      this.publishedPin.set(project.editPin);
      this.accessEmail.set(
        project.accessEmailSent ? this.form.controls.contactEmail.value.trim() : '',
      );
      this.releasePreviews();
      this.selectedPhotos.set([]);
      if (this.form.controls.needsTask.value) {
        await firstValueFrom(
          this.recovery.createTask(project.id, this.taskPayload(), project.editPin),
        );
      }
      this.errorKey.set(null);
    } catch {
      this.setError(this.publishedPin() ? 'recovery.form.taskError' : 'recovery.form.error');
    } finally {
      this.submitting.set(false);
    }
  }

  /** Va como multipart: es el único envío del formulario que puede llevar fotos. */
  private projectPayload(): FormData {
    const value = this.form.getRawValue();
    const commerce = this.commerce();
    const fields: Record<string, string> = {
      kind: value.kind,
      name: value.name.trim(),
      story: value.story.trim(),
      organizerName: value.organizerName.trim(),
      contactPhone: value.contactPhone.trim(),
      contactEmail: value.contactEmail.trim(),
      department: value.department,
      municipality: value.municipality.trim(),
      areaReference: value.areaReference.trim(),
      productsOrServices: commerce ? value.productsOrServices.trim() : '',
      priceReference: commerce ? value.priceReference.trim() : '',
      salesModes: JSON.stringify(commerce ? this.selectedSalesModes() : []),
      schedule: commerce ? value.schedule.trim() : '',
      shareContactPublicly: String(value.shareContactPublicly),
      consentToVerification: String(value.consentToVerification),
    };
    const payload = new FormData();
    Object.entries(fields).forEach(([field, content]) => payload.append(field, content));
    this.selectedPhotos().forEach(({ file }) => payload.append('photos', file));
    return payload;
  }

  private taskPayload(): NewRecoveryTask {
    const value = this.form.getRawValue();
    return {
      title: value.taskTitle.trim(),
      description: value.taskDescription.trim(),
      category: value.taskCategory,
      peopleNeeded: value.peopleNeeded,
      skillsRequired: this.donation() ? '' : value.skillsRequired.trim(),
      materialsNeeded: value.materialsNeeded.trim(),
    };
  }

  private setError(key: TranslationKey, params?: TranslationParams): void {
    this.errorKey.set(key);
    this.errorParams.set(params);
  }

  private releasePreviews(): void {
    this.selectedPhotos().forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  }
}
