import { ConvoyStatus } from '../../common/constants/app.constants';
import { RegionFilters } from '../../common/interfaces/region-filters.interface';

/** La zona filtra por el acopio de destino: es quien espera el camión. */
export interface ConvoyFilters extends RegionFilters {
  status?: ConvoyStatus;
  destinationPointId?: string;
}
