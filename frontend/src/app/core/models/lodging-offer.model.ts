import { LodgingKind, LodgingStatus } from '../constants/app.constants';

/** Punto exacto del alojamiento; no todo el mundo lo puede marcar. */
export interface LodgingCoordinates {
  latitude: number;
  longitude: number;
}

/** Lo que se envía al publicar: la ocupación y el estado los decide el servidor. */
export interface NewLodgingOffer {
  placeName: string;
  kind: LodgingKind;
  hostName: string;
  contactPhone: string;
  department: string;
  municipality: string;
  addressReference: string;
  totalSpaces: number;
  freeOfCharge: boolean;
  acceptsPets: boolean;
  maxNights?: number;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Respuesta de publicación: el PIN llega una sola vez para que quien ofrece la
 * dormida lo guarde. Es lo único que le permitirá ir mermando los cupos.
 */
export interface PublishedLodgingOffer extends LodgingOffer {
  editPin: string;
}

export interface LodgingOffer {
  id: string;
  placeName: string;
  kind: LodgingKind;
  hostName: string;
  contactPhone: string;
  department: string;
  municipality: string;
  addressReference: string;
  coordinates: LodgingCoordinates | null;
  totalSpaces: number;
  occupiedSpaces: number;
  availableSpaces: number;
  maxNights: number | null;
  freeOfCharge: boolean;
  acceptsPets: boolean;
  notes: string;
  /** Quién comprobó la dormida; cadena vacía si nadie la ha confirmado todavía. */
  verifiedBy: string;
  verifiedAt: string | null;
  status: LodgingStatus;
  createdAt: string;
  updatedAt: string;
}
