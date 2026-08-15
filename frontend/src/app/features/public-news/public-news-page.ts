import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { PUBLIC_NEWS_CATEGORIES, PublicNewsCategory } from '../../core/constants/app.constants';
import { COLOMBIA_DEPARTMENTS } from '../../core/constants/colombia.constants';
import { publicNewsCategoryKey } from '../../core/i18n/domain-keys';
import { I18nService } from '../../core/i18n/i18n.service';
import { PublicNewsItem } from '../../core/models/public-news.model';
import { PublicNewsService } from '../../core/services/public-news.service';
import { RegionService } from '../../core/services/region.service';
import { COLOMBIA_UTC_OFFSET } from '../../core/utils/date.util';
import { ColombiaWatermark } from '../../shared/colombia-watermark/colombia-watermark';
import { Modal } from '../../shared/modal/modal';
import { PublicNewsForm } from './public-news-form/public-news-form';

@Component({
  selector: 'app-public-news-page',
  imports: [DatePipe, ColombiaWatermark, Modal, PublicNewsForm],
  templateUrl: './public-news-page.html',
  styleUrl: './public-news-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicNewsPage {
  readonly newsService = inject(PublicNewsService);
  readonly region = inject(RegionService);
  readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly departments = COLOMBIA_DEPARTMENTS;
  protected readonly categories = PUBLIC_NEWS_CATEGORIES;
  protected readonly categoryKey = publicNewsCategoryKey;
  protected readonly colombiaTime = COLOMBIA_UTC_OFFSET;

  readonly search = signal('');
  readonly category = signal<'' | PublicNewsCategory>('');
  readonly showEditor = signal(false);

  readonly municipalities = computed(() =>
    this.newsService.municipalitiesOf(this.region.department()),
  );

  readonly visibleItems = computed(() => {
    const search = this.search().trim().toLocaleLowerCase('es');
    const category = this.category();
    return this.newsService.items().filter((item) => {
      const matchesText =
        !search ||
        [item.title, item.summary, item.department, item.municipality, item.sourceName]
          .join(' ')
          .toLocaleLowerCase('es')
          .includes(search);
      return matchesText && (!category || item.category === category);
    });
  });

  readonly verifiedCount = computed(
    () => this.visibleItems().filter((item) => !this.isExpired(item)).length,
  );

  readonly departmentCount = computed(
    () =>
      new Set(
        this.visibleItems()
          .map((item) => item.department)
          .filter(Boolean),
      ).size,
  );

  readonly municipalityCount = computed(
    () =>
      new Set(
        this.visibleItems()
          .map((item) => item.municipality)
          .filter(Boolean),
      ).size,
  );

  readonly sourceCount = computed(
    () => new Set(this.visibleItems().map((item) => item.sourceName)).size,
  );

  constructor() {
    effect(() => {
      this.region.selection();
      this.newsService.load();
    });
  }

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  updateCategory(event: Event): void {
    this.category.set((event.target as HTMLSelectElement).value as '' | PublicNewsCategory);
  }

  updateDepartment(event: Event): void {
    this.region.setDepartment((event.target as HTMLSelectElement).value);
  }

  updateMunicipality(event: Event): void {
    this.region.setMunicipality((event.target as HTMLSelectElement).value);
  }

  toggleEditor(): void {
    this.showEditor.update((visible) => !visible);
  }

  published(): void {
    this.showEditor.set(false);
  }

  isExpired(item: PublicNewsItem): boolean {
    return Boolean(item.validUntil && item.validUntil < new Date().toISOString());
  }

  scopeOf(item: PublicNewsItem): string {
    if (item.municipality) {
      return this.t('publicNews.scopeMunicipality', {
        municipality: item.municipality,
        department: item.department,
      });
    }
    if (item.department) {
      return this.t('publicNews.scopeDepartment', { department: item.department });
    }
    return this.t('publicNews.scopeNational');
  }
}
