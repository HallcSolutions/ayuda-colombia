import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService, Locale } from '../../core/i18n/i18n.service';
import { TranslationKey } from '../../core/i18n/es.translations';

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcher {
  readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  localeKey(locale: Locale): TranslationKey {
    return `language.${locale}`;
  }
}
