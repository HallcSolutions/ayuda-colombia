import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReportStatus } from '../../core/constants/app.constants';
import { houseNeedKey } from '../../core/i18n/domain-keys';
import { I18nService } from '../../core/i18n/i18n.service';
import { ReportsService } from '../../core/services/reports.service';
import { AidOfferNotice } from '../../shared/aid-offer-notice/aid-offer-notice';
import { ColombiaWatermark } from '../../shared/colombia-watermark/colombia-watermark';
import { ReportCard } from './report-card/report-card';

@Component({
  selector: 'app-reports-feed',
  imports: [ColombiaWatermark, RouterLink, AidOfferNotice, ReportCard],
  templateUrl: './reports-feed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsFeedComponent {
  readonly reportsService = inject(ReportsService);
  private readonly i18n = inject(I18nService);
  readonly t = this.i18n.t;
  readonly searchTerm = signal('');
  readonly statusFilter = signal<'all' | ReportStatus>('all');

  readonly filteredReports = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    return this.reportsService.reportsInRegion().filter((report) => {
      const matchesStatus = status === 'all' || report.status === status;
      const searchable = [
        report.department,
        report.municipality,
        report.addressReference,
        report.notice,
        ...report.needs.map((need) => this.needLabel(need)),
      ]
        .join(' ')
        .toLowerCase();
      return matchesStatus && (!search || searchable.includes(search));
    });
  });

  readonly openCount = computed(
    () => this.filteredReports().filter((report) => report.status === ReportStatus.OPEN).length,
  );
  readonly inProgressCount = computed(
    () =>
      this.filteredReports().filter((report) => report.status === ReportStatus.IN_PROGRESS).length,
  );
  readonly resolvedCount = computed(
    () => this.filteredReports().filter((report) => report.status === ReportStatus.RESOLVED).length,
  );

  needLabel(need: string): string {
    const key = houseNeedKey(need);
    return key ? this.t(key) : need;
  }

  updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  updateStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as 'all' | ReportStatus);
  }
}
