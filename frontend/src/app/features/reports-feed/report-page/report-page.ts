import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { I18nService } from '../../../core/i18n/i18n.service';
import { HouseReport } from '../../../core/models/house-report.model';
import { ReportsService } from '../../../core/services/reports.service';
import { uuidFromRouteParameter } from '../../../core/utils/route-id.util';
import { ReportCard } from '../report-card/report-card';

@Component({
  selector: 'app-report-page',
  imports: [RouterLink, ReportCard],
  templateUrl: './report-page.html',
  styleUrl: './report-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportPage {
  private readonly route = inject(ActivatedRoute);
  private readonly reportsService = inject(ReportsService);

  protected readonly t = inject(I18nService).t;

  readonly reportId = uuidFromRouteParameter(this.route.snapshot.paramMap.get('reportId'));
  readonly loadedReport = signal<HouseReport | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly report = computed(
    () =>
      this.reportsService.reports().find((report) => report.id === this.reportId) ??
      this.loadedReport(),
  );

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    if (!this.reportId) {
      this.loadError.set(this.t('reportPage.notFound'));
      this.loading.set(false);
      return;
    }

    try {
      this.loadedReport.set(await firstValueFrom(this.reportsService.loadReport(this.reportId)));
    } catch {
      this.loadError.set(this.t('reportPage.notFound'));
    } finally {
      this.loading.set(false);
    }
  }
}
