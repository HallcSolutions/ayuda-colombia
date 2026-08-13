import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CONVOY_STATUSES, ConvoyStatus } from '../../../core/constants/app.constants';
import { convoyStatusKey } from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { ConvoyTrip } from '../../../core/models/convoy-trip.model';
import { ConvoysService } from '../../../core/services/convoys.service';
import { RegionService } from '../../../core/services/region.service';
import { ReliefPointsService } from '../../../core/services/relief-points.service';
import { ColombiaMap } from '../../../shared/colombia-map/colombia-map';
import { MapMarker } from '../../../shared/colombia-map/colombia-map.model';
import { Modal } from '../../../shared/modal/modal';
import { ConvoyCard } from '../convoy-card/convoy-card';
import { ConvoyForm } from '../convoy-form/convoy-form';
import { ConvoyTracker } from '../convoy-tracker/convoy-tracker';
import { toMapMarker, toMapTrails } from '../convoy-marker';

/** Cada cuánto se refrescan los «faltan…» de las tarjetas cuando nadie manda señales. */
const CLOCK_INTERVAL_MS = 30_000;

/** Los que vienen en camino se leen primero; después los que están por salir. */
const STATUS_ORDER: Record<ConvoyStatus, number> = {
  [ConvoyStatus.EN_ROUTE]: 0,
  [ConvoyStatus.SCHEDULED]: 1,
  [ConvoyStatus.PAUSED]: 2,
  [ConvoyStatus.ARRIVED]: 3,
  [ConvoyStatus.CANCELLED]: 4,
};

@Component({
  selector: 'app-convoys-section',
  imports: [ColombiaMap, ConvoyCard, ConvoyForm, ConvoyTracker, Modal],
  templateUrl: './convoys-section.html',
  styleUrl: './convoys-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConvoysSection {
  private readonly region = inject(RegionService);
  private readonly reliefPoints = inject(ReliefPointsService);
  readonly convoysService = inject(ConvoysService);

  protected readonly t = inject(I18nService).t;
  protected readonly statuses = CONVOY_STATUSES;
  protected readonly statusKey = convoyStatusKey;

  readonly statusFilter = signal<'' | ConvoyStatus>('');
  readonly showForm = signal(false);
  readonly selectedTripId = signal<string | null>(null);
  /** Reloj compartido por las tarjetas: un solo temporizador para toda la sección. */
  readonly now = signal(Date.now());

  private readonly visibleTrips = computed(() => {
    const status = this.statusFilter();
    return this.convoysService.tripsInRegion().filter((trip) => !status || trip.status === status);
  });

  readonly trips = computed(() =>
    [...this.visibleTrips()].sort(
      (first, second) =>
        STATUS_ORDER[first.status] - STATUS_ORDER[second.status] ||
        this.etaTime(first) - this.etaTime(second),
    ),
  );

  readonly enRouteCount = computed(() => this.countByStatus(ConvoyStatus.EN_ROUTE));
  readonly scheduledCount = computed(() => this.countByStatus(ConvoyStatus.SCHEDULED));
  readonly arrivedCount = computed(() => this.countByStatus(ConvoyStatus.ARRIVED));
  readonly trackedCount = computed(
    () => this.visibleTrips().filter((trip) => trip.position !== null).length,
  );

  /** Solo se dibujan los camiones que autorizaron compartir su ubicación. */
  readonly mapMarkers = computed(() =>
    this.visibleTrips()
      .map(toMapMarker)
      .filter((marker): marker is MapMarker => marker !== null),
  );

  readonly mapTrails = computed(() => this.visibleTrips().flatMap(toMapTrails));

  readonly selectedTrip = computed(
    () => this.visibleTrips().find((trip) => trip.id === this.selectedTripId()) ?? null,
  );

  constructor() {
    effect(() => {
      this.region.selection();
      this.convoysService.loadTrips();
      // Los destinos posibles del formulario son los puntos ya registrados en la zona.
      this.reliefPoints.loadPoints();
    });

    const clock = setInterval(() => this.now.set(Date.now()), CLOCK_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(clock));
  }

  /** El mapa abre la ficha del camión tocado, o la cierra al salir de él. */
  selectTrip(marker: MapMarker | null): void {
    this.selectedTripId.set(marker?.id ?? null);
  }

  updateStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as '' | ConvoyStatus);
  }

  toggleForm(): void {
    this.showForm.update((open) => !open);
  }

  private countByStatus(status: ConvoyStatus): number {
    return this.visibleTrips().filter((trip) => trip.status === status).length;
  }

  /** Sin hora estimada, el viaje va al final de su grupo. */
  private etaTime(trip: ConvoyTrip): number {
    return trip.etaAt ? new Date(trip.etaAt).getTime() : Number.MAX_SAFE_INTEGER;
  }
}
