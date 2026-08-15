export enum ReportStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
}

export enum UrgencyLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum ReliefPointType {
  COLLECTION_CENTER = 'collection_center',
  COMMUNITY_KITCHEN = 'community_kitchen',
  SHELTER = 'shelter',
  MEDICAL_POST = 'medical_post',
  /** Atención de mascotas y animales de finca, que también salen desplazados. */
  VETERINARY = 'veterinary',
}

export enum ReliefPointStatus {
  ACTIVE = 'active',
  FULL = 'full',
  CLOSED = 'closed',
}

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

export enum SupplyCategory {
  FOOD = 'food',
  WATER = 'water',
  MEDICINE = 'medicine',
  HYGIENE = 'hygiene',
  CLOTHING = 'clothing',
  SHELTER_KIT = 'shelter_kit',
  VOLUNTEERS = 'volunteers',
  TRANSPORT = 'transport',
  OTHER = 'other',
}

export enum AlertStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
}

/** Una búsqueda puede ser de una persona o de un animal de compañía o de trabajo. */
export enum MissingSubjectKind {
  PERSON = 'person',
  ANIMAL = 'animal',
}

export enum MissingStatus {
  SEARCHING = 'searching',
  FOUND = 'found',
  CLOSED = 'closed',
}

/** Quién ofrece la dormida: una familia en su casa, un hotel, un motel, una finca… */
export enum LodgingKind {
  HOME = 'home',
  HOTEL = 'hotel',
  MOTEL = 'motel',
  HOSTEL = 'hostel',
  FARM = 'farm',
  OTHER = 'other',
}

/**
 * `full` y `available` los calcula la ocupación, no quien publica: solo `closed`
 * es una decisión suya (retiró el ofrecimiento).
 */
export enum LodgingStatus {
  AVAILABLE = 'available',
  FULL = 'full',
  CLOSED = 'closed',
}

/** Un viaje de ayuda: se anuncia, sale, puede quedar en pausa y termina al llegar. */
export enum ConvoyStatus {
  SCHEDULED = 'scheduled',
  EN_ROUTE = 'en_route',
  PAUSED = 'paused',
  ARRIVED = 'arrived',
  CANCELLED = 'cancelled',
}

/** Con qué se midió lo que le falta al camión: la carretera real o la línea recta. */
export enum RouteSource {
  ROAD = 'road',
  STRAIGHT_LINE = 'straight_line',
}

/** Cada señal que el chequeo periódico sabe levantar sobre un punto ya registrado. */
export enum DigestFindingKind {
  /** Alerta crítica que lleva demasiadas horas abierta sin que nadie la atienda. */
  CRITICAL_STALE = 'critical_stale',
  /** Punto activo del que no se sabe nada: ni alertas, ni comidas, ni cambios. */
  NO_ACTIVITY = 'no_activity',
  /** Comedor abierto que no tiene ninguna jornada de comida programada. */
  KITCHEN_WITHOUT_SERVICE = 'kitchen_without_service',
  /** Punto marcado como lleno o cerrado hace tanto que el dato ya no es creíble. */
  STATUS_OUTDATED = 'status_outdated',
}

export enum DigestRunStatus {
  OK = 'ok',
  FAILED = 'failed',
}

export enum RecoveryProjectKind {
  HOME = 'home',
  BUSINESS = 'business',
  RESTAURANT = 'restaurant',
  ARTISAN = 'artisan',
  COMMUNITY = 'community',
}

export enum RecoverySalesMode {
  STREET_STAND = 'street_stand',
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
  MADE_TO_ORDER = 'made_to_order',
  ON_SITE = 'on_site',
}

export enum RecoveryProjectStatus {
  PENDING_REVIEW = 'pending_review',
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export enum RecoveryTaskCategory {
  GENERAL = 'general',
  CLEANING = 'cleaning',
  CONSTRUCTION = 'construction',
  STRUCTURAL = 'structural',
  ELECTRICAL = 'electrical',
  GAS = 'gas',
  PLUMBING = 'plumbing',
  CARPENTRY = 'carpentry',
  WELDING = 'welding',
  EQUIPMENT_REPAIR = 'equipment_repair',
  TRANSPORT = 'transport',
  FOOD = 'food',
  MATERIALS = 'materials',
  BUSINESS_SUPPORT = 'business_support',
  DIGITAL = 'digital',
  OTHER = 'other',
}

export enum RecoveryRiskLevel {
  GREEN = 'green',
  AMBER = 'amber',
  RED = 'red',
}

export enum RecoveryTaskStatus {
  PENDING_REVIEW = 'pending_review',
  OPEN = 'open',
  BLOCKED = 'blocked',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum HelperVerificationLevel {
  PENDING = 'pending',
  IDENTITY = 'identity',
  TRADE = 'trade',
  PROFESSIONAL = 'professional',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum HelperCredentialType {
  NONE = 'none',
  PROFESSIONAL_LICENSE = 'professional_license',
  TRADE_CERTIFICATE = 'trade_certificate',
  EMPLOYER_REFERENCE = 'employer_reference',
  COMMUNITY_REFERENCE = 'community_reference',
}

export enum HelperVerificationMethod {
  IDENTITY_AND_PHONE = 'identity_and_phone',
  OFFICIAL_REGISTRY = 'official_registry',
  TRAINING_CERTIFICATE = 'training_certificate',
  EMPLOYER_REFERENCE = 'employer_reference',
  COMMUNITY_REFERENCE = 'community_reference',
  PRACTICAL_ASSESSMENT = 'practical_assessment',
}

export enum RecoveryApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  WITHDRAWN = 'withdrawn',
  COMPLETED = 'completed',
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_REPORT_PHOTOS = 6;
export const MAX_MISSING_PHOTOS = 3;
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
