/** Punto del lienzo del mapa (no del territorio: ver `Coordinates`). */
export interface MapPoint {
  x: number;
  y: number;
}

export interface DepartmentShape {
  /** Nombre canónico, el mismo de `COLOMBIA_DEPARTMENTS`. */
  readonly name: string;
  /** Contorno del departamento en coordenadas del lienzo. */
  readonly d: string;
  /** Punto interior para anclar la etiqueta o el contador de puntos registrados. */
  readonly labelX: number;
  readonly labelY: number;
  /** Marco del departamento `[x, y, ancho, alto]`, usado para acercar el mapa. */
  readonly bbox: readonly [number, number, number, number];
}
