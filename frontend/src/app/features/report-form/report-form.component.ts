import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  ALLOWED_IMAGE_TYPES,
  HELP_CONTACT_CHANNELS,
  HELP_CONTACT_ROLES,
  HelpContactChannel,
  HelpContactRole,
  MAX_PHOTO_SIZE_BYTES,
  MAX_REPORT_PHOTOS,
  UrgencyLevel,
} from '../../core/constants/app.constants';
import { COLOMBIA_DEPARTMENTS } from '../../core/constants/colombia.constants';
import {
  FAMILY_NEED_OPTIONS,
  helpContactChannelKey,
  helpContactRoleKey,
} from '../../core/i18n/domain-keys';
import { TranslationKey } from '../../core/i18n/es.translations';
import { I18nService, TranslationParams } from '../../core/i18n/i18n.service';
import { SelectedPhoto } from '../../core/models/selected-photo.model';
import { ReportsService } from '../../core/services/reports.service';
import { PHONE_PATTERN } from '../../core/utils/phone.util';
import { ColombiaWatermark } from '../../shared/colombia-watermark/colombia-watermark';
import { PhoneFieldDirective } from '../../shared/phone-field/phone-field.directive';

@Component({
  selector: 'app-report-form',
  imports: [ReactiveFormsModule, PhoneFieldDirective, ColombiaWatermark],
  templateUrl: './report-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportFormComponent implements OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly reportsService = inject(ReportsService);
  private readonly i18n = inject(I18nService);

  readonly t = this.i18n.t;
  readonly departments = COLOMBIA_DEPARTMENTS;
  readonly needOptions = FAMILY_NEED_OPTIONS;
  readonly contactRoles = HELP_CONTACT_ROLES;
  readonly contactChannels = HELP_CONTACT_CHANNELS;
  readonly contactRoleKey = helpContactRoleKey;
  readonly contactChannelKey = helpContactChannelKey;
  readonly selectedNeeds = signal<string[]>([]);
  readonly selectedPhotos = signal<SelectedPhoto[]>([]);
  readonly submitting = signal(false);
  readonly submitAttempted = signal(false);
  readonly capturingLocation = signal(false);

  private readonly successMessageKey = signal<TranslationKey | null>(null);
  private readonly errorMessageKey = signal<TranslationKey | null>(null);
  private readonly errorMessageParams = signal<TranslationParams | undefined>(undefined);
  private readonly locationMessageKey = signal<TranslationKey>('reportForm.locationIdle');
  private readonly locationMessageParams = signal<TranslationParams | undefined>(undefined);

  readonly successMessage = computed(() => {
    const key = this.successMessageKey();
    return key ? this.t(key) : '';
  });
  readonly errorMessage = computed(() => {
    const key = this.errorMessageKey();
    return key ? this.t(key, this.errorMessageParams()) : '';
  });
  readonly locationMessage = computed(() =>
    this.t(this.locationMessageKey(), this.locationMessageParams()),
  );
  readonly hasLocation = signal(false);

  readonly reportForm = this.formBuilder.group({
    department: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(80),
    ]),
    municipality: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(80),
    ]),
    addressReference: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(180),
    ]),
    householdSize: this.formBuilder.nonNullable.control(1, [
      Validators.required,
      Validators.min(1),
      Validators.max(50),
    ]),
    urgency: this.formBuilder.nonNullable.control(UrgencyLevel.HIGH, Validators.required),
    notice: this.formBuilder.nonNullable.control('', [Validators.maxLength(800)]),
    reporterName: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(80),
    ]),
    contactPhone: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.pattern(PHONE_PATTERN),
    ]),
    contactRole: this.formBuilder.nonNullable.control(HelpContactRole.AFFECTED_PERSON, [
      Validators.required,
    ]),
    contactChannel: this.formBuilder.nonNullable.control(HelpContactChannel.BOTH, [
      Validators.required,
    ]),
    consentToDirectContact: this.formBuilder.nonNullable.control(false),
    latitude: this.formBuilder.control<number | null>(null),
    longitude: this.formBuilder.control<number | null>(null),
    accuracy: this.formBuilder.control<number | null>(null),
    consentToShareLocation: this.formBuilder.nonNullable.control({
      value: false,
      disabled: true,
    }),
  });

  ngOnDestroy(): void {
    this.selectedPhotos().forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  }

  scrollToForm(): void {
    document
      .getElementById('registro-rapido')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggleNeed(need: string): void {
    this.selectedNeeds.update((current) =>
      current.includes(need) ? current.filter((item) => item !== need) : [...current, need],
    );
  }

  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.clearError();
    for (const file of Array.from(input.files ?? [])) {
      if (this.selectedPhotos().length >= MAX_REPORT_PHOTOS) {
        this.setError('reportForm.tooManyPhotos');
        break;
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        this.setError('reportForm.invalidPhotoType');
        continue;
      }
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        this.setError('reportForm.photoTooLarge', { name: file.name });
        continue;
      }
      this.selectedPhotos.update((current) => [
        ...current,
        { file, previewUrl: URL.createObjectURL(file) },
      ]);
    }
    input.value = '';
  }

  removePhoto(index: number): void {
    const photo = this.selectedPhotos()[index];
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    this.selectedPhotos.update((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  captureCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.setLocationMessage('reportForm.locationUnsupported');
      return;
    }
    this.capturingLocation.set(true);
    this.setLocationMessage('reportForm.locationLoading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.reportForm.patchValue({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        this.reportForm.controls.consentToShareLocation.enable({ emitEvent: false });
        this.hasLocation.set(true);
        this.setLocationMessage('reportForm.locationCaptured', {
          meters: Math.round(position.coords.accuracy),
        });
        this.capturingLocation.set(false);
      },
      (error) => {
        this.setLocationMessage(this.geolocationErrorKey(error));
        this.capturingLocation.set(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  clearLocation(): void {
    this.reportForm.patchValue({
      latitude: null,
      longitude: null,
      accuracy: null,
      consentToShareLocation: false,
    });
    this.reportForm.controls.consentToShareLocation.disable({ emitEvent: false });
    this.hasLocation.set(false);
    this.setLocationMessage('reportForm.locationIdle');
  }

  async submitReport(): Promise<void> {
    this.submitAttempted.set(true);
    this.successMessageKey.set(null);
    this.clearError();
    this.reportForm.markAllAsTouched();
    if (this.reportForm.invalid || !this.selectedNeeds().length) {
      this.setError('reportForm.invalid');
      return;
    }

    this.submitting.set(true);
    try {
      await firstValueFrom(this.reportsService.createReport(this.buildPayload()));
      this.successMessageKey.set('reportForm.success');
      this.resetForm();
    } catch {
      this.setError('reportForm.error');
    } finally {
      this.submitting.set(false);
    }
  }

  private buildPayload(): FormData {
    const value = this.reportForm.getRawValue();
    const payload = new FormData();
    payload.append('reporterName', value.reporterName.trim());
    payload.append('contactPhone', value.contactPhone.trim());
    payload.append('contactRole', value.contactRole);
    payload.append('contactChannel', value.contactChannel);
    payload.append('consentToDirectContact', String(value.consentToDirectContact));
    payload.append('department', value.department);
    payload.append('municipality', value.municipality.trim());
    payload.append('addressReference', value.addressReference.trim());
    payload.append('householdSize', String(value.householdSize));
    payload.append('urgency', value.urgency);
    payload.append('needs', JSON.stringify(this.selectedNeeds()));
    if (value.notice.trim()) payload.append('notice', value.notice.trim());

    const sharesLocation = Boolean(
      value.consentToShareLocation && value.latitude !== null && value.longitude !== null,
    );
    if (sharesLocation) {
      payload.append('latitude', String(value.latitude));
      payload.append('longitude', String(value.longitude));
      if (value.accuracy !== null) payload.append('accuracy', String(value.accuracy));
    }
    payload.append('consentToShareLocation', String(sharesLocation));
    this.selectedPhotos().forEach(({ file }) => payload.append('photos', file));
    return payload;
  }

  private resetForm(): void {
    this.selectedPhotos().forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    this.selectedPhotos.set([]);
    this.selectedNeeds.set([]);
    this.submitAttempted.set(false);
    this.hasLocation.set(false);
    this.setLocationMessage('reportForm.locationIdle');
    this.reportForm.reset({
      department: '',
      municipality: '',
      addressReference: '',
      householdSize: 1,
      urgency: UrgencyLevel.HIGH,
      notice: '',
      reporterName: '',
      contactPhone: '',
      contactRole: HelpContactRole.AFFECTED_PERSON,
      contactChannel: HelpContactChannel.BOTH,
      consentToDirectContact: false,
      latitude: null,
      longitude: null,
      accuracy: null,
      consentToShareLocation: false,
    });
    this.reportForm.controls.consentToShareLocation.disable({ emitEvent: false });
  }

  private geolocationErrorKey(error: GeolocationPositionError): TranslationKey {
    if (error.code === error.PERMISSION_DENIED) return 'reportForm.locationDenied';
    if (error.code === error.POSITION_UNAVAILABLE) return 'reportForm.locationUnavailable';
    return 'reportForm.locationTimeout';
  }

  private setLocationMessage(key: TranslationKey, params?: TranslationParams): void {
    this.locationMessageKey.set(key);
    this.locationMessageParams.set(params);
  }

  private setError(key: TranslationKey, params?: TranslationParams): void {
    this.errorMessageKey.set(key);
    this.errorMessageParams.set(params);
  }

  private clearError(): void {
    this.errorMessageKey.set(null);
    this.errorMessageParams.set(undefined);
  }
}
