import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MissingStatus } from '../../../core/constants/app.constants';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AlertsService } from '../../../core/services/alerts.service';
import { MealsService } from '../../../core/services/meals.service';
import { MissingService } from '../../../core/services/missing.service';
import { RegionService } from '../../../core/services/region.service';
import { ReliefPointsService } from '../../../core/services/relief-points.service';
import {
  NewsEvent,
  alertEvent,
  mealEvent,
  missingEvent,
  reliefPointEvent,
  sortByMostRecent,
} from './news-event';

/** La portada muestra un resumen: lo más reciente, no el histórico completo. */
const VISIBLE_EVENTS = 8;

@Component({
  selector: 'app-news-feed',
  imports: [DatePipe, RouterLink],
  templateUrl: './news-feed.html',
  styleUrl: './news-feed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsFeed {
  private readonly alertsService = inject(AlertsService);
  private readonly reliefPointsService = inject(ReliefPointsService);
  private readonly mealsService = inject(MealsService);
  private readonly missingService = inject(MissingService);
  private readonly region = inject(RegionService);
  readonly i18n = inject(I18nService);

  protected readonly t = this.i18n.t;

  /**
   * Todo lo que ha pasado en la zona, en una sola línea de tiempo. Se arma con los
   * datos que ya tienen los servicios, así que se repinta sola cuando entra un
   * evento por socket o cuando se cambia de idioma.
   */
  readonly events = computed<NewsEvent[]>(() => {
    const points = this.reliefPointsService.pointsInRegion();
    const pointById = new Map(points.map((point) => [point.id, point]));

    const alerts = this.alertsService.alertsInRegion().map((alert) => alertEvent(alert, this.t));
    const newPoints = points.map((point) => reliefPointEvent(point, this.t));
    const meals = this.mealsService
      .mealServices()
      .map((meal) => mealEvent(meal, pointById.get(meal.reliefPointId), this.t))
      .filter((event): event is NewsEvent => event !== null);
    const missing = this.missingService
      .recordsInRegion()
      .filter((record) => record.status !== MissingStatus.CLOSED)
      .map((record) => missingEvent(record, this.t));

    return sortByMostRecent([...alerts, ...newPoints, ...meals, ...missing]).slice(
      0,
      VISIBLE_EVENTS,
    );
  });

  readonly openNeeds = computed(
    () => this.events().filter((event) => event.kind === 'need').length,
  );

  constructor() {
    // Las alertas y los puntos ya los cargan el banner y la portada; aquí faltan
    // las comidas del día y las búsquedas de personas y animales.
    effect(() => {
      this.region.selection();
      this.mealsService.loadMealServices();
      this.missingService.loadRecords();
    });
  }
}
