import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ConvoyStatus, RouteSource } from '../../../core/constants/app.constants';
import { convoyStatusKey, supplyCategoryKey } from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { ConvoyTrip } from '../../../core/models/convoy-trip.model';
import { colombiaDateTime } from '../../../core/utils/date.util';
import { durationLabel } from '../../../core/utils/duration.util';
import { mapUrl } from '../../../core/utils/geo.util';
import { whatsappUrl } from '../../../core/utils/phone.util';

@Component({
  selector: 'app-convoy-card',
  templateUrl: './convoy-card.html',
  styleUrl: './convoy-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConvoyCard {
  private readonly i18n = inject(I18nService);

  readonly trip = input.required<ConvoyTrip>();
  /** Reloj de la sección: mantiene vivos los «faltan…» sin un temporizador por tarjeta. */
  readonly now = input.required<number>();

  protected readonly t = this.i18n.t;
  protected readonly convoyStatus = ConvoyStatus;

  readonly statusLabel = computed(() => this.t(convoyStatusKey(this.trip().status)));

  readonly cargoLabel = computed(() =>
    this.trip()
      .cargo.map((category) => this.t(supplyCategoryKey(category)))
      .join(' · '),
  );

  readonly routeLabel = computed(
    () => `${this.trip().originMunicipality} → ${this.trip().destination.municipality}`,
  );

  readonly departureLabel = computed(() => this.formatTime(this.trip().departureAt));

  /** Hora a la que se espera el camión, si ya hay con qué calcularla. */
  readonly etaLabel = computed(() => {
    const etaAt = this.trip().etaAt;
    return etaAt ? this.formatTime(etaAt) : '';
  });

  readonly etaCountdown = computed(() => {
    const etaAt = this.trip().etaAt;
    if (!etaAt) return '';
    const { key, params } = durationLabel(new Date(etaAt).getTime() - this.now());
    return this.t(key, params);
  });

  readonly lastSignalLabel = computed(() => {
    const lastPingAt = this.trip().lastPingAt;
    if (!lastPingAt) return '';
    const { key, params } = durationLabel(this.now() - new Date(lastPingAt).getTime());
    return this.t(key, params);
  });

  readonly arrivedLabel = computed(() => {
    const arrivedAt = this.trip().arrivedAt;
    return arrivedAt ? this.formatTime(arrivedAt) : '';
  });

  /** Se avisa cuando lo que falta no pudo medirse por carretera: no es lo mismo. */
  readonly isStraightLine = computed(() => this.trip().routeSource === RouteSource.STRAIGHT_LINE);

  readonly isTravelling = computed(
    () =>
      this.trip().status === ConvoyStatus.EN_ROUTE || this.trip().status === ConvoyStatus.PAUSED,
  );

  readonly mapLink = computed(() => mapUrl(this.trip().destination));
  readonly whatsappLink = computed(() => whatsappUrl(this.trip().contactPhone));

  private formatTime(value: string): string {
    return colombiaDateTime(value, this.i18n.locale());
  }
}
