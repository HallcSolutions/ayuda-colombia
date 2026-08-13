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
import { SUPPLY_CATEGORIES, SupplyCategory } from '../../../core/constants/app.constants';
import { COLOMBIA_DEPARTMENTS } from '../../../core/constants/colombia.constants';
import { supplyCategoryKey } from '../../../core/i18n/domain-keys';
import { TranslationKey } from '../../../core/i18n/es.translations';
import { I18nService } from '../../../core/i18n/i18n.service';
import { ConvoyTrackerService } from '../../../core/services/convoy-tracker.service';
import { ConvoysService } from '../../../core/services/convoys.service';
import { ReliefPointsService } from '../../../core/services/relief-points.service';

/** Valor inicial del campo de salida: ahora mismo, en la hora del dispositivo. */
function localDateTimeValue(): string {
  const now = new Date();
  const minutesOffset = now.getTimezoneOffset();
  return new Date(now.getTime() - minutesOffset * 60_000).toISOString().slice(0, 16);
}

@Component({
  selector: 'app-convoy-form',
  imports: [ReactiveFormsModule],
  templateUrl: './convoy-form.html',
  styleUrl: './convoy-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConvoyForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly convoys = inject(ConvoysService);
  private readonly tracker = inject(ConvoyTrackerService);
  private readonly reliefPoints = inject(ReliefPointsService);
  private readonly i18n = inject(I18nService);

  protected readonly t = this.i18n.t;
  protected readonly departments = COLOMBIA_DEPARTMENTS;
  protected readonly categories = SUPPLY_CATEGORIES;
  protected readonly categoryKey = supplyCategoryKey;

  readonly closed = output<void>();

  /** Puntos de la zona elegida: son los destinos posibles del camión. */
  readonly destinations = computed(() => this.reliefPoints.pointsInRegion());

  readonly cargo = signal<SupplyCategory[]>([]);
  readonly submitting = signal(false);
  /** PIN devuelto al anunciar; se muestra una sola vez. */
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

  readonly form = this.formBuilder.group({
    driverName: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(80),
    ]),
    contactPhone: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.pattern(/^[0-9+()\s-]{7,20}$/),
    ]),
    vehicleDescription: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(80),
    ]),
    vehiclePlate: this.formBuilder.nonNullable.control('', Validators.maxLength(12)),
    cargoNotes: this.formBuilder.nonNullable.control('', Validators.maxLength(300)),
    originDepartment: this.formBuilder.nonNullable.control('', Validators.required),
    originMunicipality: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(80),
    ]),
    destinationPointId: this.formBuilder.nonNullable.control('', Validators.required),
    departureAt: this.formBuilder.nonNullable.control(localDateTimeValue(), Validators.required),
    shareLocation: this.formBuilder.nonNullable.control(true),
  });

  toggleCargo(category: SupplyCategory): void {
    this.cargo.update((selected) =>
      selected.includes(category)
        ? selected.filter((item) => item !== category)
        : [...selected, category],
    );
  }

  async submit(): Promise<void> {
    this.errorKey.set(null);
    this.successKey.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.cargo().length) {
      this.errorKey.set('convoyForm.invalid');
      return;
    }

    this.submitting.set(true);
    try {
      const value = this.form.getRawValue();
      const published = await firstValueFrom(
        this.convoys.announceTrip({
          driverName: value.driverName,
          contactPhone: value.contactPhone,
          vehiclePlate: value.vehiclePlate || undefined,
          vehicleDescription: value.vehicleDescription,
          cargo: this.cargo(),
          cargoNotes: value.cargoNotes || undefined,
          originDepartment: value.originDepartment,
          originMunicipality: value.originMunicipality,
          destinationPointId: value.destinationPointId,
          // El campo entrega hora local; se envía en ISO para que el servidor no la reinterprete.
          departureAt: new Date(value.departureAt).toISOString(),
          shareLocation: value.shareLocation,
        }),
      );
      // El PIN queda en este dispositivo: es lo que permite seguir mandando la posición.
      this.tracker.remember(published.id, published.editPin);
      this.publishedPin.set(published.editPin);
      this.pinCopied.set(false);
      this.successKey.set('convoyForm.success');
      this.resetForm();
    } catch {
      this.errorKey.set('convoyForm.error');
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

  private resetForm(): void {
    this.cargo.set([]);
    this.form.reset({
      driverName: '',
      contactPhone: '',
      vehicleDescription: '',
      vehiclePlate: '',
      cargoNotes: '',
      originDepartment: '',
      originMunicipality: '',
      destinationPointId: '',
      departureAt: localDateTimeValue(),
      shareLocation: true,
    });
  }
}
