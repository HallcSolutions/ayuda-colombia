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
  ReliefPointType,
} from '../../../core/constants/app.constants';
import {
  LODGING_KIND_ICONS,
  lodgingKindKey,
  lodgingStatusKey,
} from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslationKey } from '../../../core/i18n/es.translations';
import { LodgingOffer } from '../../../core/models/lodging-offer.model';
import { ReliefPoint } from '../../../core/models/relief-point.model';
import { LodgingService } from '../../../core/services/lodging.service';
import { RegionService } from '../../../core/services/region.service';
import { ReliefPointsService } from '../../../core/services/relief-points.service';
import { ColombiaMap } from '../../../shared/colombia-map/colombia-map';
import { MapMarker } from '../../../shared/colombia-map/colombia-map.model';
import { ColombiaWatermark } from '../../../shared/colombia-watermark/colombia-watermark';
import { Modal } from '../../../shared/modal/modal';
import { ReliefPointForm } from '../../relief-points/relief-point-form/relief-point-form';
import { toMapMarker as reliefPointToMapMarker } from '../../relief-points/relief-point-marker';
import { CarePlaceCard } from '../care-place-card/care-place-card';
import { LodgingCard } from '../lodging-card/lodging-card';
import { LodgingForm } from '../lodging-form/lodging-form';
import { toMapMarker } from '../lodging-marker';

/** La portada reúne todo; después se puede aislar dónde dormir, salud o veterinarias. */
export type PlaceGroup = 'all' | 'sleep' | 'health' | 'veterinary';

/** Un filtro de la fila de arriba: una clase de dormida o un tipo de atención. */
export interface PlaceFilter {
  id: string;
  icon: string;
  labelKey: TranslationKey;
  group: PlaceGroup;
  kind: '' | LodgingKind;
}

interface PlaceActionCard {
  imageSrc: string;
  imageAltKey: TranslationKey;
  eyebrowKey: TranslationKey;
  bodyKey: TranslationKey;
}

/**
 * Dormidas, salud y veterinarias se eligen en la misma fila: quien llega buscando una
 * veterinaria la encuentra donde busca, no en unas pestañas aparte más arriba.
 */
const PLACE_FILTERS: PlaceFilter[] = [
  { id: 'all', icon: '📍', labelKey: 'lodging.groupAll', group: 'all', kind: '' },
  { id: 'sleep', icon: '🛏️', labelKey: 'lodging.groupSleep', group: 'sleep', kind: '' },
  ...LODGING_KINDS.map((kind) => ({
    id: kind,
    icon: LODGING_KIND_ICONS[kind],
    labelKey: lodgingKindKey(kind),
    group: 'sleep' as const,
    kind,
  })),
  { id: 'health', icon: '🏥', labelKey: 'lodging.groupHealth', group: 'health', kind: '' as const },
  {
    id: 'veterinary',
    icon: '🐾',
    labelKey: 'lodging.groupVeterinary',
    group: 'veterinary',
    kind: '' as const,
  },
];

@Component({
  selector: 'app-lodging-section',
  imports: [
    CarePlaceCard,
    ColombiaMap,
    ColombiaWatermark,
    LodgingCard,
    LodgingForm,
    Modal,
    ReliefPointForm,
  ],
  templateUrl: './lodging-section.html',
  styleUrl: './lodging-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LodgingSection {
  private readonly region = inject(RegionService);
  readonly lodgingService = inject(LodgingService);
  readonly reliefPointsService = inject(ReliefPointsService);

  protected readonly t = inject(I18nService).t;
  protected readonly placeFilters = PLACE_FILTERS;
  protected readonly statuses = LODGING_STATUSES;
  protected readonly statusKey = lodgingStatusKey;

  /** La vista general no publica un tipo ambiguo: primero se elige una categoría. */
  readonly canPublish = computed(() => this.group() !== 'all');

  /** En "Dormir" se ofrece un cupo; en las otras dos se registra el sitio de atención. */
  readonly publishType = computed<ReliefPointType | null>(() => {
    if (this.group() === 'health') return ReliefPointType.MEDICAL_POST;
    if (this.group() === 'veterinary') return ReliefPointType.VETERINARY;
    return null;
  });

  readonly publishKey = computed<TranslationKey>(() => {
    if (this.group() === 'all' || this.group() === 'sleep') return 'lodging.publish';
    return this.group() === 'health' ? 'lodging.publishHealth' : 'lodging.publishVeterinary';
  });

  readonly publishTitleKey = computed<TranslationKey>(() => {
    if (this.group() === 'all' || this.group() === 'sleep') return 'lodgingForm.title';
    return this.group() === 'health'
      ? 'reliefPointForm.titleMedicalPost'
      : 'reliefPointForm.titleVeterinary';
  });

  readonly search = signal('');
  readonly kindFilter = signal<'' | LodgingKind>('');
  readonly statusFilter = signal<'' | LodgingStatus>('');
  readonly showForm = signal(false);
  /** Al entrar se ve la red completa; luego se puede escoger una categoría. */
  readonly group = signal<PlaceGroup>('all');

  readonly actionCard = computed<PlaceActionCard>(() => {
    if (this.group() === 'all') {
      return {
        imageSrc: '/assets/actions/redayuda-lodging-home.jpg',
        imageAltKey: 'lodging.actionAllImageAlt',
        eyebrowKey: 'lodging.actionAllEyebrow',
        bodyKey: 'lodging.actionAllBody',
      };
    }
    if (this.group() === 'health') {
      return {
        imageSrc: '/assets/actions/redayuda-health-post.jpg',
        imageAltKey: 'lodging.actionHealthImageAlt',
        eyebrowKey: 'lodging.actionHealthEyebrow',
        bodyKey: 'lodging.actionHealthBody',
      };
    }
    if (this.group() === 'veterinary') {
      return {
        imageSrc: '/assets/actions/redayuda-veterinary.jpg',
        imageAltKey: 'lodging.actionVeterinaryImageAlt',
        eyebrowKey: 'lodging.actionVeterinaryEyebrow',
        bodyKey: 'lodging.actionVeterinaryBody',
      };
    }
    return {
      imageSrc: '/assets/actions/redayuda-lodging-home.jpg',
      imageAltKey: 'lodging.actionSleepImageAlt',
      eyebrowKey: 'lodging.actionSleepEyebrow',
      bodyKey: 'lodging.actionSleepBody',
    };
  });

  /** El filtro marcado: la clase de dormida elegida o, si no hay ninguna, el grupo. */
  readonly selectedPlace = computed(() =>
    this.group() === 'sleep' ? this.kindFilter() || 'sleep' : this.group(),
  );

  /**
   * Los sitios de salud y veterinaria son puntos de ayuda del directorio, no dormidas:
   * se agrupan aquí porque quien llega a esta pantalla busca "a dónde voy", y el
   * buscador de arriba también los filtra.
   */
  private readonly carePlaces = computed(() => {
    const search = this.search().trim().toLowerCase();
    const group = this.group();
    return this.reliefPointsService
      .pointsInRegion()
      .filter((point) => {
        if (group === 'health') return point.type === ReliefPointType.MEDICAL_POST;
        if (group === 'veterinary') return point.type === ReliefPointType.VETERINARY;
        return (
          group === 'all' &&
          [ReliefPointType.MEDICAL_POST, ReliefPointType.VETERINARY].includes(point.type)
        );
      })
      .filter(
        (point) =>
          !search ||
          [point.name, point.addressReference, point.municipality, point.department, point.notes]
            .join(' ')
            .toLowerCase()
            .includes(search),
      );
  });

  /** Primero los sitios comprobados: son a los que se puede mandar a alguien de noche. */
  readonly visibleCarePlaces = computed<ReliefPoint[]>(() =>
    [...this.carePlaces()].sort(
      (first, second) => this.verifiedFirst(first) - this.verifiedFirst(second),
    ),
  );
  readonly visibleHealthPlaces = computed(() =>
    this.visibleCarePlaces().filter((point) => point.type === ReliefPointType.MEDICAL_POST),
  );
  readonly visibleVeterinaryPlaces = computed(() =>
    this.visibleCarePlaces().filter((point) => point.type === ReliefPointType.VETERINARY),
  );

  /** Alojamientos de la zona que pasan los filtros de texto, tipo y estado. */
  private readonly visibleOffers = computed(() => {
    const search = this.search().trim().toLowerCase();
    if (!['all', 'sleep'].includes(this.group())) return [];
    const kind = this.group() === 'sleep' ? this.kindFilter() : '';
    const status = this.group() === 'sleep' ? this.statusFilter() : '';
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

  /** Contadores de portada: representan toda la zona, no el filtro de texto. */
  private readonly carePlacesInRegion = computed(() =>
    this.reliefPointsService
      .pointsInRegion()
      .filter((point) =>
        [ReliefPointType.MEDICAL_POST, ReliefPointType.VETERINARY].includes(point.type),
      ),
  );

  readonly totalPlacesCount = computed(
    () => this.lodgingService.offersInRegion().length + this.carePlacesInRegion().length,
  );
  readonly lodgingPlacesCount = computed(() => this.lodgingService.offersInRegion().length);
  readonly healthPlacesCount = computed(
    () =>
      this.carePlacesInRegion().filter((point) => point.type === ReliefPointType.MEDICAL_POST)
        .length,
  );
  readonly veterinaryPlacesCount = computed(
    () =>
      this.carePlacesInRegion().filter((point) => point.type === ReliefPointType.VETERINARY).length,
  );

  readonly selectedPlaceId = signal<string | null>(null);

  /** La portada dibuja juntos alojamientos ubicados, salud y veterinarias. */
  readonly mapMarkers = computed(() => {
    const lodgingMarkers = this.visibleOffers()
      .map(toMapMarker)
      .filter((marker): marker is MapMarker => marker !== null);
    const careMarkers = this.visibleCarePlaces().map((point) =>
      reliefPointToMapMarker(point, false),
    );
    return [...lodgingMarkers, ...careMarkers];
  });

  /** Ficha abierta desde el mapa, mientras siga pasando los filtros. */
  readonly selectedOffer = computed(
    () => this.visibleOffers().find((offer) => offer.id === this.selectedPlaceId()) ?? null,
  );
  readonly selectedCarePlace = computed(
    () => this.visibleCarePlaces().find((place) => place.id === this.selectedPlaceId()) ?? null,
  );

  constructor() {
    effect(() => {
      this.region.selection();
      this.lodgingService.loadOffers();
      this.reliefPointsService.loadPoints();
    });
  }

  /** Cambiar de grupo cierra el formulario: lo que se registra ya no es lo mismo. */
  private selectGroup(group: PlaceGroup): void {
    this.group.set(group);
    this.selectedPlaceId.set(null);
    this.showForm.set(false);
  }

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  selectMapPlace(marker: MapMarker | null): void {
    this.selectedPlaceId.set(marker?.id ?? null);
  }

  /** Cambiar de grupo arrastra sus efectos; quedarse dentro de las dormidas, no. */
  selectPlace(filter: PlaceFilter): void {
    if (filter.group !== this.group()) this.selectGroup(filter.group);
    this.kindFilter.set(filter.kind);
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

  private verifiedFirst(place: ReliefPoint): number {
    return place.verifiedBy ? 0 : 1;
  }
}
