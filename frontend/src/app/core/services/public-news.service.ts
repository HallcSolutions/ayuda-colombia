import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { PublicNewsStatus } from '../constants/app.constants';
import { I18nService } from '../i18n/i18n.service';
import { ApiResponse } from '../interfaces/api-response.interface';
import { CreatePublicNewsPayload, PublicNewsItem } from '../models/public-news.model';
import { withRegionParams } from '../utils/region-params.util';
import { RealtimeService } from './realtime.service';
import { RegionService } from './region.service';

const ENDPOINT = '/api/news';

@Injectable({ providedIn: 'root' })
export class PublicNewsService {
  private readonly http = inject(HttpClient);
  private readonly region = inject(RegionService);
  private readonly i18n = inject(I18nService);

  readonly items = signal<PublicNewsItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  constructor(realtime: RealtimeService) {
    realtime.listen<PublicNewsItem>('/news', {
      'news.created': (item) => this.upsert(item),
      'news.updated': (item) => this.upsert(item),
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const params = withRegionParams(new HttpParams(), this.region.selection());
    this.http.get<ApiResponse<PublicNewsItem[]>>(ENDPOINT, { params }).subscribe({
      next: (response) => {
        this.items.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('publicNews.loadError'));
        this.loading.set(false);
      },
    });
  }

  create(payload: CreatePublicNewsPayload, publisherKey: string): Observable<PublicNewsItem> {
    const headers = new HttpHeaders({ 'x-news-publisher-key': publisherKey });
    return this.http.post<ApiResponse<PublicNewsItem>>(ENDPOINT, payload, { headers }).pipe(
      map((response) => response.data),
      tap((item) => this.upsert(item)),
    );
  }

  municipalitiesOf(department: string): string[] {
    const municipalities = this.items()
      .filter((item) => item.department === department && item.municipality)
      .map((item) => item.municipality);
    return [...new Set(municipalities)].sort((a, b) => a.localeCompare(b));
  }

  private upsert(item: PublicNewsItem): void {
    this.items.update((items) => {
      const current = items.filter((existing) => existing.id !== item.id);
      if (
        item.status !== PublicNewsStatus.PUBLISHED ||
        (item.validUntil !== null && item.validUntil < new Date().toISOString())
      ) {
        return current;
      }
      return [...current, item].sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) || b.publishedAt.localeCompare(a.publishedAt),
      );
    });
  }
}
