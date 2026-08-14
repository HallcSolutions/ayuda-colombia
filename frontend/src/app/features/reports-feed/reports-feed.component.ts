import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ReportStatus, UrgencyLevel } from '../../core/constants/app.constants';
import { houseNeedKey, reportStatusKey, urgencyKey } from '../../core/i18n/domain-keys';
import { TranslationKey } from '../../core/i18n/es.translations';
import { I18nService } from '../../core/i18n/i18n.service';
import { HouseReport } from '../../core/models/house-report.model';
import { ReportsService } from '../../core/services/reports.service';
import { colombiaDateTime } from '../../core/utils/date.util';
import { mapUrl as directionsUrl } from '../../core/utils/geo.util';

@Component({
  selector: 'app-reports-feed',
  templateUrl: './reports-feed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsFeedComponent {
  readonly reportsService = inject(ReportsService);
  private readonly i18n = inject(I18nService);
  readonly t = this.i18n.t;
  readonly reportStatus = ReportStatus;
  readonly searchTerm = signal('');
  readonly statusFilter = signal<'all' | ReportStatus>('all');
  private readonly errorMessageKey = signal<TranslationKey | null>(null);
  readonly errorMessage = computed(() => {
    const key = this.errorMessageKey();
    return key ? this.t(key) : '';
  });

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

  async changeStatus(report: HouseReport, status: ReportStatus): Promise<void> {
    this.errorMessageKey.set(null);
    try {
      await firstValueFrom(this.reportsService.updateStatus(report.id, status));
    } catch {
      this.errorMessageKey.set('feed.statusError');
    }
  }

  mapUrl(report: HouseReport): string {
    return directionsUrl(report.location);
  }

  urgencyLabel(urgency: UrgencyLevel): string {
    return this.t(urgencyKey(urgency));
  }

  statusLabel(status: ReportStatus): string {
    return this.t(reportStatusKey(status));
  }

  needLabel(need: string): string {
    const key = houseNeedKey(need);
    return key ? this.t(key) : need;
  }

  formatDate(value: string): string {
    return colombiaDateTime(value, this.i18n.locale());
  }

  updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  updateStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as 'all' | ReportStatus);
  }
}
