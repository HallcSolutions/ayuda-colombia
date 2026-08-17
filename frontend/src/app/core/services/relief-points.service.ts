import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ReliefPointStatus } from '../constants/app.constants';
import { I18nService } from '../i18n/i18n.service';
import { ApiResponse } from '../interfaces/api-response.interface';
import { CreateReliefPointPayload, ReliefPoint } from '../models/relief-point.model';
import { withRegionParams } from '../utils/region-params.util';
import { RealtimeService } from './realtime.service';
import { RegionService } from './region.service';

const ENDPOINT = '/api/relief-points';

@Injectable({ providedIn: 'root' })
export class ReliefPointsService {
  private readonly http = inject(HttpClient);
  private readonly region = inject(RegionService);
  private readonly i18n = inject(I18nService);

  readonly points = signal<ReliefPoint[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  /** Puntos dentro de la zona seleccionada (todo el país si no hay filtro). */
  readonly pointsInRegion = computed(() =>
    this.points().filter((point) => this.region.matches(point)),
  );

  constructor(realtime: RealtimeService) {
    realtime.listen<ReliefPoint>('/relief-points', {
      'relief-point.created': (point) => this.upsert(point),
      'relief-point.updated': (point) => this.upsert(point),
    });
  }

  loadPoints(): void {
    this.loading.set(true);
    const params = withRegionParams(new HttpParams(), this.region.selection());
    this.http.get<ApiResponse<ReliefPoint[]>>(ENDPOINT, { params }).subscribe({
      next: (response) => {
        this.points.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('reliefPoints.loadError'));
        this.loading.set(false);
      },
    });
  }

  createPoint(payload: CreateReliefPointPayload): Observable<ReliefPoint> {
    return this.http.post<ApiResponse<ReliefPoint>>(ENDPOINT, payload).pipe(
      map((response) => response.data),
      tap((point) => this.upsert(point)),
    );
  }

  /** Trae una ficha aunque el visitante tenga otro departamento seleccionado. */
  loadPoint(id: string): Observable<ReliefPoint> {
    return this.http.get<ApiResponse<ReliefPoint>>(`${ENDPOINT}/${id}`).pipe(
      map((response) => response.data),
      tap((point) => this.upsert(point)),
    );
  }

  changeStatus(id: string, status: ReliefPointStatus): Observable<ReliefPoint> {
    return this.http.patch<ApiResponse<ReliefPoint>>(`${ENDPOINT}/${id}`, { status }).pipe(
      map((response) => response.data),
      tap((point) => this.upsert(point)),
    );
  }

  /** Municipios conocidos del departamento indicado, para armar los filtros. */
  municipalitiesOf(department: string): string[] {
    const municipalities = this.points()
      .filter((point) => !department || point.department === department)
      .map((point) => point.municipality);
    return [...new Set(municipalities)].sort((first, second) => first.localeCompare(second));
  }

  private upsert(point: ReliefPoint): void {
    this.points.update((points) =>
      points.some((item) => item.id === point.id)
        ? points.map((item) => (item.id === point.id ? point : item))
        : [...points, point].sort(
            (first, second) =>
              first.department.localeCompare(second.department) ||
              first.municipality.localeCompare(second.municipality) ||
              first.name.localeCompare(second.name),
          ),
    );
  }
}
