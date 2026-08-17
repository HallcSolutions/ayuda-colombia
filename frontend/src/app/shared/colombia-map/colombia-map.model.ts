import { Coordinates } from '../../core/models/coordinates.model';
import { DepartmentShape, MapPoint } from '../../core/models/map-geometry.model';

/** Color de la chincheta: abierto, con reservas o cerrado. */
export type MapMarkerTone = 'active' | 'warning' | 'muted';

/** Lo mínimo que el mapa necesita saber de un punto para dibujarlo y anunciarlo. */
export interface MapMarker extends Coordinates {
  readonly id: string;
  readonly department: string;
  readonly municipality: string;
  readonly label: string;
  readonly tone: MapMarkerTone;
  /** Marca la chincheta con un halo: el punto está pidiendo ayuda. */
  readonly urgent: boolean;
  /** Los viajes en vivo se dibujan como vehículo; los demás registros conservan la chincheta. */
  readonly symbol?: 'pin' | 'vehicle';
  /** Rumbo del vehículo en grados, donde cero apunta al norte. */
  readonly rotation?: number;
}

/**
 * Un camino sobre el mapa: el recorrido de un camión o el tramo que le falta. Lleva
 * su zona porque se dibuja con las mismas reglas que las chinchetas, y se muestra
 * entero aunque cruce varios departamentos.
 */
export interface MapTrail {
  readonly id: string;
  readonly department: string;
  readonly municipality: string;
  readonly points: readonly Coordinates[];
  readonly tone: MapMarkerTone;
  /** El tramo que aún no se ha recorrido: se dibuja punteado. */
  readonly pending: boolean;
}

/** Un camino ya proyectado sobre el lienzo, listo para pintarse. */
export interface TrailPath {
  readonly id: string;
  readonly d: string;
  readonly tone: MapMarkerTone;
  readonly pending: boolean;
}

/** Un departamento del dibujo junto con lo que hay registrado en él. */
export interface DepartmentArea {
  readonly shape: DepartmentShape;
  readonly count: number;
  readonly selected: boolean;
}

/** Nombre de un departamento escrito sobre el mapa, ya repartido en líneas que caben dentro. */
export interface DepartmentLabel extends MapPoint {
  readonly name: string;
  readonly lines: readonly string[];
  /** Tamaño de letra en unidades del lienzo sin acercar: la etiqueta no crece con el zoom. */
  readonly fontSize: number;
}

/** Una chincheta del mapa: un punto concreto o el conjunto de una ciudad. */
export interface MapPin extends MapPoint {
  readonly key: string;
  readonly label: string;
  /** Nombre escrito bajo la chincheta: la ciudad si agrupa, el punto si va solo. */
  readonly caption: string;
  readonly count: number;
  readonly tone: MapMarkerTone;
  readonly urgent: boolean;
  readonly symbol: 'pin' | 'vehicle';
  readonly rotation: number;
  readonly selected: boolean;
  /** Nulo cuando la chincheta agrupa varios puntos de una misma ciudad. */
  readonly marker: MapMarker | null;
  readonly municipality: string;
  readonly department: string;
}
