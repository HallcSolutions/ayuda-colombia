import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ReportStatus } from '../constants/app.constants';
import { I18nService } from '../i18n/i18n.service';
import { ApiResponse } from '../interfaces/api-response.interface';
import { HouseReport } from '../models/house-report.model';
import { withRegionParams } from '../utils/region-params.util';
import { RealtimeService } from './realtime.service';
import { RegionService } from './region.service';

const ENDPOINT = '/api/reports';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly region = inject(RegionService);
  private readonly i18n = inject(I18nService);

  readonly reports = signal<HouseReport[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  /** Reportes de la zona seleccionada (todo el país si no hay filtro). */
  readonly reportsInRegion = computed(() =>
    this.reports().filter((report) => this.region.matches(report)),
  );

  constructor(realtime: RealtimeService) {
    realtime.listen<HouseReport>('/reports', {
      'report.created': (report) => this.upsert(report),
      'report.updated': (report) => this.upsert(report),
    });
  }

  loadReports(): void {
    this.loading.set(true);
    const params = withRegionParams(new HttpParams(), this.region.selection());
    this.http.get<ApiResponse<HouseReport[]>>(ENDPOINT, { params }).subscribe({
      next: (response) => {
        this.reports.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('feed.loadError'));
        this.loading.set(false);
      },
    });
  }

  createReport(payload: FormData): Observable<HouseReport> {
    return this.http
      .post<ApiResponse<HouseReport>>(ENDPOINT, payload)
      .pipe(map((response) => response.data));
  }

  updateStatus(id: string, status: ReportStatus): Observable<HouseReport> {
    return this.http
      .patch<ApiResponse<HouseReport>>(`${ENDPOINT}/${id}`, { status })
      .pipe(map((response) => response.data));
  }

  private upsert(report: HouseReport): void {
    this.reports.update((reports) =>
      reports.some((item) => item.id === report.id)
        ? reports.map((item) => (item.id === report.id ? report : item))
        : [report, ...reports],
    );
  }
}
