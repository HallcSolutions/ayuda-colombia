import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { LODGING_KINDS, LodgingKind } from '../../../core/constants/app.constants';
import { COLOMBIA_DEPARTMENTS } from '../../../core/constants/colombia.constants';
import { LODGING_KIND_ICONS, lodgingKindKey } from '../../../core/i18n/domain-keys';
import { TranslationKey } from '../../../core/i18n/es.translations';
import { I18nService, TranslationParams } from '../../../core/i18n/i18n.service';
import { NewLodgingOffer } from '../../../core/models/lodging-offer.model';
import { GeocodingService } from '../../../core/services/geocoding.service';
import { LodgingService } from '../../../core/services/lodging.service';

import { PHONE_PATTERN } from '../../../core/utils/phone.util';
import { PhoneFieldDirective } from '../../../shared/phone-field/phone-field.directive';

@Component({
  selector: 'app-lodging-form',
  imports: [ReactiveFormsModule, PhoneFieldDirective],
  templateUrl: './lodging-form.html',
  styleUrl: './lodging-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LodgingForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly lodgingService = inject(LodgingService);
  private readonly geocodingService = inject(GeocodingService);
  private readonly i18n = inject(I18nService);

  protected readonly t = this.i18n.t;
  protected readonly kinds = LODGING_KINDS;
  protected readonly kindKey = lodgingKindKey;
  protected readonly kindIcons = LODGING_KIND_ICONS;
  protected readonly departments = COLOMBIA_DEPARTMENTS;

  readonly closed = output<void>();

  readonly submitting = signal(false);
  readonly resolvingAddress = signal(false);
  /** PIN devuelto al publicar; se muestra una sola vez y no se guarda en ningún sitio. */
  readonly publishedPin = signal('');
  readonly pinCopied = signal(false);

  // Los mensajes se guardan como clave para que cambiar de idioma los repinte traducidos.
  private readonly errorKey = signal<TranslationKey | null>(null);
  private readonly successKey = signal<TranslationKey | null>(null);
  readonly errorMessage = computed(() => {
    const key = this.errorKey();
    return key ? this.t(key) : '';
  });
  readonly successMessage = computed(() => {
    const key = this.successKey();
    return key ? this.t(key) : '';
  });

  private readonly locationKey = signal<TranslationKey>('lodgingForm.locationPending');
  private readonly locationParams = signal<TranslationParams | undefined>(undefined);
  readonly locationMessage = computed(() => this.t(this.locationKey(), this.locationParams()));

  readonly form = this.formBuilder.group({
    placeName: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(120),
    ]),
    kind: this.formBuilder.nonNullable.control(LodgingKind.HOME, Validators.required),
    hostName: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(80),
    ]),
    contactPhone: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.pattern(PHONE_PATTERN),
    ]),
    department: this.formBuilder.nonNullable.control('', Validators.required),
    municipality: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(80),
    ]),
    addressReference: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(180),
    ]),
    totalSpaces: this.formBuilder.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(2000),
    ]),
    maxNights: this.formBuilder.control<number | null>(null, [
      Validators.min(1),
      Validators.max(365),
    ]),
    freeOfCharge: this.formBuilder.nonNullable.control(true),
    acceptsPets: this.formBuilder.nonNullable.control(false),
    notes: this.formBuilder.nonNullable.control('', Validators.maxLength(400)),
    latitude: this.formBuilder.control<number | null>(null),
    longitude: this.formBuilder.control<number | null>(null),
  });

  selectKind(kind: LodgingKind): void {
    this.form.controls.kind.setValue(kind);
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
        void this.fillAddressFromPosition(position);
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

  private async fillAddressFromPosition(position: GeolocationPosition): Promise<void> {
    this.resolvingAddress.set(true);
    this.setLocationMessage('reliefPointForm.locationResolvingAddress', {
      meters: Math.round(position.coords.accuracy),
    });

    try {
      const suggestion = await firstValueFrom(
        this.geocodingService.reverseLocation(position.coords.latitude, position.coords.longitude),
      );
      if (!suggestion) {
        this.setLocationMessage('reliefPointForm.locationAddressNotFound');
        return;
      }

      const department = this.canonicalDepartment(suggestion.department);
      this.form.patchValue({
        department: department || this.form.controls.department.value,
        municipality: suggestion.municipality || this.form.controls.municipality.value,
        addressReference: suggestion.address || suggestion.label,
      });
      this.setLocationMessage('reliefPointForm.locationReadyAndAddress', {
        meters: Math.round(position.coords.accuracy),
      });
    } catch {
      this.setLocationMessage('reliefPointForm.locationAddressUnavailable');
    } finally {
      this.resolvingAddress.set(false);
    }
  }

  private canonicalDepartment(value: string): string {
    const normalized = this.normalizeText(value);
    const exact = this.departments.find(
      (department) => this.normalizeText(department) === normalized,
    );
    if (exact) return exact;
    if (normalized.includes('bogota') && normalized.includes('distrito')) return 'Bogotá D.C.';
    if (normalized.includes('sanandres') && normalized.includes('providencia')) {
      return 'San Andrés y Providencia';
    }
    return (
      [...this.departments]
        .sort((left, right) => this.normalizeText(right).length - this.normalizeText(left).length)
        .find((department) => normalized.includes(this.normalizeText(department))) ?? ''
    );
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  async submit(): Promise<void> {
    this.clearMessage();
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorKey.set('lodgingForm.invalid');
      return;
    }

    this.submitting.set(true);
    try {
      const published = await firstValueFrom(this.lodgingService.createOffer(this.buildPayload()));
      this.resetForm();
      this.publishedPin.set(published.editPin);
      this.pinCopied.set(false);
      this.successKey.set('lodgingForm.success');
    } catch {
      this.errorKey.set('lodgingForm.error');
    } finally {
      this.submitting.set(false);
    }
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

  private buildPayload(): NewLodgingOffer {
    const value = this.form.getRawValue();
    return {
      placeName: value.placeName,
      kind: value.kind,
      hostName: value.hostName,
      contactPhone: value.contactPhone,
      department: value.department,
      municipality: value.municipality,
      addressReference: value.addressReference,
      totalSpaces: value.totalSpaces ?? 0,
      freeOfCharge: value.freeOfCharge,
      acceptsPets: value.acceptsPets,
      ...(value.maxNights === null ? {} : { maxNights: value.maxNights }),
      ...(value.notes ? { notes: value.notes } : {}),
      ...(value.latitude === null || value.longitude === null
        ? {}
        : { latitude: value.latitude, longitude: value.longitude }),
    };
  }

  private resetForm(): void {
    this.resolvingAddress.set(false);
    this.setLocationMessage('lodgingForm.locationPending');
    this.form.reset({
      placeName: '',
      kind: LodgingKind.HOME,
      hostName: '',
      contactPhone: '',
      department: '',
      municipality: '',
      addressReference: '',
      totalSpaces: null,
      maxNights: null,
      freeOfCharge: true,
      acceptsPets: false,
      notes: '',
      latitude: null,
      longitude: null,
    });
  }

  private clearMessage(): void {
    this.errorKey.set(null);
    this.successKey.set(null);
  }

  private setLocationMessage(key: TranslationKey, params?: TranslationParams): void {
    this.locationKey.set(key);
    this.locationParams.set(params);
  }
}
