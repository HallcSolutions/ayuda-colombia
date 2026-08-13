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
  MAX_MISSING_PHOTOS,
  MAX_PHOTO_SIZE_BYTES,
  MISSING_SUBJECT_KINDS,
  MissingSubjectKind,
} from '../../../core/constants/app.constants';
import { COLOMBIA_DEPARTMENTS } from '../../../core/constants/colombia.constants';
import { MISSING_KIND_ICONS, missingKindKey } from '../../../core/i18n/domain-keys';
import { TranslationKey } from '../../../core/i18n/es.translations';
import { I18nService, TranslationParams } from '../../../core/i18n/i18n.service';
import { SelectedPhoto } from '../../../core/models/selected-photo.model';
import { MissingService } from '../../../core/services/missing.service';

@Component({
  selector: 'app-missing-form',
  imports: [ReactiveFormsModule],
  templateUrl: './missing-form.html',
  styleUrl: './missing-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissingForm implements OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly missingService = inject(MissingService);
  private readonly i18n = inject(I18nService);

  protected readonly t = this.i18n.t;
  protected readonly kinds = MISSING_SUBJECT_KINDS;
  protected readonly kindKey = missingKindKey;
  protected readonly kindIcons = MISSING_KIND_ICONS;
  protected readonly departments = COLOMBIA_DEPARTMENTS;
  protected readonly maxPhotos = MAX_MISSING_PHOTOS;

  readonly closed = output<void>();

  readonly selectedPhotos = signal<SelectedPhoto[]>([]);
  readonly submitting = signal(false);
  /** PIN devuelto al publicar; se muestra una sola vez y no se guarda en ningún sitio. */
  readonly publishedPin = signal('');
  readonly pinCopied = signal(false);

  // Los mensajes se guardan como clave para que cambiar de idioma los repinte traducidos.
  private readonly errorKey = signal<TranslationKey | null>(null);
  private readonly errorParams = signal<TranslationParams | undefined>(undefined);
  private readonly successKey = signal<TranslationKey | null>(null);
  readonly errorMessage = computed(() => {
    const key = this.errorKey();
    return key ? this.t(key, this.errorParams()) : '';
  });
  readonly successMessage = computed(() => {
    const key = this.successKey();
    return key ? this.t(key) : '';
  });

  private readonly locationKey = signal<TranslationKey>('missingForm.locationPending');
  private readonly locationParams = signal<TranslationParams | undefined>(undefined);
  readonly locationMessage = computed(() => this.t(this.locationKey(), this.locationParams()));

  readonly form = this.formBuilder.group({
    kind: this.formBuilder.nonNullable.control(MissingSubjectKind.PERSON, Validators.required),
    name: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(80),
    ]),
    ageYears: this.formBuilder.control<number | null>(null, [
      Validators.min(0),
      Validators.max(120),
    ]),
    description: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(600),
    ]),
    department: this.formBuilder.nonNullable.control('', Validators.required),
    municipality: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(80),
    ]),
    lastSeenPlace: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(180),
    ]),
    lastSeenAt: this.formBuilder.nonNullable.control('', Validators.required),
    contactName: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(80),
    ]),
    contactPhone: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.pattern(/^[0-9+()\s-]{7,20}$/),
    ]),
    latitude: this.formBuilder.control<number | null>(null),
    longitude: this.formBuilder.control<number | null>(null),
    consentToPublish: this.formBuilder.nonNullable.control(false, Validators.requiredTrue),
  });

  ngOnDestroy(): void {
    this.selectedPhotos().forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  }

  selectKind(kind: MissingSubjectKind): void {
    this.form.controls.kind.setValue(kind);
  }

  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.clearMessage();
    for (const file of Array.from(input.files ?? [])) {
      if (this.selectedPhotos().length >= MAX_MISSING_PHOTOS) {
        this.setError('missingForm.tooManyPhotos');
        break;
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        this.setError('missingForm.invalidPhotoType');
        continue;
      }
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        this.setError('missingForm.photoTooLarge', { name: file.name });
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

  captureCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.setLocationMessage('reliefPointForm.locationUnavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.form.patchValue({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        this.setLocationMessage('reliefPointForm.locationReady', {
          meters: Math.round(position.coords.accuracy),
        });
      },
      (error) =>
        this.setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? 'reliefPointForm.locationDenied'
            : 'reliefPointForm.locationUnavailable',
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  async submit(): Promise<void> {
    this.clearMessage();
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.selectedPhotos().length) {
      this.setError('missingForm.invalid');
      return;
    }

    this.submitting.set(true);
    try {
      const published = await firstValueFrom(
        this.missingService.createRecord(this.buildPayload()),
      );
      this.resetForm();
      this.publishedPin.set(published.editPin);
      this.pinCopied.set(false);
      this.successKey.set('missingForm.success');
    } catch {
      this.setError('missingForm.error');
    } finally {
      this.submitting.set(false);
    }
  }

  private buildPayload(): FormData {
    const value = this.form.getRawValue();
    const payload = new FormData();
    payload.append('kind', value.kind);
    payload.append('name', value.name);
    payload.append('description', value.description);
    payload.append('department', value.department);
    payload.append('municipality', value.municipality);
    payload.append('lastSeenPlace', value.lastSeenPlace);
    // El input entrega hora local; se envía en ISO para que el servidor no la reinterprete.
    payload.append('lastSeenAt', new Date(value.lastSeenAt).toISOString());
    payload.append('contactName', value.contactName);
    payload.append('contactPhone', value.contactPhone);
    payload.append('consentToPublish', String(value.consentToPublish));
    if (value.ageYears !== null) payload.append('ageYears', String(value.ageYears));
    if (value.latitude !== null) payload.append('latitude', String(value.latitude));
    if (value.longitude !== null) payload.append('longitude', String(value.longitude));
    this.selectedPhotos().forEach(({ file }) => payload.append('photos', file));
    return payload;
  }

  private resetForm(): void {
    this.selectedPhotos().forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    this.selectedPhotos.set([]);
    this.setLocationMessage('missingForm.locationPending');
    this.form.reset({
      kind: MissingSubjectKind.PERSON,
      name: '',
      ageYears: null,
      description: '',
      department: '',
      municipality: '',
      lastSeenPlace: '',
      lastSeenAt: '',
      contactName: '',
      contactPhone: '',
      latitude: null,
      longitude: null,
      consentToPublish: false,
    });
  }

  private setError(key: TranslationKey, params?: TranslationParams): void {
    this.errorKey.set(key);
    this.errorParams.set(params);
  }

  async copyPin(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.publishedPin());
      this.pinCopied.set(true);
    } catch {
      // Sin permiso de portapapeles: el PIN sigue visible para copiarlo a mano.
      this.pinCopied.set(false);
    }
  }

  private clearMessage(): void {
    this.errorKey.set(null);
    this.errorParams.set(undefined);
    this.successKey.set(null);
  }

  private setLocationMessage(key: TranslationKey, params?: TranslationParams): void {
    this.locationKey.set(key);
    this.locationParams.set(params);
  }
}
