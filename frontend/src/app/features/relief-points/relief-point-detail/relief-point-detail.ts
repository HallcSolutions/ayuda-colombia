import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { ReliefPointStatus } from '../../../core/constants/app.constants';
import {
  mealTypeKey,
  reliefPointStatusKey,
  supplyCategoryKey,
  urgencyKey,
} from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AidAlert } from '../../../core/models/aid-alert.model';
import { MealService } from '../../../core/models/meal-service.model';
import { ReliefPoint } from '../../../core/models/relief-point.model';
import { AlertsService } from '../../../core/services/alerts.service';
import { ReliefPointsService } from '../../../core/services/relief-points.service';
import { mapUrl, streetMapUrl } from '../../../core/utils/geo.util';
import { needIcon } from '../need-icon';
import { isVerifiedPlace } from '../verification';

/**
 * Ficha completa de un punto: qué necesita, qué contó quien lo registró y cómo llegar.
 * Se abre dentro de `app-modal` desde el mapa o desde el directorio.
 */
@Component({
  selector: 'app-relief-point-detail',
  imports: [DatePipe],
  templateUrl: './relief-point-detail.html',
  styleUrl: './relief-point-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReliefPointDetail {
  private readonly reliefPointsService = inject(ReliefPointsService);
  private readonly alertsService = inject(AlertsService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly i18n = inject(I18nService);

  readonly point = input.required<ReliefPoint>();
  readonly meals = input<MealService[]>([]);
  readonly alerts = input<AidAlert[]>([]);
  readonly distanceKm = input<number | null>(null);
  readonly requestHelp = output<ReliefPoint>();
  readonly registerMeal = output<ReliefPoint>();

  protected readonly t = this.i18n.t;
  protected readonly statusKey = reliefPointStatusKey;
  protected readonly mealTypeKey = mealTypeKey;
  protected readonly categoryKey = supplyCategoryKey;
  protected readonly urgencyKey = urgencyKey;
  protected readonly pointStatus = ReliefPointStatus;

  readonly errorMessage = signal('');
  /** Alerta que se está cerrando ahora mismo, para no repetir el envío. */
  readonly resolvingAlertId = signal<string | null>(null);

  readonly directionsUrl = computed(() => mapUrl(this.point()));

  /** El callejero solo se pide cuando la ficha ya está abierta, no antes. */
  readonly streetMap = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(streetMapUrl(this.point())),
  );

  readonly hasCallablePhone = computed(
    () => (this.point().contactPhone.match(/\d/g)?.length ?? 0) >= 7,
  );

  readonly isVerified = computed(() => isVerifiedPlace(this.point()));

  /**
   * Icono de la necesidad. Se mira la categoría, el titular y el mensaje juntos porque
   * quien reporta escribe libremente: el detalle ("pañales") suele ir en el texto, no
   * en la categoría.
   */
  alertIcon(alert: AidAlert): string {
    return needIcon(`${alert.category} ${alert.title} ${alert.message}`);
  }

  /**
   * Cuando la ayuda ya llegó, quien atiende el punto cierra la petición y deja de
   * aparecer como necesidad abierta: así nadie vuelve a cargar con lo mismo.
   */
  async markNeedCovered(alert: AidAlert): Promise<void> {
    this.errorMessage.set('');
    this.resolvingAlertId.set(alert.id);
    try {
      await firstValueFrom(this.alertsService.resolveAlert(alert.id));
    } catch {
      this.errorMessage.set(this.t('reliefPointCard.needCoveredError'));
    } finally {
      this.resolvingAlertId.set(null);
    }
  }

  async changeStatus(status: ReliefPointStatus): Promise<void> {
    this.errorMessage.set('');
    try {
      await firstValueFrom(this.reliefPointsService.changeStatus(this.point().id, status));
    } catch {
      this.errorMessage.set(this.t('reliefPointCard.statusError'));
    }
  }
}
