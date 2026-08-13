/** Zona de trabajo. Cadena vacía significa «todo el país» o «todas las ciudades». */
export interface RegionSelection {
  department: string;
  municipality: string;
}

/** Cualquier entidad con ubicación que se pueda filtrar por la zona elegida. */
export interface RegionAware {
  department: string;
  municipality: string;
}
