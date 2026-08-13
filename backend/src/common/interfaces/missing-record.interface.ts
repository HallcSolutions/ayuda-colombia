import { MissingStatus, MissingSubjectKind } from '../constants/app.constants';

/** Coordenadas del último avistamiento; son opcionales porque no siempre se conocen. */
export interface LastSeenCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Respuesta de creación: es el único momento en que viaja el PIN en claro, para
 * que quien publica lo guarde. Ni el listado ni los eventos en vivo lo incluyen.
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
  status: MissingStatus;
  foundAt: string | null;
  createdAt: string;
  updatedAt: string;
}
