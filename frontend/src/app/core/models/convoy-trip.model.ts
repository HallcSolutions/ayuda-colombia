import { ConvoyStatus, RouteSource, SupplyCategory } from '../constants/app.constants';
import { Coordinates } from './coordinates.model';
import { ReliefPointSummary } from './relief-point.model';

/**
 * Un camión que lleva ayuda a un punto. El recorrido solo existe si quien conduce
 * activó `shareLocation`: sin ese permiso el viaje se anuncia, pero no se sigue.
 */
export interface ConvoyTrip {
  id: string;
  driverName: string;
  contactPhone: string;
  vehiclePlate: string;
  vehicleDescription: string;
  cargo: SupplyCategory[];
  cargoNotes: string;
  originDepartment: string;
  originMunicipality: string;
  destination: ReliefPointSummary;
  departureAt: string;
  status: ConvoyStatus;
  shareLocation: boolean;
  position: Coordinates | null;
  lastPingAt: string | null;
  speedKmh: number | null;
  remainingKm: number | null;
  etaAt: string | null;
  routeSource: RouteSource | null;
  arrivedAt: string | null;
  /** Camino ya recorrido, tal como lo reportó el GPS del camión. */
  trail: Coordinates[];
  /** Carretera que falta hasta el punto; vacía si no se pudo calcular. */
  remainingRoute: Coordinates[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Respuesta al anunciar el viaje: el PIN llega una sola vez, para que quien conduce lo
 * guarde. Es lo único que le permitirá compartir su ubicación y marcar la llegada.
 */
export interface PublishedConvoyTrip extends ConvoyTrip {
  editPin: string;
}

export interface CreateConvoyTripPayload {
  driverName: string;
  contactPhone: string;
  vehiclePlate?: string;
  vehicleDescription: string;
  cargo: SupplyCategory[];
  cargoNotes?: string;
  originDepartment: string;
  originMunicipality: string;
  destinationPointId: string;
  departureAt: string;
  shareLocation: boolean;
}

/** Cambios que quien conduce puede hacer sobre su propio viaje. */
export interface UpdateConvoyTripPayload {
  status?: ConvoyStatus;
  shareLocation?: boolean;
}
