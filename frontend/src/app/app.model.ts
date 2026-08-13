import { Signal } from '@angular/core';
import { TranslationKey } from './core/i18n/es.translations';

/** Pestaña de la navegación principal; el contador es opcional. */
export interface NavTab {
  path: string;
  labelKey: TranslationKey;
  badge?: Signal<number>;
}
