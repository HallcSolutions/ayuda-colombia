import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { PublicRecordShareService } from '../../core/services/public-record-share.service';
import { whatsappUrl } from '../../core/utils/phone.util';

@Component({
  selector: 'app-aid-offer-notice',
  imports: [RouterLink],
  templateUrl: './aid-offer-notice.html',
  styleUrl: './aid-offer-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AidOfferNotice {
  private readonly shareService = inject(PublicRecordShareService);

  readonly compact = input(false);
  readonly shareResult = signal<'idle' | 'copied' | 'failed'>('idle');

  protected readonly t = inject(I18nService).t;
  protected readonly whatsappLink = whatsappUrl('312 683 6035');

  async shareOffer(): Promise<void> {
    this.shareResult.set('idle');
    const result = await this.shareService.shareAidOffer();
    if (result === 'copied') this.shareResult.set('copied');
    if (result === 'failed') this.shareResult.set('failed');
  }
}
