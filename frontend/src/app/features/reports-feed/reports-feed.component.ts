import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  HelpContactChannel,
  HelpContactRole,
  ReportStatus,
  UrgencyLevel,
} from '../../core/constants/app.constants';
import {
  helpContactRoleKey,
  houseNeedKey,
  reportStatusKey,
  urgencyKey,
} from '../../core/i18n/domain-keys';
import { I18nService } from '../../core/i18n/i18n.service';
import { HouseReport } from '../../core/models/house-report.model';
import { ReportsService } from '../../core/services/reports.service';
import { colombiaDateTime } from '../../core/utils/date.util';
import { mapUrl as directionsUrl } from '../../core/utils/geo.util';
import { whatsappUrl } from '../../core/utils/phone.util';
import { AidOfferNotice } from '../../shared/aid-offer-notice/aid-offer-notice';
import { ColombiaWatermark } from '../../shared/colombia-watermark/colombia-watermark';

@Component({
  selector: 'app-reports-feed',
  imports: [ColombiaWatermark, RouterLink, AidOfferNotice],
  templateUrl: './reports-feed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsFeedComponent {
  readonly reportsService = inject(ReportsService);
  private readonly i18n = inject(I18nService);
  readonly t = this.i18n.t;
  readonly searchTerm = signal('');
  readonly statusFilter = signal<'all' | ReportStatus>('all');
  readonly contactChannel = HelpContactChannel;

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

  mapUrl(report: HouseReport): string {
    return report.location ? directionsUrl(report.location) : '';
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

  contactRoleLabel(role: HelpContactRole): string {
    return this.t(helpContactRoleKey(role));
  }

  whatsappLink(phone: string): string {
    return whatsappUrl(phone);
  }

  illustrationFor(report: HouseReport): string {
    const context = [...report.needs, report.notice]
      .join(' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (/medicin|atencion medica|aseo|higiene/.test(context)) {
      return '/assets/reports/report-medical-illustration.jpg';
    }
    if (/pared|grieta|estructur|inhabitable|muro|perdida total|colaps/.test(context)) {
      return '/assets/reports/report-damage-illustration.jpg';
    }
    return '/assets/reports/report-shelter-illustration.jpg';
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
