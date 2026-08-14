import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  MISSING_STATUSES,
  MISSING_SUBJECT_KINDS,
  MissingStatus,
  MissingSubjectKind,
} from '../../../core/constants/app.constants';
import {
  MISSING_KIND_ICONS,
  missingKindKey,
  missingStatusKey,
} from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { MissingRecord } from '../../../core/models/missing-record.model';
import { MissingService } from '../../../core/services/missing.service';
import { RegionService } from '../../../core/services/region.service';
import { ColombiaMap } from '../../../shared/colombia-map/colombia-map';
import { MapMarker } from '../../../shared/colombia-map/colombia-map.model';
import { ColombiaWatermark } from '../../../shared/colombia-watermark/colombia-watermark';
import { Modal } from '../../../shared/modal/modal';
import { MissingCard } from '../missing-card/missing-card';
import { MissingForm } from '../missing-form/missing-form';
import { toMapMarker } from '../missing-marker';

@Component({
  selector: 'app-missing-section',
  imports: [ColombiaMap, ColombiaWatermark, MissingCard, MissingForm, Modal],
  templateUrl: './missing-section.html',
  styleUrl: './missing-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissingSection {
  private readonly region = inject(RegionService);
  readonly missingService = inject(MissingService);

  protected readonly t = inject(I18nService).t;
  protected readonly kinds = MISSING_SUBJECT_KINDS;
  protected readonly statuses = MISSING_STATUSES;
  protected readonly kindKey = missingKindKey;
  protected readonly statusKey = missingStatusKey;
  protected readonly kindIcons = MISSING_KIND_ICONS;

  readonly search = signal('');
  readonly kindFilter = signal<'' | MissingSubjectKind>('');
  readonly statusFilter = signal<'' | MissingStatus>('');
  readonly showForm = signal(false);

  /** Búsquedas de la zona que pasan los filtros de texto, tipo y estado. */
  private readonly visibleRecords = computed(() => {
    const search = this.search().trim().toLowerCase();
    const kind = this.kindFilter();
    const status = this.statusFilter();
    return this.missingService.recordsInRegion().filter((record) => {
      const matchesText =
        !search ||
        [
          record.name,
          record.lastSeenPlace,
          record.municipality,
          record.department,
          record.description,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search);
      return (
        matchesText && (!kind || record.kind === kind) && (!status || record.status === status)
      );
    });
  });

  /** Los casos abiertos van primero; dentro de cada grupo, el avistamiento más reciente. */
  readonly records = computed(() =>
    [...this.visibleRecords()].sort(
      (first, second) =>
        this.searchingFirst(first) - this.searchingFirst(second) ||
        second.lastSeenAt.localeCompare(first.lastSeenAt),
    ),
  );

  readonly searchingCount = computed(
    () =>
      this.visibleRecords().filter((record) => record.status === MissingStatus.SEARCHING).length,
  );
  readonly peopleCount = computed(
    () =>
      this.visibleRecords().filter((record) => record.kind === MissingSubjectKind.PERSON).length,
  );
  readonly animalCount = computed(
    () =>
      this.visibleRecords().filter((record) => record.kind === MissingSubjectKind.ANIMAL).length,
  );
  readonly foundCount = computed(
    () => this.visibleRecords().filter((record) => record.status === MissingStatus.FOUND).length,
  );

  readonly selectedRecordId = signal<string | null>(null);

  /** Solo se pueden dibujar las búsquedas con un último avistamiento ubicado. */
  readonly mapMarkers = computed(() =>
    this.visibleRecords()
      .map(toMapMarker)
      .filter((marker): marker is MapMarker => marker !== null),
  );

  /** Búsqueda abierta desde el mapa, mientras siga pasando los filtros. */
  readonly selectedRecord = computed(
    () => this.visibleRecords().find((record) => record.id === this.selectedRecordId()) ?? null,
  );

  constructor() {
    effect(() => {
      this.region.selection();
      this.missingService.loadRecords();
    });
  }

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  /** El mapa abre la ficha de la búsqueda tocada, o la cierra al salir de ella. */
  selectRecord(marker: MapMarker | null): void {
    this.selectedRecordId.set(marker?.id ?? null);
  }

  selectKind(kind: '' | MissingSubjectKind): void {
    this.kindFilter.set(kind);
  }

  updateStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as '' | MissingStatus);
  }

  toggleForm(): void {
    this.showForm.update((open) => !open);
  }

  private searchingFirst(record: MissingRecord): number {
    return record.status === MissingStatus.SEARCHING ? 0 : 1;
  }
}
