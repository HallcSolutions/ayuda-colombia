import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MissingStatus } from '../../core/constants/app.constants';
import { I18nService } from '../../core/i18n/i18n.service';
import { MissingRecord } from '../../core/models/missing-record.model';
import { MissingService } from '../../core/services/missing.service';
import { PublicRecordShareService } from '../../core/services/public-record-share.service';
import { whatsappUrl } from '../../core/utils/phone.util';

const PERLA_ID = 'df431bcc-700c-4404-94ae-e68d85e38677';

@Component({
  selector: 'app-perla-help-notice',
  imports: [RouterLink],
  templateUrl: './perla-help-notice.html',
  styleUrl: './perla-help-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerlaHelpNotice {
  private readonly missingService = inject(MissingService);
  private readonly shareService = inject(PublicRecordShareService);
  private readonly document = inject(DOCUMENT);

  protected readonly t = inject(I18nService).t;
  protected readonly perlaWhatsapp = whatsappUrl('324 683 6638');

  readonly record = signal<MissingRecord | null>(null);
  readonly shareResult = signal<'idle' | 'copied' | 'failed'>('idle');

  constructor() {
    void this.load();
  }

  missingPathFor(record: MissingRecord): string {
    return this.shareService.missingPathFor(record);
  }

  async shareHelp(record: MissingRecord): Promise<void> {
    this.shareResult.set('idle');
    const result = await this.shareService.sharePerlaDroneHelp(record);
    if (result === 'copied') this.shareResult.set('copied');
    if (result === 'failed') this.shareResult.set('failed');
  }

  private async load(): Promise<void> {
    try {
      const record = await firstValueFrom(this.missingService.loadRecord(PERLA_ID));
      this.record.set(record.status === MissingStatus.SEARCHING ? record : null);
      if (this.document.location.hash === '#como-ayudar-perla') {
        setTimeout(() =>
          this.document
            .getElementById('como-ayudar-perla')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        );
      }
    } catch {
      this.record.set(null);
    }
  }
}
