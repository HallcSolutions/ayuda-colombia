import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { RegionFilters } from '../interfaces/region-filters.interface';

/**
 * Aplica los filtros de región sobre el alias que expone `department` y `municipality`
 * (la propia tabla en puntos de acopio, o el punto relacionado en alertas y comidas).
 */
export function applyRegionFilters<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  alias: string,
  filters: RegionFilters,
): SelectQueryBuilder<T> {
  if (filters.department) {
    query.andWhere(`LOWER(${alias}.department) LIKE LOWER(:department)`, {
      department: `%${filters.department}%`,
    });
  }
  if (filters.municipality) {
    query.andWhere(`LOWER(${alias}.municipality) LIKE LOWER(:municipality)`, {
      municipality: `%${filters.municipality}%`,
    });
  }
  return query;
}
