import { LodgingKind, LodgingStatus } from '../constants/app.constants';

/** Punto exacto del alojamiento; es opcional porque no todos lo pueden marcar. */
export interface LodgingCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Respuesta de publicación: es el único momento en que viaja el PIN en claro, para
 * que quien ofrece la dormida lo guarde y pueda ir descontando cupos.
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
  /** Cupos ofrecidos en total y cuántos están ya ocupados. */
  totalSpaces: number;
  occupiedSpaces: number;
  /** Lo que de verdad busca quien necesita dormir: cuántos quedan libres. */
  availableSpaces: number;
  maxNights: number | null;
  freeOfCharge: boolean;
  acceptsPets: boolean;
  notes: string;
  status: LodgingStatus;
  createdAt: string;
  updatedAt: string;
}
