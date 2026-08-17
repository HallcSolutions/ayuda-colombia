import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReliefPointStatus, ReportStatus, UrgencyLevel } from '../../core/constants/app.constants';
import {
  COLOMBIA_DEPARTMENT_SHAPES,
  COLOMBIA_MAP_VIEWBOX,
} from '../../core/constants/colombia-map.constants';
import { reliefPointTypeKey } from '../../core/i18n/domain-keys';
import { I18nService } from '../../core/i18n/i18n.service';
import { AlertsService } from '../../core/services/alerts.service';
import { MealsService } from '../../core/services/meals.service';
import { RegionService } from '../../core/services/region.service';
import { ReliefPointsService } from '../../core/services/relief-points.service';
import { ReportsService } from '../../core/services/reports.service';
import { AidOfferNotice } from '../../shared/aid-offer-notice/aid-offer-notice';
import { ColombiaMap } from '../../shared/colombia-map/colombia-map';
import { MapMarker } from '../../shared/colombia-map/colombia-map.model';
import { PerlaHelpNotice } from '../../shared/perla-help-notice/perla-help-notice';
import { toMapMarker } from '../relief-points/relief-point-marker';
import { NeedsDigestPanel } from './needs-digest/needs-digest';
import { NewsFeed } from './news-feed/news-feed';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ColombiaMap, NeedsDigestPanel, NewsFeed, AidOfferNotice, PerlaHelpNotice],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly reportsService = inject(ReportsService);
  private readonly reliefPointsService = inject(ReliefPointsService);
  private readonly mealsService = inject(MealsService);
  private readonly alertsService = inject(AlertsService);
  private readonly region = inject(RegionService);
  readonly t = inject(I18nService).t;
  protected readonly typeKey = reliefPointTypeKey;
  protected readonly homeMapShapes = COLOMBIA_DEPARTMENT_SHAPES;
  protected readonly homeMapViewBox = COLOMBIA_MAP_VIEWBOX;

  readonly openReports = computed(
    () =>
      this.reportsService.reportsInRegion().filter((report) => report.status === ReportStatus.OPEN)
        .length,
  );
  readonly criticalReports = computed(
    () =>
      this.reportsService
        .reportsInRegion()
        .filter((report) => report.urgency === UrgencyLevel.CRITICAL).length,
  );
  readonly peopleReported = computed(() =>
    this.reportsService
      .reportsInRegion()
      .reduce((total, report) => total + report.householdSize, 0),
  );

  readonly activePoints = computed(
    () =>
      this.reliefPointsService
        .pointsInRegion()
        .filter((point) => point.status !== ReliefPointStatus.CLOSED).length,
  );
  readonly activeAlerts = computed(() => this.alertsService.activeAlerts().length);
  readonly portionsToday = computed(() =>
    this.mealsService.mealServices().reduce((total, meal) => total + meal.portionsPlanned, 0),
  );

  readonly selectedPointId = signal<string | null>(null);

  /** Cada punto de ayuda del país convertido en chincheta del mapa. */
  readonly mapMarkers = computed(() =>
    this.reliefPointsService
      .pointsInRegion()
      .map((point) => toMapMarker(point, this.alertsService.activeAlertsOf(point.id).length > 0)),
  );

  /** Punto abierto desde el mapa, con lo justo para saber si sirve e ir hasta él. */
  readonly selectedPoint = computed(
    () =>
      this.reliefPointsService
        .pointsInRegion()
        .find((point) => point.id === this.selectedPointId()) ?? null,
  );

  constructor() {
    // El mapa de la portada necesita los puntos de la zona elegida.
    effect(() => {
      this.region.selection();
      this.reliefPointsService.loadPoints();
    });
  }

  selectPoint(marker: MapMarker | null): void {
    this.selectedPointId.set(marker?.id ?? null);
  }
}
