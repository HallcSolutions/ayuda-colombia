import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  LODGING_KINDS,
  LODGING_STATUSES,
  LodgingKind,
  LodgingStatus,
} from '../../../core/constants/app.constants';
import {
  LODGING_KIND_ICONS,
  lodgingKindKey,
  lodgingStatusKey,
} from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { LodgingOffer } from '../../../core/models/lodging-offer.model';
import { LodgingService } from '../../../core/services/lodging.service';
import { RegionService } from '../../../core/services/region.service';
import { ColombiaMap } from '../../../shared/colombia-map/colombia-map';
import { MapMarker } from '../../../shared/colombia-map/colombia-map.model';
import { Modal } from '../../../shared/modal/modal';
import { LodgingCard } from '../lodging-card/lodging-card';
import { LodgingForm } from '../lodging-form/lodging-form';
import { toMapMarker } from '../lodging-marker';

@Component({
  selector: 'app-lodging-section',
  imports: [ColombiaMap, LodgingCard, LodgingForm, Modal],
  templateUrl: './lodging-section.html',
  styleUrl: './lodging-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LodgingSection {
  private readonly region = inject(RegionService);
  readonly lodgingService = inject(LodgingService);

  protected readonly t = inject(I18nService).t;
  protected readonly kinds = LODGING_KINDS;
  protected readonly statuses = LODGING_STATUSES;
  protected readonly kindKey = lodgingKindKey;
  protected readonly statusKey = lodgingStatusKey;
  protected readonly kindIcons = LODGING_KIND_ICONS;

  readonly search = signal('');
  readonly kindFilter = signal<'' | LodgingKind>('');
  readonly statusFilter = signal<'' | LodgingStatus>('');
  readonly showForm = signal(false);

  /** Alojamientos de la zona que pasan los filtros de texto, tipo y estado. */
  private readonly visibleOffers = computed(() => {
    const search = this.search().trim().toLowerCase();
    const kind = this.kindFilter();
    const status = this.statusFilter();
    return this.lodgingService.offersInRegion().filter((offer) => {
      const matchesText =
        !search ||
        [offer.placeName, offer.addressReference, offer.municipality, offer.department, offer.notes]
          .join(' ')
          .toLowerCase()
          .includes(search);
      return matchesText && (!kind || offer.kind === kind) && (!status || offer.status === status);
    });
  });

  /** Primero los que tienen cupos libres; entre ellos, el que más ofrece. */
  readonly offers = computed(() =>
    [...this.visibleOffers()].sort(
      (first, second) =>
        this.availableFirst(first) - this.availableFirst(second) ||
        second.availableSpaces - first.availableSpaces,
    ),
  );

  readonly freeSpaces = computed(() =>
    this.availableOffers().reduce((total, offer) => total + offer.availableSpaces, 0),
  );
  readonly offersCount = computed(() => this.availableOffers().length);
  readonly hostedPeople = computed(() =>
    this.visibleOffers().reduce((total, offer) => total + offer.occupiedSpaces, 0),
  );
  readonly fullCount = computed(
    () => this.visibleOffers().filter((offer) => offer.status === LodgingStatus.FULL).length,
  );

  readonly selectedOfferId = signal<string | null>(null);

  /** Solo se pueden dibujar los alojamientos con el punto marcado. */
  readonly mapMarkers = computed(() =>
    this.visibleOffers()
      .map(toMapMarker)
      .filter((marker): marker is MapMarker => marker !== null),
  );

  /** Alojamiento abierto desde el mapa, mientras siga pasando los filtros. */
  readonly selectedOffer = computed(
    () => this.visibleOffers().find((offer) => offer.id === this.selectedOfferId()) ?? null,
  );

  constructor() {
    effect(() => {
      this.region.selection();
      this.lodgingService.loadOffers();
    });
  }

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  selectOffer(marker: MapMarker | null): void {
    this.selectedOfferId.set(marker?.id ?? null);
  }

  selectKind(kind: '' | LodgingKind): void {
    this.kindFilter.set(kind);
  }

  updateStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as '' | LodgingStatus);
  }

  toggleForm(): void {
    this.showForm.update((open) => !open);
  }

  private availableOffers(): LodgingOffer[] {
    return this.visibleOffers().filter((offer) => offer.status === LodgingStatus.AVAILABLE);
  }

  private availableFirst(offer: LodgingOffer): number {
    return offer.status === LodgingStatus.AVAILABLE ? 0 : 1;
  }
}
