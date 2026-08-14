import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { AlertStatus, UrgencyLevel } from '../constants/app.constants';
import { I18nService } from '../i18n/i18n.service';
import { ApiResponse } from '../interfaces/api-response.interface';
import { AidAlert, CreateAidAlertPayload } from '../models/aid-alert.model';
import { withRegionParams } from '../utils/region-params.util';
import { RealtimeService } from './realtime.service';
import { RegionService } from './region.service';

const ENDPOINT = '/api/alerts';
const SEVERITY_ORDER: Record<UrgencyLevel, number> = {
  [UrgencyLevel.CRITICAL]: 0,
  [UrgencyLevel.HIGH]: 1,
  [UrgencyLevel.MEDIUM]: 2,
  [UrgencyLevel.LOW]: 3,
};

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly http = inject(HttpClient);
  private readonly region = inject(RegionService);
  private readonly i18n = inject(I18nService);

  readonly alerts = signal<AidAlert[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  /**
   * Todas las alertas de la zona, atendidas incluidas: el banner se queda con las
   * activas y las novedades necesitan también las que ya se resolvieron.
   */
  readonly alertsInRegion = computed(() =>
    this.alerts().filter((alert) => this.region.matches(alert.reliefPoint)),
  );

  /**
   * Alertas activas de la zona seleccionada, primero las más graves y dentro de
   * cada nivel las más recientes. Sin zona elegida se ven las de todo el país.
   */
  readonly activeAlerts = computed(() =>
    this.alertsInRegion()
      .filter((alert) => alert.status === AlertStatus.ACTIVE)
      .sort(
        (first, second) =>
          SEVERITY_ORDER[first.severity] - SEVERITY_ORDER[second.severity] ||
          second.createdAt.localeCompare(first.createdAt),
      ),
  );

  constructor(realtime: RealtimeService) {
    realtime.listen<AidAlert>('/alerts', {
      'alert.created': (alert) => this.upsert(alert),
      'alert.updated': (alert) => this.upsert(alert),
      'alert.resolved': (alert) => this.upsert(alert),
    });
  }

  /** Trae las alertas de la zona en cualquier estado; quien las use decide qué filtra. */
  loadAlerts(): void {
    this.loading.set(true);
    const params = withRegionParams(new HttpParams(), this.region.selection());
    this.http.get<ApiResponse<AidAlert[]>>(ENDPOINT, { params }).subscribe({
      next: (response) => {
        this.alerts.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('alerts.loadError'));
        this.loading.set(false);
      },
    });
  }

  createAlert(payload: CreateAidAlertPayload): Observable<AidAlert> {
    return this.http.post<ApiResponse<AidAlert>>(ENDPOINT, payload).pipe(
      map((response) => response.data),
      tap((alert) => this.upsert(alert)),
    );
  }

  resolveAlert(id: string): Observable<AidAlert> {
    return this.http.patch<ApiResponse<AidAlert>>(`${ENDPOINT}/${id}/resolve`, {}).pipe(
      map((response) => response.data),
      tap((alert) => this.upsert(alert)),
    );
  }

  /**
   * Retira una sola necesidad de la alerta: lo demás se sigue pidiendo. Si era la
   * última, el servidor cierra la alerta y vuelve como atendida.
   */
  removeNeed(id: string, need: string): Observable<AidAlert> {
    return this.http
      .patch<ApiResponse<AidAlert>>(`${ENDPOINT}/${id}/needs/remove`, { need })
      .pipe(
        map((response) => response.data),
        tap((alert) => this.upsert(alert)),
      );
  }

  /** Alertas activas de un punto concreto. */
  activeAlertsOf(reliefPointId: string): AidAlert[] {
    return this.activeAlerts().filter((alert) => alert.reliefPointId === reliefPointId);
  }

  private upsert(alert: AidAlert): void {
    this.alerts.update((alerts) =>
      alerts.some((item) => item.id === alert.id)
        ? alerts.map((item) => (item.id === alert.id ? alert : item))
        : [alert, ...alerts],
    );
  }
}
