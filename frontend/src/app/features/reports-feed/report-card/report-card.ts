import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import {
  HelpContactChannel,
  HelpContactRole,
  ReportStatus,
  UrgencyLevel,
} from '../../../core/constants/app.constants';
import {
  helpContactRoleKey,
  houseNeedKey,
  reportStatusKey,
  urgencyKey,
} from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { HouseReport } from '../../../core/models/house-report.model';
import { PublicRecordShareService } from '../../../core/services/public-record-share.service';
import { colombiaDateTime } from '../../../core/utils/date.util';
import { mapUrl as directionsUrl } from '../../../core/utils/geo.util';
import { whatsappUrl } from '../../../core/utils/phone.util';

@Component({
  selector: 'app-report-card',
  templateUrl: './report-card.html',
  styleUrl: './report-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportCard {
  readonly report = input.required<HouseReport>();

  private readonly i18n = inject(I18nService);
  private readonly shareService = inject(PublicRecordShareService);

  protected readonly t = this.i18n.t;
  protected readonly contactChannel = HelpContactChannel;
  protected readonly shareResult = signal<'idle' | 'copied' | 'failed'>('idle');

  protected mapUrl(report: HouseReport): string {
    return report.location ? directionsUrl(report.location) : '';
  }

  protected urgencyLabel(urgency: UrgencyLevel): string {
    return this.t(urgencyKey(urgency));
  }

  protected statusLabel(status: ReportStatus): string {
    return this.t(reportStatusKey(status));
  }

  protected needLabel(need: string): string {
    const key = houseNeedKey(need);
    return key ? this.t(key) : need;
  }

  protected contactRoleLabel(role: HelpContactRole): string {
    return this.t(helpContactRoleKey(role));
  }

  protected whatsappLink(phone: string): string {
    return whatsappUrl(phone);
  }

  protected illustrationFor(report: HouseReport): string {
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

  protected formatDate(value: string): string {
    return colombiaDateTime(value, this.i18n.locale());
  }

  protected async shareReport(): Promise<void> {
    this.shareResult.set('idle');
    const result = await this.shareService.shareReport(this.report());
    if (result === 'copied') this.shareResult.set('copied');
    if (result === 'failed') this.shareResult.set('failed');
  }
}
