import { AlertStatus, MissingStatus, UrgencyLevel } from '../../../core/constants/app.constants';
import {
  mealTypeKey,
  missingKindKey,
  reliefPointTypeKey,
  supplyCategoryKey,
} from '../../../core/i18n/domain-keys';
import { TranslationKey } from '../../../core/i18n/es.translations';
import { TranslationParams } from '../../../core/i18n/i18n.service';
import { AidAlert } from '../../../core/models/aid-alert.model';
import { MealService } from '../../../core/models/meal-service.model';
import { MissingRecord } from '../../../core/models/missing-record.model';
import { ReliefPoint } from '../../../core/models/relief-point.model';

/** El tipo decide el color del punto en la línea de tiempo. */
export type NewsEventKind = 'need' | 'solved' | 'point' | 'meal' | 'missing';

export interface NewsEvent {
  id: string;
  kind: NewsEventKind;
  /** Momento del hecho en ISO: es lo que ordena la lista. */
  at: string;
  headline: string;
  place: string;
  /** Texto que escribió una persona: el título de la alerta, una nota… */
  detail: string;
  urgent: boolean;
  route: string;
}

/** Traduce con las claves del catálogo; se recibe para no escribir texto aquí. */
type Translate = (key: TranslationKey, params?: TranslationParams) => string;

const placeOf = (item: { municipality: string; department: string }): string =>
  `${item.municipality}, ${item.department}`;

/** Una alerta genera una novedad al abrirse y otra distinta al quedar atendida. */
export function alertEvent(alert: AidAlert, t: Translate): NewsEvent {
  const need = t(supplyCategoryKey(alert.category));
  const point = alert.reliefPoint.name;
  const resolved = alert.status === AlertStatus.RESOLVED;
  return {
    id: `alert-${alert.id}-${alert.status}`,
    kind: resolved ? 'solved' : 'need',
    at: (resolved ? alert.resolvedAt : alert.createdAt) ?? alert.createdAt,
    headline: resolved
      ? t('news.alertSolved', { need, point })
      : t('news.alertOpened', { point, need }),
    place: placeOf(alert.reliefPoint),
    detail: alert.requestedQuantity ? `${alert.title} · ${alert.requestedQuantity}` : alert.title,
    urgent: !resolved && alert.severity === UrgencyLevel.CRITICAL,
    route: '/puntos',
  };
}

export function reliefPointEvent(point: ReliefPoint, t: Translate): NewsEvent {
  return {
    id: `point-${point.id}`,
    kind: 'point',
    at: point.createdAt,
    headline: t('news.pointAdded', {
      type: t(reliefPointTypeKey(point.type)),
      point: point.name,
    }),
    place: placeOf(point),
    detail: point.schedule,
    urgent: false,
    route: '/puntos',
  };
}

/**
 * Una jornada de comida solo es novedad si sabemos en qué punto ocurre: sin él no
 * hay lugar que mostrar, así que se descarta.
 */
export function mealEvent(
  meal: MealService,
  point: ReliefPoint | undefined,
  t: Translate,
): NewsEvent | null {
  if (!point) return null;
  return {
    id: `meal-${meal.id}`,
    kind: 'meal',
    at: meal.createdAt,
    headline: t('news.mealPlanned', {
      point: point.name,
      mealType: t(mealTypeKey(meal.mealType)).toLowerCase(),
      portions: meal.portionsPlanned,
    }),
    place: placeOf(point),
    detail: meal.notes,
    urgent: false,
    route: '/puntos',
  };
}

export function missingEvent(record: MissingRecord, t: Translate): NewsEvent {
  const found = record.status === MissingStatus.FOUND;
  return {
    id: `missing-${record.id}-${record.status}`,
    kind: 'missing',
    at: (found ? record.foundAt : record.createdAt) ?? record.createdAt,
    headline: found
      ? t('news.missingFound', { name: record.name })
      : t('news.missingPublished', {
          kind: t(missingKindKey(record.kind)).toLowerCase(),
          name: record.name,
        }),
    place: placeOf(record),
    detail: found ? '' : record.lastSeenPlace,
    urgent: !found,
    route: '/desaparecidos',
  };
}

/** Lo más reciente primero; la portada solo muestra las primeras. */
export function sortByMostRecent(events: NewsEvent[]): NewsEvent[] {
  return [...events].sort((first, second) => second.at.localeCompare(first.at));
}
