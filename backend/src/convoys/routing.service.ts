import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeoPoint } from '../common/interfaces/convoy-trip.interface';

/** Carretera que une dos puntos, tal como la devuelve el motor de rutas. */
export interface RoadRoute {
  geometry: GeoPoint[];
  distanceKm: number;
}

/** Respuesta de OSRM; solo se declara lo que se usa. */
interface OsrmRouteResponse {
  code?: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
  }[];
}

/** Servidor público de demostración de OSRM; en producción conviene uno propio. */
const DEFAULT_ROUTING_URL = 'https://router.project-osrm.org';
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Traza la carretera que debe seguir un camión. Es el único punto del backend que sale
 * a internet, así que nunca propaga su error: si el motor no responde, el viaje sigue
 * vivo con la distancia en línea recta y el contrato lo dice con `routeSource`.
 */
@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);
  private readonly baseUrl: string;
  private readonly enabled: boolean;

  constructor(config: ConfigService) {
    this.baseUrl = (config.get<string>('ROUTING_URL') ?? DEFAULT_ROUTING_URL)
      .trim()
      .replace(/\/+$/, '');
    this.enabled = config.get<string>('ROUTING_ENABLED', 'true') !== 'false';
  }

  async findRoad(from: GeoPoint, to: GeoPoint): Promise<RoadRoute | null> {
    if (!this.enabled) return null;

    const waypoints = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
    const url = `${this.baseUrl}/route/v1/driving/${waypoints}?overview=full&geometries=geojson`;
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`respuesta ${response.status}`);

      const body = (await response.json()) as OsrmRouteResponse;
      const route = body.routes?.[0];
      if (body.code !== 'Ok' || !route?.geometry.coordinates.length)
        return null;

      return {
        geometry: route.geometry.coordinates.map(([longitude, latitude]) => ({
          latitude,
          longitude,
        })),
        distanceKm: route.distance / 1000,
      };
    } catch (error) {
      this.logger.warn(
        `El motor de rutas no respondió (${this.baseUrl}): ${(error as Error).message}`,
      );
      return null;
    }
  }
}
