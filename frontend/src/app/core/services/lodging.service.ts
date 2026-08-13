import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { LodgingStatus } from '../constants/app.constants';
import { I18nService } from '../i18n/i18n.service';
import { ApiResponse } from '../interfaces/api-response.interface';
import {
  LodgingOffer,
  NewLodgingOffer,
  PublishedLodgingOffer,
} from '../models/lodging-offer.model';
import { withRegionParams } from '../utils/region-params.util';
import { RealtimeService } from './realtime.service';
import { RegionService } from './region.service';

const ENDPOINT = '/api/lodging';

/** Cabecera con el PIN que recibió quien publicó el alojamiento. */
const pinHeader = (editPin: string) => ({ headers: { 'x-lodging-pin': editPin } });

@Injectable({ providedIn: 'root' })
export class LodgingService {
  private readonly http = inject(HttpClient);
  private readonly region = inject(RegionService);
  private readonly i18n = inject(I18nService);

  readonly offers = signal<LodgingOffer[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  /** Alojamientos de la zona seleccionada (todo el país si no hay filtro). */
  readonly offersInRegion = computed(() =>
    this.offers().filter((offer) => this.region.matches(offer)),
  );

  /** Cupos libres de la zona: la cifra que busca quien necesita dónde dormir. */
  readonly availableSpaces = computed(() =>
    this.offersInRegion()
      .filter((offer) => offer.status === LodgingStatus.AVAILABLE)
      .reduce((total, offer) => total + offer.availableSpaces, 0),
  );

  constructor(realtime: RealtimeService) {
    realtime.listen<LodgingOffer>('/lodging', {
      'lodging.created': (offer) => this.upsert(offer),
      'lodging.updated': (offer) => this.upsert(offer),
    });
  }

  loadOffers(): void {
    this.loading.set(true);
    const params = withRegionParams(new HttpParams(), this.region.selection());
    this.http.get<ApiResponse<LodgingOffer[]>>(ENDPOINT, { params }).subscribe({
      next: (response) => {
        this.offers.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('lodging.loadError'));
        this.loading.set(false);
      },
    });
  }

  createOffer(payload: NewLodgingOffer): Observable<PublishedLodgingOffer> {
    return this.http.post<ApiResponse<PublishedLodgingOffer>>(ENDPOINT, payload).pipe(
      map((response) => response.data),
      tap((offer) => this.upsert(offer)),
    );
  }

  /**
   * Mueve los cupos ocupados: positivo cuando llega gente a dormir y negativo
   * cuando se van. Exige el PIN que se entregó al publicar.
   */
  changeOccupancy(id: string, delta: number, editPin: string): Observable<LodgingOffer> {
    return this.http
      .patch<ApiResponse<LodgingOffer>>(
        `${ENDPOINT}/${id}/occupancy`,
        { delta },
        pinHeader(editPin),
      )
      .pipe(
        map((response) => response.data),
        tap((offer) => this.upsert(offer)),
      );
  }

  changeStatus(id: string, status: LodgingStatus, editPin: string): Observable<LodgingOffer> {
    return this.http
      .patch<ApiResponse<LodgingOffer>>(`${ENDPOINT}/${id}`, { status }, pinHeader(editPin))
      .pipe(
        map((response) => response.data),
        tap((offer) => this.upsert(offer)),
      );
  }

  private upsert(offer: LodgingOffer): void {
    this.offers.update((offers) =>
      offers.some((item) => item.id === offer.id)
        ? offers.map((item) => (item.id === offer.id ? offer : item))
        : [offer, ...offers],
    );
  }
}
