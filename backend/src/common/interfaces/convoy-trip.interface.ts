import {
  ConvoyStatus,
  RouteSource,
  SupplyCategory,
} from '../constants/app.constants';
import { ReliefPointSummary } from './relief-point.interface';

/** Punto del territorio en grados decimales. */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Un camión que lleva ayuda a un punto de acopio. El recorrido solo existe si quien
 * conduce activó `shareLocation`: sin ese permiso el viaje se anuncia, pero no se sigue.
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
  /** Dónde va ahora mismo; `null` mientras no comparta ubicación. */
  position: GeoPoint | null;
  lastPingAt: string | null;
  /** Velocidad media reciente, la que de verdad lleva el camión cargado. */
  speedKmh: number | null;
  remainingKm: number | null;
  etaAt: string | null;
  /** Si lo que falta se midió por carretera o, cuando el motor falla, en línea recta. */
  routeSource: RouteSource | null;
  arrivedAt: string | null;
  /** Camino ya recorrido, tal como lo reportó el GPS. */
  trail: GeoPoint[];
  /** Carretera que falta hasta el acopio; vacía si no se pudo calcular. */
  remainingRoute: GeoPoint[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Respuesta de creación: es el único momento en que viaja el PIN en claro, para que
 * quien conduce lo guarde. Ni el listado ni los eventos en vivo lo incluyen.
 */
export interface PublishedConvoyTrip extends ConvoyTrip {
  editPin: string;
}
