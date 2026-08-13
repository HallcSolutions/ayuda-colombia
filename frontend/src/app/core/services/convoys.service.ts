import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { I18nService } from '../i18n/i18n.service';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Coordinates } from '../models/coordinates.model';
import {
  ConvoyTrip,
  CreateConvoyTripPayload,
  PublishedConvoyTrip,
  UpdateConvoyTripPayload,
} from '../models/convoy-trip.model';
import { withRegionParams } from '../utils/region-params.util';
import { RealtimeService } from './realtime.service';
import { RegionService } from './region.service';

const ENDPOINT = '/api/convoys';

@Injectable({ providedIn: 'root' })
export class ConvoysService {
  private readonly http = inject(HttpClient);
  private readonly region = inject(RegionService);
  private readonly i18n = inject(I18nService);

  readonly trips = signal<ConvoyTrip[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  /** Viajes que llegan a la zona seleccionada (todo el país si no hay filtro). */
  readonly tripsInRegion = computed(() =>
    this.trips().filter((trip) => this.region.matches(trip.destination)),
  );

  constructor(realtime: RealtimeService) {
    realtime.listen<ConvoyTrip>('/convoys', {
      'convoy.created': (trip) => this.upsert(trip),
      'convoy.moved': (trip) => this.upsert(trip),
      'convoy.updated': (trip) => this.upsert(trip),
    });
  }

  loadTrips(): void {
    this.loading.set(true);
    const params = withRegionParams(new HttpParams(), this.region.selection());
    this.http.get<ApiResponse<ConvoyTrip[]>>(ENDPOINT, { params }).subscribe({
      next: (response) => {
        this.trips.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('convoys.loadError'));
        this.loading.set(false);
      },
    });
  }

  announceTrip(payload: CreateConvoyTripPayload): Observable<PublishedConvoyTrip> {
    return this.http.post<ApiResponse<PublishedConvoyTrip>>(ENDPOINT, payload).pipe(
      map((response) => response.data),
      tap((trip) => this.upsert(trip)),
    );
  }

  /** Señal de posición del camión; solo la acepta quien tiene el PIN del viaje. */
  sendPing(id: string, position: Coordinates, editPin: string): Observable<ConvoyTrip> {
    return this.send(`${ENDPOINT}/${id}/pings`, position, editPin, 'post');
  }

  updateTrip(
    id: string,
    changes: UpdateConvoyTripPayload,
    editPin: string,
  ): Observable<ConvoyTrip> {
    return this.send(`${ENDPOINT}/${id}`, changes, editPin, 'patch');
  }

  private send(
    url: string,
    body: object,
    editPin: string,
    method: 'post' | 'patch',
  ): Observable<ConvoyTrip> {
    const options = { headers: { 'x-convoy-pin': editPin } };
    const request =
      method === 'post'
        ? this.http.post<ApiResponse<ConvoyTrip>>(url, body, options)
        : this.http.patch<ApiResponse<ConvoyTrip>>(url, body, options);
    return request.pipe(
      map((response) => response.data),
      tap((trip) => this.upsert(trip)),
    );
  }

  private upsert(trip: ConvoyTrip): void {
    this.trips.update((trips) =>
      trips.some((item) => item.id === trip.id)
        ? trips.map((item) => (item.id === trip.id ? trip : item))
        : [trip, ...trips],
    );
  }
}
