import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { whatsappUrl } from '../../core/utils/phone.util';

@Component({
  selector: 'app-aid-offer-notice',
  imports: [RouterLink],
  templateUrl: './aid-offer-notice.html',
  styleUrl: './aid-offer-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AidOfferNotice {
  readonly compact = input(false);

  protected readonly t = inject(I18nService).t;
  protected readonly whatsappLink = whatsappUrl('312 683 6035');
}
