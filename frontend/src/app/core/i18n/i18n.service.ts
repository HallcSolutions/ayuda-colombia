import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { EN_TRANSLATIONS } from './en.translations';
import { ES_TRANSLATIONS, TranslationCatalog, TranslationKey } from './es.translations';

export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export type TranslationParams = Record<string, string | number>;

const STORAGE_KEY = 'redayuda.locale';
const DEFAULT_LOCALE: Locale = 'es';
const CATALOGS: Record<Locale, TranslationCatalog> = {
  es: ES_TRANSLATIONS,
  en: EN_TRANSLATIONS,
};

const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

/** Traducción en tiempo de ejecución: cambiar `locale` refresca toda la interfaz. */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  readonly locale = signal<Locale>(this.detectLocale());
  readonly locales = LOCALES;

  constructor() {
    effect(() => this.persistLocale(this.locale()));
  }

  /** Se usa como `t('clave')` dentro de las plantillas; sigue al signal `locale`. */
  readonly t = (key: TranslationKey, params?: TranslationParams): string =>
    this.interpolate(CATALOGS[this.locale()][key] ?? ES_TRANSLATIONS[key] ?? key, params);

  setLocale(locale: Locale): void {
    this.locale.set(locale);
  }

  changeLocale(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (isLocale(value)) this.setLocale(value);
  }

  private interpolate(template: string, params?: TranslationParams): string {
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match,
    );
  }

  private detectLocale(): Locale {
    if (!isPlatformBrowser(this.platformId)) return DEFAULT_LOCALE;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isLocale(stored)) return stored;
    } catch {
      // Almacenamiento bloqueado: se usa el idioma del navegador.
    }
    const browserLocale = navigator.language?.slice(0, 2) ?? '';
    return isLocale(browserLocale) ? browserLocale : DEFAULT_LOCALE;
  }

  private persistLocale(locale: Locale): void {
    this.document.documentElement.lang = locale;
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Almacenamiento bloqueado: el idioma solo dura esta sesión.
    }
  }
}
