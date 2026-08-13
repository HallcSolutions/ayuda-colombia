import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { I18nService } from '../i18n/i18n.service';
import { ApiResponse } from '../interfaces/api-response.interface';
import { CreateMealServicePayload, MealService } from '../models/meal-service.model';
import { toIsoDate } from '../utils/date.util';
import { withRegionParams } from '../utils/region-params.util';
import { RealtimeService } from './realtime.service';
import { RegionService } from './region.service';

const ENDPOINT = '/api/meal-services';

@Injectable({ providedIn: 'root' })
export class MealsService {
  private readonly http = inject(HttpClient);
  private readonly region = inject(RegionService);
  private readonly i18n = inject(I18nService);

  /** Día consultado; las jornadas en memoria corresponden a esta fecha. */
  readonly servedOn = signal(toIsoDate());
  readonly mealServices = signal<MealService[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  constructor(realtime: RealtimeService) {
    realtime.listen<MealService>('/meals', {
      'meal-service.created': (mealService) => this.upsert(mealService),
      'meal-service.updated': (mealService) => this.upsert(mealService),
    });
  }

  loadMealServices(servedOn: string = this.servedOn()): void {
    this.servedOn.set(servedOn);
    this.loading.set(true);
    const params = withRegionParams(
      new HttpParams().set('servedOn', servedOn),
      this.region.selection(),
    );
    this.http.get<ApiResponse<MealService[]>>(ENDPOINT, { params }).subscribe({
      next: (response) => {
        this.mealServices.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('meals.loadError'));
        this.loading.set(false);
      },
    });
  }

  createMealService(payload: CreateMealServicePayload): Observable<MealService> {
    return this.http.post<ApiResponse<MealService>>(ENDPOINT, payload).pipe(
      map((response) => response.data),
      tap((mealService) => this.upsert(mealService)),
    );
  }

  registerDeliveredPortions(id: string, portionsDelivered: number): Observable<MealService> {
    return this.http
      .patch<ApiResponse<MealService>>(`${ENDPOINT}/${id}`, { portionsDelivered })
      .pipe(
        map((response) => response.data),
        tap((mealService) => this.upsert(mealService)),
      );
  }

  /** Jornadas del día para un punto concreto. */
  mealServicesOf(reliefPointId: string): MealService[] {
    return this.mealServices().filter((mealService) => mealService.reliefPointId === reliefPointId);
  }

  private upsert(mealService: MealService): void {
    if (mealService.servedOn !== this.servedOn()) return;
    this.mealServices.update((services) =>
      services.some((item) => item.id === mealService.id)
        ? services.map((item) => (item.id === mealService.id ? mealService : item))
        : [...services, mealService].sort((first, second) =>
            first.startsAt.localeCompare(second.startsAt),
          ),
    );
  }
}
