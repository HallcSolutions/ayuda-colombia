import { HttpParams } from '@angular/common/http';
import { RegionSelection } from '../models/region.model';

/** Añade departamento y ciudad a la consulta solo cuando hay zona seleccionada. */
export function withRegionParams(params: HttpParams, region: RegionSelection): HttpParams {
  let withRegion = params;
  if (region.department) withRegion = withRegion.set('department', region.department);
  if (region.municipality) withRegion = withRegion.set('municipality', region.municipality);
  return withRegion;
}
