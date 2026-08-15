import { MissingStatus, MissingSubjectKind } from '../constants/app.constants';

/** Coordenadas del último avistamiento; no siempre se conocen. */
export interface LastSeenCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Respuesta de publicación: el PIN llega una sola vez, para que quien publica lo
 * guarde. Es lo único que le permitirá marcar el reencuentro o cerrar el aviso.
 */
export interface PublishedMissingRecord extends MissingRecord {
  editPin: string;
}

export interface MissingRecord {
  id: string;
  kind: MissingSubjectKind;
  name: string;
  ageYears: number | null;
  description: string;
  department: string;
  municipality: string;
  lastSeenPlace: string;
  lastSeenAt: string;
  coordinates: LastSeenCoordinates | null;
  contactName: string;
  contactPhone: string;
  photos: string[];
  sourceName: string | null;
  sourceUrl: string | null;
  sourceVerifiedAt: string | null;
  status: MissingStatus;
  foundAt: string | null;
  createdAt: string;
  updatedAt: string;
}
