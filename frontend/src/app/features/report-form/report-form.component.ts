import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  firstValueFrom,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_PHOTO_SIZE_BYTES,
  MAX_REPORT_PHOTOS,
  UrgencyLevel,
} from '../../core/constants/app.constants';
import { COLOMBIA_DEPARTMENTS } from '../../core/constants/colombia.constants';
import { HOUSE_DAMAGE_OPTIONS } from '../../core/i18n/domain-keys';
import { TranslationKey } from '../../core/i18n/es.translations';
import { I18nService, TranslationParams } from '../../core/i18n/i18n.service';
import { AddressSuggestion } from '../../core/models/address-suggestion.model';
import { Coordinates } from '../../core/models/coordinates.model';
import { SelectedPhoto } from '../../core/models/selected-photo.model';
import { GeocodingService } from '../../core/services/geocoding.service';
import { ReportsService } from '../../core/services/reports.service';
import { streetMapUrl } from '../../core/utils/geo.util';

@Component({
  selector: 'app-report-form',
  imports: [ReactiveFormsModule],
  templateUrl: './report-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportFormComponent implements OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly reportsService = inject(ReportsService);
  private readonly geocodingService = inject(GeocodingService);
  private readonly i18n = inject(I18nService);
  private readonly sanitizer = inject(DomSanitizer);
  private locationWatchId: number | null = null;

  readonly t = this.i18n.t;
  readonly departments = COLOMBIA_DEPARTMENTS;
  readonly damageOptions = HOUSE_DAMAGE_OPTIONS;
  readonly selectedDamage = signal<string[]>([]);
  readonly selectedPhotos = signal<SelectedPhoto[]>([]);
  readonly addressSuggestions = signal<AddressSuggestion[]>([]);
  readonly addressSearching = signal(false);
  readonly addressSearchUnavailable = signal(false);
  readonly addressSuggestionsOpen = signal(false);
  readonly municipalitySuggestions = signal<string[]>([]);
  readonly municipalitySearching = signal(false);
  readonly municipalitySuggestionsOpen = signal(false);
  private readonly selectedAddressLabel = signal('');
  private readonly locationSource = signal<'address' | 'device' | null>(null);
  private readonly coordinates = signal<Coordinates | null>(null);
  readonly locationMap = computed<SafeResourceUrl | null>(() => {
    const coordinates = this.coordinates();
    return coordinates
      ? this.sanitizer.bypassSecurityTrustResourceUrl(streetMapUrl(coordinates))
      : null;
  });
  private readonly locationMessageKey = signal<TranslationKey>('reportForm.locationIdle');
  private readonly locationMessageParams = signal<TranslationParams | undefined>(undefined);
  readonly locationMessage = computed(() =>
    this.t(this.locationMessageKey(), this.locationMessageParams()),
  );
  readonly trackingLocation = signal(false);
  readonly submitting = signal(false);
  private readonly successMessageKey = signal<TranslationKey | null>(null);
  private readonly errorMessageKey = signal<TranslationKey | null>(null);
  private readonly errorMessageParams = signal<TranslationParams | undefined>(undefined);
  readonly successMessage = computed(() => {
    const key = this.successMessageKey();
    return key ? this.t(key) : '';
  });
  readonly errorMessage = computed(() => {
    const key = this.errorMessageKey();
    return key ? this.t(key, this.errorMessageParams()) : '';
  });

  readonly reportForm = this.formBuilder.group({
    reporterName: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(80),
    ]),
    // Se aceptan letras y guiones además de la cédula colombiana: en un albergue hay
    // cédulas de extranjería y pasaportes. Mismo patrón que valida la API.
    documentId: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.pattern(/^[A-Za-z0-9-]{5,20}$/),
    ]),
    contactPhone: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.pattern(/^[0-9+()\s-]{7,20}$/),
    ]),
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
    notice: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(800),
    ]),
    latitude: this.formBuilder.control<number | null>(null, Validators.required),
    longitude: this.formBuilder.control<number | null>(null, Validators.required),
    accuracy: this.formBuilder.control<number | null>(null),
    consentToShareLocation: this.formBuilder.nonNullable.control(false, Validators.requiredTrue),
  });

  constructor() {
    const { addressReference, department, municipality } = this.reportForm.controls;
    combineLatest([
      addressReference.valueChanges.pipe(startWith(addressReference.value)),
      department.valueChanges.pipe(startWith(department.value)),
      municipality.valueChanges.pipe(startWith(municipality.value)),
    ])
      .pipe(
        debounceTime(500),
        map(([query, selectedDepartment, selectedMunicipality]) => ({
          query: query.trim(),
          department: selectedDepartment.trim(),
          municipality: selectedMunicipality.trim(),
        })),
        distinctUntilChanged(
          (previous, current) =>
            previous.query === current.query &&
            previous.department === current.department &&
            previous.municipality === current.municipality,
        ),
        switchMap((search) => {
          this.clearAddressLocationWhenEdited(search.query);
          if (search.query.length < 3 || !search.department) {
            return of({ suggestions: [] as AddressSuggestion[], unavailable: false });
          }

          this.addressSearching.set(true);
          this.addressSearchUnavailable.set(false);
          return this.geocodingService.searchAddresses(search).pipe(
            map((suggestions) => ({ suggestions, unavailable: false })),
            catchError(() =>
              of({ suggestions: [] as AddressSuggestion[], unavailable: true }),
            ),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ suggestions, unavailable }) => {
        this.addressSearching.set(false);
        this.addressSearchUnavailable.set(unavailable);
        this.addressSuggestions.set(suggestions);
        this.addressSuggestionsOpen.set(Boolean(suggestions.length || unavailable));
      });

    combineLatest([
      municipality.valueChanges.pipe(startWith(municipality.value)),
      department.valueChanges.pipe(startWith(department.value)),
    ])
      .pipe(
        debounceTime(450),
        map(([query, selectedDepartment]) => ({
          query: query.trim(),
          department: selectedDepartment.trim(),
        })),
        distinctUntilChanged(
          (previous, current) =>
            previous.query === current.query && previous.department === current.department,
        ),
        switchMap((search) => {
          if (search.query.length < 3 || !search.department) {
            return of([] as string[]);
          }
          this.municipalitySearching.set(true);
          return this.geocodingService.searchAddresses(search).pipe(
            map((suggestions) =>
              Array.from(
                new Set(
                  suggestions
                    .map((suggestion) => suggestion.municipality)
                    .filter(
                      (municipality) =>
                        municipality.length > 0 &&
                        this.normalizeText(municipality).includes(
                          this.normalizeText(search.query),
                        ),
                    ),
                ),
              ),
            ),
            catchError(() => of([] as string[])),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((suggestions) => {
        this.municipalitySearching.set(false);
        this.municipalitySuggestions.set(suggestions);
        this.municipalitySuggestionsOpen.set(Boolean(suggestions.length));
      });
  }

  ngOnDestroy(): void {
    this.stopLocationTracking();
    this.selectedPhotos().forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  }

  toggleDamage(damage: string): void {
    this.selectedDamage.update((current) =>
      current.includes(damage) ? current.filter((item) => item !== damage) : [...current, damage],
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

  showAddressSuggestions(): void {
    if (this.addressSuggestions().length || this.addressSearchUnavailable()) {
      this.addressSuggestionsOpen.set(true);
    }
  }

  hideAddressSuggestions(): void {
    window.setTimeout(() => this.addressSuggestionsOpen.set(false), 140);
  }

  selectAddress(suggestion: AddressSuggestion): void {
    const department = this.canonicalDepartment(suggestion.department);
    this.reportForm.patchValue(
      {
        addressReference: suggestion.label,
        municipality: suggestion.municipality || this.reportForm.controls.municipality.value,
        department: department || this.reportForm.controls.department.value,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        accuracy: null,
      },
      { emitEvent: false },
    );
    this.selectedAddressLabel.set(suggestion.label);
    this.locationSource.set('address');
    this.coordinates.set({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
    this.addressSuggestions.set([]);
    this.addressSuggestionsOpen.set(false);
    this.setLocationMessage('reportForm.locationSelectedFromAddress');
  }

  showMunicipalitySuggestions(): void {
    if (this.municipalitySuggestions().length) this.municipalitySuggestionsOpen.set(true);
  }

  hideMunicipalitySuggestions(): void {
    window.setTimeout(() => this.municipalitySuggestionsOpen.set(false), 140);
  }

  selectMunicipality(municipality: string): void {
    this.reportForm.controls.municipality.setValue(municipality, { emitEvent: false });
    this.municipalitySuggestions.set([]);
    this.municipalitySuggestionsOpen.set(false);
  }

  captureCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.setLocationMessage('reportForm.locationUnsupported');
      return;
    }
    this.setLocationMessage('reportForm.locationLoading');
    navigator.geolocation.getCurrentPosition(
      (position) => this.applyPosition(position),
      (error) => this.setLocationMessage(this.geolocationErrorKey(error)),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  toggleLocationTracking(): void {
    if (this.trackingLocation()) {
      this.stopLocationTracking();
      return;
    }
    if (!navigator.geolocation) {
      this.setLocationMessage('reportForm.trackingUnsupported');
      return;
    }
    this.trackingLocation.set(true);
    this.setLocationMessage('reportForm.trackingActive');
    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => this.applyPosition(position),
      (error) => {
        this.setLocationMessage(this.geolocationErrorKey(error));
        this.stopLocationTracking();
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
    );
  }

  stopLocationTracking(): void {
    if (this.locationWatchId !== null) navigator.geolocation.clearWatch(this.locationWatchId);
    this.locationWatchId = null;
    this.trackingLocation.set(false);
  }

  async submitReport(): Promise<void> {
    this.successMessageKey.set(null);
    this.clearError();
    this.reportForm.markAllAsTouched();
    if (this.reportForm.invalid || !this.selectedDamage().length || !this.selectedPhotos().length) {
      this.setError('reportForm.invalid');
      return;
    }

    const value = this.reportForm.getRawValue();
    this.submitting.set(true);
    try {
      await firstValueFrom(this.reportsService.createReport(this.buildPayload()));
      this.successMessageKey.set('reportForm.success');
      this.resetForm();
      document.querySelector('#reportes')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      this.setError(this.readApiErrorKey(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private buildPayload(): FormData {
    const value = this.reportForm.getRawValue();
    const payload = new FormData();
    payload.append('reporterName', value.reporterName);
    payload.append('documentId', value.documentId);
    payload.append('contactPhone', value.contactPhone);
    payload.append('department', value.department);
    payload.append('municipality', value.municipality);
    payload.append('addressReference', value.addressReference);
    payload.append('householdSize', String(value.householdSize));
    payload.append('urgency', value.urgency);
    payload.append('notice', value.notice);
    // `needs` es el nombre histórico del campo en la API; aquí contiene daños de vivienda.
    payload.append('needs', JSON.stringify(this.selectedDamage()));
    payload.append('latitude', String(value.latitude));
    payload.append('longitude', String(value.longitude));
    if (value.accuracy !== null) payload.append('accuracy', String(value.accuracy));
    payload.append('consentToShareLocation', String(value.consentToShareLocation));
    this.selectedPhotos().forEach(({ file }) => payload.append('photos', file));
    return payload;
  }

  private applyPosition(position: GeolocationPosition): void {
    this.reportForm.patchValue({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    });
    this.locationSource.set('device');
    this.coordinates.set({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    this.setLocationMessage('reportForm.locationCaptured', {
      meters: Math.round(position.coords.accuracy),
    });
  }

  private resetForm(): void {
    this.stopLocationTracking();
    this.selectedPhotos().forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    this.selectedPhotos.set([]);
    this.selectedDamage.set([]);
    this.addressSuggestions.set([]);
    this.addressSuggestionsOpen.set(false);
    this.addressSearchUnavailable.set(false);
    this.municipalitySuggestions.set([]);
    this.municipalitySuggestionsOpen.set(false);
    this.selectedAddressLabel.set('');
    this.locationSource.set(null);
    this.coordinates.set(null);
    this.setLocationMessage('reportForm.locationIdle');
    this.reportForm.reset({
      reporterName: '',
      documentId: '',
      contactPhone: '',
      department: '',
      municipality: '',
      addressReference: '',
      householdSize: 1,
      urgency: UrgencyLevel.HIGH,
      notice: '',
      latitude: null,
      longitude: null,
      accuracy: null,
      consentToShareLocation: false,
    });
  }

  private geolocationErrorKey(error: GeolocationPositionError): TranslationKey {
    if (error.code === error.PERMISSION_DENIED) return 'reportForm.locationDenied';
    if (error.code === error.POSITION_UNAVAILABLE) return 'reportForm.locationUnavailable';
    return 'reportForm.locationTimeout';
  }

  private clearAddressLocationWhenEdited(address: string): void {
    if (
      this.locationSource() !== 'address' ||
      !this.selectedAddressLabel() ||
      address === this.selectedAddressLabel()
    ) {
      return;
    }
    this.selectedAddressLabel.set('');
    this.locationSource.set(null);
    this.coordinates.set(null);
    this.reportForm.patchValue(
      { latitude: null, longitude: null, accuracy: null },
      { emitEvent: false },
    );
    this.setLocationMessage('reportForm.locationIdle');
  }

  private canonicalDepartment(value: string): string {
    const normalized = this.normalizeText(value);
    return this.departments.find((department) => this.normalizeText(department) === normalized) ?? '';
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  private readApiErrorKey(_error: unknown): TranslationKey {
    return 'reportForm.error';
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
