import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiResponse } from '../interfaces/api-response.interface';
import { NeedsDigest } from '../models/needs-digest.model';
import { RealtimeService } from './realtime.service';
import { RegionService } from './region.service';

const ENDPOINT = '/api/monitoring/digest';

/**
 * El resumen que arma el chequeo periódico del backend. Llega entero y nacional; la
 * zona elegida se aplica aquí, porque el resumen se calcula una vez para todo el país.
 */
@Injectable({ providedIn: 'root' })
export class MonitoringService {
  private readonly http = inject(HttpClient);
  private readonly region = inject(RegionService);

  readonly digest = signal<NeedsDigest | null>(null);

  readonly newPoints = computed(() =>
    (this.digest()?.newPoints ?? []).filter((point) => this.region.matches(point)),
  );

  /** Puntos con necesidades abiertas, ya ordenados por gravedad desde el backend. */
  readonly pointsNeedingHelp = computed(() =>
    (this.digest()?.points ?? []).filter((entry) => this.region.matches(entry.point)),
  );

  readonly findings = computed(() =>
    (this.digest()?.findings ?? []).filter((finding) => this.region.matches(finding.point)),
  );

  readonly criticalAlerts = computed(() =>
    this.pointsNeedingHelp().reduce((total, entry) => total + entry.criticalAlerts, 0),
  );

  readonly activeAlerts = computed(() =>
    this.pointsNeedingHelp().reduce((total, entry) => total + entry.activeAlerts, 0),
  );

  constructor(realtime: RealtimeService) {
    realtime.listen<NeedsDigest>('/monitoring', {
      'digest.created': (digest) => this.digest.set(digest),
    });
  }

  loadDigest(): void {
    this.http.get<ApiResponse<NeedsDigest>>(ENDPOINT).subscribe({
      next: (response) => this.digest.set(response.data),
      // Mientras no se haya generado el primero, el panel simplemente no aparece:
      // no hay nada que arreglar ni nada que avisarle a quien entra a pedir ayuda.
      error: () => this.digest.set(null),
    });
  }
}
