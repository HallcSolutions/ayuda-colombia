import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AlertStatus } from '../../../core/constants/app.constants';
import { reliefPointTypeKey } from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AidAlert } from '../../../core/models/aid-alert.model';
import { MealService } from '../../../core/models/meal-service.model';
import { ReliefPoint } from '../../../core/models/relief-point.model';
import { AlertsService } from '../../../core/services/alerts.service';
import { MealsService } from '../../../core/services/meals.service';
import { ReliefPointShareService } from '../../../core/services/relief-point-share.service';
import { ReliefPointsService } from '../../../core/services/relief-points.service';
import { mapUrl } from '../../../core/utils/geo.util';
import { Modal } from '../../../shared/modal/modal';
import { AlertForm } from '../../alerts/alert-form/alert-form';
import { MealServiceForm } from '../../meals/meal-service-form/meal-service-form';
import { ReliefPointDetail } from '../relief-point-detail/relief-point-detail';

type PageAction = 'alert' | 'meal' | null;

/** Página exclusiva de una ficha compartida: no carga ni pinta el directorio nacional. */
@Component({
  selector: 'app-relief-point-page',
  imports: [RouterLink, ReliefPointDetail, Modal, AlertForm, MealServiceForm],
  templateUrl: './relief-point-page.html',
  styleUrl: './relief-point-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReliefPointPage {
  private readonly route = inject(ActivatedRoute);
  private readonly reliefPointsService = inject(ReliefPointsService);
  private readonly alertsService = inject(AlertsService);
  private readonly mealsService = inject(MealsService);
  private readonly shareService = inject(ReliefPointShareService);

  protected readonly t = inject(I18nService).t;
  protected readonly typeKey = reliefPointTypeKey;

  readonly pointId = this.route.snapshot.paramMap.get('pointId') ?? '';
  readonly loadedPoint = signal<ReliefPoint | null>(null);
  readonly loadedAlerts = signal<AidAlert[]>([]);
  readonly loadedMeals = signal<MealService[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly action = signal<PageAction>(null);
  readonly shareResult = signal<'idle' | 'copied' | 'failed'>('idle');

  readonly point = computed(
    () =>
      this.reliefPointsService.points().find((point) => point.id === this.pointId) ??
      this.loadedPoint(),
  );

  readonly alerts = computed(() =>
    this.uniqueById([
      ...this.loadedAlerts(),
      ...this.alertsService.activeAlertsOf(this.pointId),
    ]).filter((alert) => alert.status === AlertStatus.ACTIVE),
  );

  readonly meals = computed(() =>
    this.uniqueById([...this.loadedMeals(), ...this.mealsService.mealServicesOf(this.pointId)]),
  );

  readonly directionsUrl = computed(() => {
    const point = this.point();
    return point ? mapUrl(point) : '';
  });

  constructor() {
    void this.load();
  }

  openAlertForm(): void {
    this.action.set('alert');
  }

  openMealForm(): void {
    this.action.set('meal');
  }

  closeAction(): void {
    this.action.set(null);
  }

  async sharePoint(): Promise<void> {
    const point = this.point();
    if (!point) return;
    this.shareResult.set('idle');
    const result = await this.shareService.share(point);
    if (result === 'copied') this.shareResult.set('copied');
    if (result === 'failed') this.shareResult.set('failed');
  }

  private async load(): Promise<void> {
    if (!this.pointId) {
      this.loadError.set(this.t('reliefPointPage.notFound'));
      this.loading.set(false);
      return;
    }

    const alertsRequest = firstValueFrom(this.alertsService.loadAlertsForPoint(this.pointId))
      .then((alerts) => this.loadedAlerts.set(alerts))
      .catch(() => undefined);
    const mealsRequest = firstValueFrom(this.mealsService.loadMealServicesForPoint(this.pointId))
      .then((meals) => this.loadedMeals.set(meals))
      .catch(() => undefined);

    try {
      this.loadedPoint.set(await firstValueFrom(this.reliefPointsService.loadPoint(this.pointId)));
      await Promise.all([alertsRequest, mealsRequest]);
    } catch {
      this.loadError.set(this.t('reliefPointPage.notFound'));
    } finally {
      this.loading.set(false);
    }
  }

  private uniqueById<T extends { id: string }>(items: T[]): T[] {
    return [...new Map(items.map((item) => [item.id, item])).values()];
  }
}
