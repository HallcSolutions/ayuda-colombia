import { TranslationKey } from '../i18n/es.translations';
import { TranslationParams } from '../i18n/i18n.service';

/** Un lapso listo para traducir: la clave decide el idioma, no el texto ya armado. */
export interface DurationLabel {
  key: TranslationKey;
  params: TranslationParams;
}

const MINUTE_IN_MS = 60_000;

/** Convierte un lapso en «3 min» o «2 h 15 min», sin escribir el texto aquí. */
export function durationLabel(milliseconds: number): DurationLabel {
  const minutes = Math.max(0, Math.round(milliseconds / MINUTE_IN_MS));
  if (!minutes) return { key: 'duration.moment', params: {} };
  if (minutes < 60) return { key: 'duration.minutes', params: { minutes } };
  return {
    key: 'duration.hours',
    params: { hours: Math.floor(minutes / 60), minutes: minutes % 60 },
  };
}
