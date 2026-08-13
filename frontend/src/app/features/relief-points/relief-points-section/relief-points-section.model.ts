import { ReliefPoint } from '../../../core/models/relief-point.model';

/** Puntos de una misma ciudad dentro del listado. */
export interface MunicipalityGroup {
  municipality: string;
  points: ReliefPoint[];
}

/** Un departamento del listado con sus ciudades y el resumen de la jornada. */
export interface DepartmentGroup {
  department: string;
  municipalities: MunicipalityGroup[];
  pointCount: number;
  portionsToday: number;
  alertCount: number;
}

/** Formulario abierto sobre un punto: pedir ayuda o registrar una comida. */
export type PointAction = { point: ReliefPoint; kind: 'alert' | 'meal' } | null;
