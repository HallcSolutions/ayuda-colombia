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

export enum HelpContactRole {
  AFFECTED_PERSON = 'affected_person',
  FAMILY_MEMBER = 'family_member',
  LOCAL_SUPPORT = 'local_support',
}

export enum HelpContactChannel {
  PHONE = 'phone',
  WHATSAPP = 'whatsapp',
  BOTH = 'both',
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
  SHELTERED = 'sheltered',
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

/** `available` y `full` los deciden los cupos; `closed` lo decide quien ofrece. */
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

/** Señales que el chequeo periódico levanta sobre un punto ya registrado. */
export enum DigestFindingKind {
  CRITICAL_STALE = 'critical_stale',
  NO_ACTIVITY = 'no_activity',
  KITCHEN_WITHOUT_SERVICE = 'kitchen_without_service',
  STATUS_OUTDATED = 'status_outdated',
}

export enum DigestRunStatus {
  OK = 'ok',
  FAILED = 'failed',
}

export enum PublicNewsCategory {
  EARTHQUAKE = 'earthquake',
  FLOOD = 'flood',
  LANDSLIDE = 'landslide',
  WILDFIRE = 'wildfire',
  STORM = 'storm',
  DROUGHT = 'drought',
  OTHER = 'other',
}

export enum PublicNewsStatus {
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum RecoveryProjectKind {
  HOME = 'home',
  PERSON = 'person',
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
  ASSISTIVE_DEVICE = 'assistive_device',
  HOUSEHOLD_GOODS = 'household_goods',
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

export enum RecoveryApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  WITHDRAWN = 'withdrawn',
  COMPLETED = 'completed',
}

// Mismos límites que valida el backend en `common/uploads/photo-upload.ts`.
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_REPORT_PHOTOS = 6;
export const MAX_MISSING_PHOTOS = 3;
export const MAX_RECOVERY_PHOTOS = 3;
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

export const RELIEF_POINT_TYPES = Object.values(ReliefPointType);
export const RELIEF_POINT_STATUSES = Object.values(ReliefPointStatus);
export const MEAL_TYPES = Object.values(MealType);
export const SUPPLY_CATEGORIES = Object.values(SupplyCategory);
export const URGENCY_LEVELS = Object.values(UrgencyLevel);
export const HELP_CONTACT_ROLES = Object.values(HelpContactRole);
export const HELP_CONTACT_CHANNELS = Object.values(HelpContactChannel);
export const MISSING_SUBJECT_KINDS = Object.values(MissingSubjectKind);
export const MISSING_STATUSES = Object.values(MissingStatus);
/** Sigue abierta mientras nadie haya vuelto a casa: buscando o al cuidado de alguien. */
export const OPEN_MISSING_STATUSES: readonly MissingStatus[] = [
  MissingStatus.SEARCHING,
  MissingStatus.SHELTERED,
];
export const CONVOY_STATUSES = Object.values(ConvoyStatus);
export const LODGING_KINDS = Object.values(LodgingKind);
export const LODGING_STATUSES = Object.values(LodgingStatus);
export const PUBLIC_NEWS_CATEGORIES = Object.values(PublicNewsCategory);
export const RECOVERY_PROJECT_KINDS = Object.values(RecoveryProjectKind);
export const RECOVERY_TASK_CATEGORIES = Object.values(RecoveryTaskCategory);
export const RECOVERY_SALES_MODES = Object.values(RecoverySalesMode);
/** Necesidades que se resuelven entregando una cosa, no poniendo la mano a trabajar. */
export const RECOVERY_DONATION_CATEGORIES: readonly RecoveryTaskCategory[] = [
  RecoveryTaskCategory.ASSISTIVE_DEVICE,
  RecoveryTaskCategory.HOUSEHOLD_GOODS,
  RecoveryTaskCategory.MATERIALS,
  RecoveryTaskCategory.FOOD,
];
