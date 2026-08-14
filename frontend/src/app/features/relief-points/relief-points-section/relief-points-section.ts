import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  RELIEF_POINT_STATUSES,
  RELIEF_POINT_TYPES,
  ReliefPointStatus,
  ReliefPointType,
} from '../../../core/constants/app.constants';
import {
  COLOMBIA_DEPARTMENT_SHAPES,
  COLOMBIA_MAP_VIEWBOX,
} from '../../../core/constants/colombia-map.constants';
import { reliefPointStatusKey, reliefPointTypeKey } from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { ReliefPoint } from '../../../core/models/relief-point.model';
import { AlertsService } from '../../../core/services/alerts.service';
import { MealsService } from '../../../core/services/meals.service';
import { RegionService } from '../../../core/services/region.service';
import { ReliefPointsService } from '../../../core/services/relief-points.service';
import { Coordinates } from '../../../core/models/coordinates.model';
import { distanceInKm, mapUrl } from '../../../core/utils/geo.util';
import { alertNeeds } from '../../../core/utils/needs.util';
import { ColombiaMap } from '../../../shared/colombia-map/colombia-map';
import { MapMarker } from '../../../shared/colombia-map/colombia-map.model';
import { Modal } from '../../../shared/modal/modal';
import { AlertForm } from '../../alerts/alert-form/alert-form';
import { MealServiceForm } from '../../meals/meal-service-form/meal-service-form';
import { ReliefPointDetail } from '../relief-point-detail/relief-point-detail';
import { ReliefPointForm } from '../relief-point-form/relief-point-form';
import { needIcon } from '../need-icon';
import { isVerifiedPlace } from '../verification';
import { toMapMarker } from '../relief-point-marker';
import { DepartmentGroup, PointAction } from './relief-points-section.model';

@Component({
  selector: 'app-relief-points-section',
  imports: [ColombiaMap, ReliefPointDetail, ReliefPointForm, AlertForm, MealServiceForm, Modal],
  templateUrl: './relief-points-section.html',
  styleUrl: './relief-points-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReliefPointsSection {
  private readonly region = inject(RegionService);
  readonly reliefPointsService = inject(ReliefPointsService);
  readonly mealsService = inject(MealsService);
  readonly alertsService = inject(AlertsService);

  protected readonly t = inject(I18nService).t;
  protected readonly pointTypes = RELIEF_POINT_TYPES;
  protected readonly pointStatuses = RELIEF_POINT_STATUSES;
  protected readonly typeKey = reliefPointTypeKey;
  protected readonly statusKey = reliefPointStatusKey;
  protected readonly needIcon = needIcon;
  protected readonly isVerified = isVerifiedPlace;
  protected readonly heroMapShapes = COLOMBIA_DEPARTMENT_SHAPES;
  protected readonly heroMapViewBox = COLOMBIA_MAP_VIEWBOX;

  readonly search = signal('');
  readonly typeFilter = signal<'' | ReliefPointType>('');
  readonly statusFilter = signal<'' | ReliefPointStatus>('');
  readonly userLocation = signal<Coordinates | null>(null);
  readonly locating = signal(false);
  readonly locationError = signal('');
  readonly showPointForm = signal(false);
  readonly activeAction = signal<PointAction>(null);
  readonly selectedPointId = signal<string | null>(null);
  /** Punto cuya ficha completa está abierta en una ventana. */
  readonly detailPointId = signal<string | null>(null);

  /** Puntos que pasan los filtros de la zona, texto, tipo y estado. */
  private readonly visiblePoints = computed(() => {
    const search = this.search().trim().toLowerCase();
    const type = this.typeFilter();
    const status = this.statusFilter();
    return this.reliefPointsService.pointsInRegion().filter((point) => {
      const matchesText =
        !search ||
        [point.name, point.municipality, point.department, point.addressReference]
          .join(' ')
          .toLowerCase()
          .includes(search);
      return matchesText && (!type || point.type === type) && (!status || point.status === status);
    });
  });

  /** Dentro de cada ciudad, primero los puntos más cercanos si hay ubicación. */
  private readonly sortedPoints = computed(() => {
    const origin = this.userLocation();
    const points = [...this.visiblePoints()];
    if (!origin) return points;
    return points.sort(
      (first, second) => distanceInKm(origin, first) - distanceInKm(origin, second),
    );
  });

  /** Los puntos se presentan agrupados por departamento y luego por ciudad. */
  readonly groups = computed<DepartmentGroup[]>(() => {
    const byDepartment = new Map<string, Map<string, ReliefPoint[]>>();
    for (const point of this.sortedPoints()) {
      const municipalities = byDepartment.get(point.department) ?? new Map<string, ReliefPoint[]>();
      municipalities.set(point.municipality, [
        ...(municipalities.get(point.municipality) ?? []),
        point,
      ]);
      byDepartment.set(point.department, municipalities);
    }

    return [...byDepartment.entries()].map(([department, municipalities]) => {
      const points = [...municipalities.values()].flat();
      return {
        department,
        municipalities: [...municipalities.entries()].map(([municipality, cityPoints]) => ({
          municipality,
          points: cityPoints,
        })),
        pointCount: points.length,
        portionsToday: points.reduce((total, point) => total + this.portionsOf(point.id), 0),
        alertCount: points.reduce(
          (total, point) => total + this.alertsService.activeAlertsOf(point.id).length,
          0,
        ),
      };
    });
  });

  readonly totalPoints = computed(() => this.visiblePoints().length);
  readonly totalKitchens = computed(
    () =>
      this.visiblePoints().filter((point) => point.type === ReliefPointType.COMMUNITY_KITCHEN)
        .length,
  );
  readonly totalPortionsToday = computed(() =>
    this.visiblePoints().reduce((total, point) => total + this.portionsOf(point.id), 0),
  );
  readonly totalAlerts = computed(() =>
    this.visiblePoints().reduce(
      (total, point) => total + this.alertsService.activeAlertsOf(point.id).length,
      0,
    ),
  );

  /** Cada punto visible convertido en chincheta del mapa. */
  readonly mapMarkers = computed(() =>
    this.visiblePoints().map((point) =>
      toMapMarker(point, this.alertsService.activeAlertsOf(point.id).length > 0),
    ),
  );

  /** Punto abierto desde el mapa, mientras siga pasando los filtros. */
  readonly selectedPoint = computed(
    () => this.visiblePoints().find((point) => point.id === this.selectedPointId()) ?? null,
  );

  /**
   * Punto de la ficha abierta. Se busca sobre todos los puntos cargados, no sobre los
   * filtrados: cambiar el estado del punto desde la ficha no puede cerrarla de golpe.
   */
  readonly detailPoint = computed(
    () =>
      this.reliefPointsService.points().find((point) => point.id === this.detailPointId()) ?? null,
  );

  readonly directoryTitle = computed(() => {
    const department = this.region.department();
    return department
      ? this.t('reliefPoints.directoryDepartment', { department })
      : this.t('reliefPoints.directoryAll');
  });

  constructor() {
    effect(() => {
      this.region.selection();
      this.reliefPointsService.loadPoints();
      this.mealsService.loadMealServices();
    });

    let previousDepartment = this.region.department();
    effect(() => {
      const department = this.region.department();
      if (department === previousDepartment) return;
      previousDepartment = department;
      this.selectedPointId.set(null);
      if (!department) return;
      window.setTimeout(() =>
        document.getElementById('directorio-ayuda')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        }),
      );
    });
  }

  mealsOf(pointId: string) {
    return this.mealsService.mealServicesOf(pointId);
  }

  alertsOf(pointId: string) {
    return this.alertsService.activeAlertsOf(pointId);
  }

  /** Una etiqueta por necesidad; la misma lista que se retira desde la ficha. */
  needList(pointId: string): string[] {
    return this.alertsOf(pointId).flatMap(alertNeeds);
  }

  directionsFor(point: ReliefPoint): string {
    return mapUrl(point);
  }

  hasCallablePhone(point: ReliefPoint): boolean {
    return (point.contactPhone.match(/\d/g)?.length ?? 0) >= 7;
  }

  distanceOf(point: ReliefPoint): number | null {
    const origin = this.userLocation();
    return origin ? distanceInKm(origin, point) : null;
  }

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  updateTypeFilter(event: Event): void {
    this.typeFilter.set((event.target as HTMLSelectElement).value as '' | ReliefPointType);
  }

  updateStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as '' | ReliefPointStatus);
  }

  sortByDistance(): void {
    if (!navigator.geolocation) {
      this.locationError.set(this.t('reliefPoints.locationError'));
      return;
    }
    this.locating.set(true);
    this.locationError.set('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLocation.set({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        this.locating.set(false);
      },
      () => {
        this.locationError.set(this.t('reliefPoints.locationError'));
        this.locating.set(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  /** El mapa abre la ficha del punto tocado, o la cierra al salir de él. */
  selectPoint(marker: MapMarker | null): void {
    this.selectedPointId.set(marker?.id ?? null);
  }

  openDetail(point: ReliefPoint): void {
    this.detailPointId.set(point.id);
  }

  closeDetail(): void {
    this.detailPointId.set(null);
  }

  /** Los formularios sustituyen a la ficha: nunca se apilan dos ventanas. */
  openAlertForm(point: ReliefPoint): void {
    this.closeDetail();
    this.activeAction.set({ point, kind: 'alert' });
  }

  openMealForm(point: ReliefPoint): void {
    this.closeDetail();
    this.activeAction.set({ point, kind: 'meal' });
  }

  closeAction(): void {
    this.activeAction.set(null);
  }

  openPointForm(): void {
    this.showPointForm.set(true);
  }

  closePointForm(): void {
    this.showPointForm.set(false);
  }

  private portionsOf(pointId: string): number {
    return this.mealsOf(pointId).reduce((total, meal) => total + meal.portionsPlanned, 0);
  }
}
