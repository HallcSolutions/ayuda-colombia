import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { RELIEF_POINT_TYPES, ReliefPointType } from '../../../core/constants/app.constants';
import { COLOMBIA_DEPARTMENTS } from '../../../core/constants/colombia.constants';
import { reliefPointTypeKey } from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { GeocodingService } from '../../../core/services/geocoding.service';
import { ReliefPointsService } from '../../../core/services/relief-points.service';

@Component({
  selector: 'app-relief-point-form',
  imports: [ReactiveFormsModule],
  templateUrl: './relief-point-form.html',
  styleUrl: './relief-point-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReliefPointForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly reliefPointsService = inject(ReliefPointsService);
  private readonly geocodingService = inject(GeocodingService);
  private readonly i18n = inject(I18nService);

  /**
   * Tipo ya decidido por la pantalla que abre el formulario (por ejemplo, una veterinaria
   * desde "A dónde ir"). Si viene, no se pregunta: se registra lo que se vino a registrar.
   */
  readonly fixedType = input<ReliefPointType | null>(null);

  readonly closed = output<void>();

  protected readonly t = this.i18n.t;
  protected readonly pointTypes = RELIEF_POINT_TYPES;
  protected readonly pointTypeKey = reliefPointTypeKey;
  protected readonly departments = COLOMBIA_DEPARTMENTS;

  readonly submitting = signal(false);
  readonly resolvingAddress = signal(false);
  readonly errorMessage = signal('');
  readonly locationMessage = signal(this.i18n.t('reliefPointForm.locationPending'));

  readonly form = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(120),
    ]),
    type: this.formBuilder.nonNullable.control(
      ReliefPointType.COLLECTION_CENTER,
      Validators.required,
    ),
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
    contactName: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(80),
    ]),
    contactPhone: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.pattern(/^[0-9+()\s-]{7,20}$/),
    ]),
    schedule: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(120),
    ]),
    dailyMealCapacity: this.formBuilder.control<number | null>(null, Validators.min(0)),
    notes: this.formBuilder.nonNullable.control('', Validators.maxLength(400)),
    latitude: this.formBuilder.control<number | null>(null, Validators.required),
    longitude: this.formBuilder.control<number | null>(null, Validators.required),
  });

  constructor() {
    effect(() => {
      const type = this.fixedType();
      if (type) this.form.controls.type.setValue(type);
    });
  }

  captureCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.locationMessage.set(this.t('reliefPointForm.locationUnavailable'));
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
        this.locationMessage.set(
          error.code === error.PERMISSION_DENIED
            ? this.t('reliefPointForm.locationDenied')
            : this.t('reliefPointForm.locationUnavailable'),
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  private async fillAddressFromPosition(position: GeolocationPosition): Promise<void> {
    this.resolvingAddress.set(true);
    this.locationMessage.set(
      this.t('reliefPointForm.locationResolvingAddress', {
        meters: Math.round(position.coords.accuracy),
      }),
    );

    try {
      const suggestion = await firstValueFrom(
        this.geocodingService.reverseLocation(
          position.coords.latitude,
          position.coords.longitude,
        ),
      );
      if (!suggestion) {
        this.locationMessage.set(this.t('reliefPointForm.locationAddressNotFound'));
        return;
      }

      const department = this.canonicalDepartment(suggestion.department);
      this.form.patchValue({
        department: department || this.form.controls.department.value,
        municipality: suggestion.municipality || this.form.controls.municipality.value,
        addressReference: suggestion.address || suggestion.label,
      });
      this.locationMessage.set(
        this.t('reliefPointForm.locationReadyAndAddress', {
          meters: Math.round(position.coords.accuracy),
        }),
      );
    } catch {
      this.locationMessage.set(this.t('reliefPointForm.locationAddressUnavailable'));
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
        .sort(
          (left, right) =>
            this.normalizeText(right).length - this.normalizeText(left).length,
        )
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
    this.errorMessage.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMessage.set(this.t('reliefPointForm.invalid'));
      return;
    }

    const { dailyMealCapacity, latitude, longitude, ...rest } = this.form.getRawValue();
    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.reliefPointsService.createPoint({
          ...rest,
          latitude: latitude as number,
          longitude: longitude as number,
          ...(dailyMealCapacity === null ? {} : { dailyMealCapacity }),
        }),
      );
      this.closed.emit();
    } catch {
      this.errorMessage.set(this.t('reliefPointForm.error'));
    } finally {
      this.submitting.set(false);
    }
  }
}
