import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { MissingStatus } from '../constants/app.constants';
import { I18nService } from '../i18n/i18n.service';
import { ApiResponse } from '../interfaces/api-response.interface';
import { MissingRecord, PublishedMissingRecord } from '../models/missing-record.model';
import { withRegionParams } from '../utils/region-params.util';
import { RealtimeService } from './realtime.service';
import { RegionService } from './region.service';

const ENDPOINT = '/api/missing';

@Injectable({ providedIn: 'root' })
export class MissingService {
  private readonly http = inject(HttpClient);
  private readonly region = inject(RegionService);
  private readonly i18n = inject(I18nService);

  readonly records = signal<MissingRecord[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  /** Búsquedas de la zona seleccionada (todo el país si no hay filtro). */
  readonly recordsInRegion = computed(() =>
    this.records().filter((record) => this.region.matches(record)),
  );

  constructor(realtime: RealtimeService) {
    realtime.listen<MissingRecord>('/missing', {
      'missing.created': (record) => this.upsert(record),
      'missing.updated': (record) => this.upsert(record),
    });
  }

  loadRecords(): void {
    this.loading.set(true);
    const params = withRegionParams(new HttpParams(), this.region.selection());
    this.http.get<ApiResponse<MissingRecord[]>>(ENDPOINT, { params }).subscribe({
      next: (response) => {
        this.records.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('missing.loadError'));
        this.loading.set(false);
      },
    });
  }

  createRecord(payload: FormData): Observable<PublishedMissingRecord> {
    return this.http.post<ApiResponse<PublishedMissingRecord>>(ENDPOINT, payload).pipe(
      map((response) => response.data),
      tap((record) => this.upsert(record)),
    );
  }

  /** Editar exige el PIN que se entregó al publicar: solo lo tiene quien creó el aviso. */
  changeStatus(id: string, status: MissingStatus, editPin: string): Observable<MissingRecord> {
    return this.http
      .patch<ApiResponse<MissingRecord>>(
        `${ENDPOINT}/${id}`,
        { status },
        { headers: { 'x-missing-pin': editPin } },
      )
      .pipe(
        map((response) => response.data),
        tap((record) => this.upsert(record)),
      );
  }

  private upsert(record: MissingRecord): void {
    this.records.update((records) =>
      records.some((item) => item.id === record.id)
        ? records.map((item) => (item.id === record.id ? record : item))
        : [record, ...records],
    );
  }
}
