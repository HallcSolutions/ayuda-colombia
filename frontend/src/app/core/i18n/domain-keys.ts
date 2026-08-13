import {
  ConvoyStatus,
  LodgingKind,
  LodgingStatus,
  MealType,
  MissingStatus,
  MissingSubjectKind,
  ReliefPointStatus,
  ReliefPointType,
  ReportStatus,
  SupplyCategory,
  UrgencyLevel,
} from '../constants/app.constants';
import { TranslationKey } from './es.translations';

/**
 * Los valores de los enums son parte del contrato con la API, así que las claves
 * de traducción se derivan de ellos en lugar de duplicar listas de etiquetas.
 */
export const reliefPointTypeKey = (type: ReliefPointType): TranslationKey =>
  `reliefPointType.${type}`;

export const reliefPointStatusKey = (status: ReliefPointStatus): TranslationKey =>
  `reliefPointStatus.${status}`;

export const mealTypeKey = (mealType: MealType): TranslationKey => `mealType.${mealType}`;

export const supplyCategoryKey = (category: SupplyCategory): TranslationKey =>
  `supplyCategory.${category}`;

export const urgencyKey = (urgency: UrgencyLevel): TranslationKey => `urgency.${urgency}`;

export const reportStatusKey = (status: ReportStatus): TranslationKey => `reportStatus.${status}`;

export const missingKindKey = (kind: MissingSubjectKind): TranslationKey => `missingKind.${kind}`;

export const missingStatusKey = (status: MissingStatus): TranslationKey =>
  `missingStatus.${status}`;

export const lodgingKindKey = (kind: LodgingKind): TranslationKey => `lodgingKind.${kind}`;

export const lodgingStatusKey = (status: LodgingStatus): TranslationKey =>
  `lodgingStatus.${status}`;

export const convoyStatusKey = (status: ConvoyStatus): TranslationKey =>
  `convoyStatus.${status}`;

/** Emoji que acompaña a cada tipo de búsqueda; es decoración, no texto traducible. */
export const MISSING_KIND_ICONS: Record<MissingSubjectKind, string> = {
  [MissingSubjectKind.PERSON]: '🧍',
  [MissingSubjectKind.ANIMAL]: '🐾',
};

/** Emoji de cada tipo de alojamiento; es decoración, no texto traducible. */
export const LODGING_KIND_ICONS: Record<LodgingKind, string> = {
  [LodgingKind.HOME]: '🏠',
  [LodgingKind.HOTEL]: '🏨',
  [LodgingKind.MOTEL]: '🛏️',
  [LodgingKind.HOSTEL]: '🛌',
  [LodgingKind.FARM]: '🌄',
  [LodgingKind.OTHER]: '📍',
};

/**
 * Necesidades de vivienda: el valor viaja al backend en español (contrato de datos
 * existente) y la clave solo decide cómo se muestra.
 */
export const HOUSE_NEED_OPTIONS: { value: string; key: TranslationKey }[] = [
  { value: 'Agua potable', key: 'needs.water' },
  { value: 'Alimentos', key: 'needs.food' },
  { value: 'Medicinas', key: 'needs.medicine' },
  { value: 'Atención médica', key: 'needs.medicalCare' },
  { value: 'Alojamiento', key: 'needs.shelter' },
  { value: 'Ropa y cobijas', key: 'needs.clothing' },
  { value: 'Elementos de aseo', key: 'needs.hygiene' },
  { value: 'Ayuda para mascotas', key: 'needs.pets' },
];

const HOUSE_NEED_KEYS = new Map(HOUSE_NEED_OPTIONS.map(({ value, key }) => [value, key]));

/** Devuelve la clave de traducción de una necesidad conocida, o `null` si es texto libre. */
export const houseNeedKey = (need: string): TranslationKey | null =>
  HOUSE_NEED_KEYS.get(need) ?? null;
