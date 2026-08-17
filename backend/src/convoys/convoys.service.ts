import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { ConvoyStatus, RouteSource } from '../common/constants/app.constants';
import { applyRegionFilters } from '../common/database/region-filters';
import {
  ConvoyTrip,
  GeoPoint,
  PublishedConvoyTrip,
} from '../common/interfaces/convoy-trip.interface';
import { createEditPin, matchesEditPin } from '../common/security/edit-pin';
import { ReliefPointsService } from '../relief-points/relief-points.service';
import { ConvoysGateway } from './convoys.gateway';
import { AddConvoyPingDto } from './dto/add-convoy-ping.dto';
import { CreateConvoyTripDto } from './dto/create-convoy-trip.dto';
import { UpdateConvoyTripDto } from './dto/update-convoy-trip.dto';
import { distanceKm, downsample, routeAhead } from './geo';
import { ConvoyPingEntity } from './infrastructure/entities/convoy-ping.entity';
import { ConvoyTripEntity } from './infrastructure/entities/convoy-trip.entity';
import { ConvoyFilters } from './interfaces/convoy-filters.interface';
import { TrailPoint, estimateArrival, observedSpeedKmh } from './tracking';
import { RoutingService } from './routing.service';

/** Cuánto tiene que avanzar el camión para que la señal se guarde como parte del camino. */
const MIN_TRAIL_METERS = 60;
/** Tope de migas por viaje: el camino se dibuja completo sin engordar la tabla. */
const MAX_TRAIL_POINTS = 240;
/** Cada cuánto se le vuelve a preguntar la carretera al motor de rutas. */
const ROUTE_MAX_AGE_MINUTES = 6;
/**
 * Separación de la carretera guardada que indica que el camión tomó otro camino. Se mide
 * contra los vértices que quedaron tras recortar la ruta, y en un viaje largo esos vértices
 * están a kilómetros unos de otros: por debajo de esto, un camión bien encarrilado haría
 * pedir una ruta nueva en cada señal.
 */
const ROUTE_DEVIATION_KM = 3;
/** Detalle con el que viaja la carretera al navegador. */
const ROUTE_MAX_POINTS = 200;
/** Detalle con el que viaja el camino recorrido al navegador. */
const TRAIL_MAX_POINTS = 80;
/** Una carretera nunca es la línea recta: sin motor de rutas, se corrige con esto. */
const STRAIGHT_LINE_ROAD_FACTOR = 1.35;
/** A esta distancia del acopio el viaje se da por llegado. */
const ARRIVAL_RADIUS_KM = 0.4;
/** El camino recorrido se guarda estas horas después de llegar, y luego se borra. */
const TRAIL_RETENTION_HOURS = 12;
/** Cada cuánto se hace esa limpieza, como mucho. */
const PURGE_EVERY_MINUTES = 15;

/** Orden en que se muestran los viajes: primero el que ya viene en camino. */
const STATUS_ORDER = [
  ConvoyStatus.EN_ROUTE,
  ConvoyStatus.SCHEDULED,
  ConvoyStatus.PAUSED,
  ConvoyStatus.ARRIVED,
  ConvoyStatus.CANCELLED,
];

/** Un viaje sigue vivo mientras no haya llegado ni se haya cancelado. */
const isActive = (trip: ConvoyTripEntity): boolean =>
  trip.status === ConvoyStatus.EN_ROUTE || trip.status === ConvoyStatus.PAUSED;

@Injectable()
export class ConvoysService {
  /** Momento de la última limpieza de caminos vencidos. */
  private lastPurgeAt = 0;

  constructor(
    @InjectRepository(ConvoyTripEntity)
    private readonly trips: Repository<ConvoyTripEntity>,
    @InjectRepository(ConvoyPingEntity)
    private readonly pings: Repository<ConvoyPingEntity>,
    private readonly reliefPoints: ReliefPointsService,
    private readonly routing: RoutingService,
    private readonly gateway: ConvoysGateway,
  ) {}

  async findAll(filters: ConvoyFilters): Promise<ConvoyTrip[]> {
    await this.purgeExpiredTrails();

    const query = this.trips
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.destination', 'destination')
      .orderBy(this.statusOrderSql(), 'ASC')
      .addOrderBy('trip.etaAt', 'ASC', 'NULLS LAST')
      .addOrderBy('trip.departureAt', 'ASC');
    if (filters.status)
      query.andWhere('trip.status = :status', { status: filters.status });
    if (filters.destinationPointId) {
      query.andWhere('trip.destinationPointId = :destinationPointId', {
        destinationPointId: filters.destinationPointId,
      });
    }
    applyRegionFilters(query, 'destination', filters);

    const entities = await query.getMany();
    const trails = await this.trailsOf(entities);
    return entities.map((entity) =>
      this.toContract(entity, trails.get(entity.id) ?? []),
    );
  }

  async findOne(id: string): Promise<ConvoyTrip> {
    const entity = await this.findEntity(id);
    return this.toContract(entity, await this.trailOf(entity));
  }

  async create(dto: CreateConvoyTripDto): Promise<PublishedConvoyTrip> {
    const destination = await this.reliefPoints.findEntity(
      dto.destinationPointId,
    );
    const editPin = createEditPin();
    const entity = this.trips.create({
      driverName: dto.driverName.trim(),
      contactPhone: dto.contactPhone.trim(),
      vehiclePlate: dto.vehiclePlate?.trim().toUpperCase() ?? '',
      vehicleDescription: dto.vehicleDescription.trim(),
      cargo: dto.cargo,
      cargoNotes: dto.cargoNotes?.trim() ?? '',
      originDepartment: dto.originDepartment.trim(),
      originMunicipality: dto.originMunicipality.trim(),
      destinationPointId: destination.id,
      destination,
      departureAt: new Date(dto.departureAt),
      status: ConvoyStatus.SCHEDULED,
      shareLocation: dto.shareLocation,
      routeGeometry: [],
      editPinHash: editPin.hash,
    });

    const trip = this.toContract(await this.trips.save(entity), []);
    // El evento en vivo lleva el contrato público; el PIN solo vuelve a quien conduce.
    this.gateway.tripCreated(trip);
    return { ...trip, editPin: editPin.pin };
  }

  /**
   * Señal de posición del camión: dibuja el camino recorrido, recalcula lo que falta por
   * carretera y adelanta o atrasa la hora de llegada que ve el acopio.
   */
  async addPing(
    id: string,
    dto: AddConvoyPingDto,
    editPin: string,
  ): Promise<ConvoyTrip> {
    const trip = await this.findEntity(id);
    this.assertPinMatches(trip, editPin);
    if (!trip.shareLocation) {
      throw new ForbiddenException(
        'Este viaje no está compartiendo su ubicación',
      );
    }
    if (!isActive(trip) && trip.status !== ConvoyStatus.SCHEDULED)
      throw new ConflictException('Este viaje ya terminó');

    const position: GeoPoint = {
      latitude: dto.latitude,
      longitude: dto.longitude,
    };
    const now = new Date();
    const trail = await this.appendToTrail(trip, position, dto, now);

    // La primera señal es la que pone el viaje en camino, sin que nadie más lo declare.
    trip.status = ConvoyStatus.EN_ROUTE;
    trip.latitude = position.latitude;
    trip.longitude = position.longitude;
    trip.lastPingAt = now;
    trip.speedKmh = observedSpeedKmh(trail, now);
    await this.refreshRoute(trip, position, now);
    this.applyArrival(trip, position, now);

    const saved = await this.trips.save(trip);
    const contract = this.toContract(saved, trail);
    this.gateway.tripMoved(contract);
    return contract;
  }

  async update(
    id: string,
    dto: UpdateConvoyTripDto,
    editPin: string,
  ): Promise<ConvoyTrip> {
    const trip = await this.findEntity(id);
    this.assertPinMatches(trip, editPin);

    if (dto.contactPhone !== undefined)
      trip.contactPhone = dto.contactPhone.trim();
    if (dto.cargoNotes !== undefined) trip.cargoNotes = dto.cargoNotes.trim();
    if (dto.departureAt !== undefined)
      trip.departureAt = new Date(dto.departureAt);
    if (dto.status) this.applyStatus(trip, dto.status);
    // Retirar el permiso apaga el rastreo y borra el camino: es la decisión de quien conduce.
    if (
      dto.shareLocation !== undefined &&
      dto.shareLocation !== trip.shareLocation
    ) {
      trip.shareLocation = dto.shareLocation;
      if (!dto.shareLocation) await this.stopTracking(trip);
    }

    const saved = await this.trips.save(trip);
    const contract = this.toContract(saved, await this.trailOf(saved));
    this.gateway.tripUpdated(contract);
    return contract;
  }

  /** Guarda la señal como miga solo si el camión avanzó, y devuelve el camino completo. */
  private async appendToTrail(
    trip: ConvoyTripEntity,
    position: GeoPoint,
    dto: AddConvoyPingDto,
    now: Date,
  ): Promise<TrailPoint[]> {
    const trail = await this.trailOf(trip);
    const last = trail[trail.length - 1];
    if (last && distanceKm(last, position) * 1000 < MIN_TRAIL_METERS)
      return trail;

    await this.pings.save(
      this.pings.create({
        tripId: trip.id,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracyMeters: dto.accuracyMeters ?? null,
        recordedAt: now,
      }),
    );
    return this.trimTrail(trip.id, [
      ...trail,
      { ...position, recordedAt: now },
    ]);
  }

  /**
   * Recorta la carretera guardada hasta donde va el camión. Solo se le vuelve a preguntar
   * al motor de rutas cuando no hay ruta, cuando se hizo vieja o cuando el camión se salió
   * de ella: así el trazo es el real sin pedirle una ruta en cada señal.
   */
  private async refreshRoute(
    trip: ConvoyTripEntity,
    position: GeoPoint,
    now: Date,
  ): Promise<void> {
    let roadDurationSeconds: number | null = null;
    let routeWasRefreshed = false;
    const ahead = routeAhead(trip.routeGeometry, position);
    const expired =
      !trip.routeUpdatedAt ||
      now.getTime() - trip.routeUpdatedAt.getTime() >
        ROUTE_MAX_AGE_MINUTES * 60_000;

    if (ahead && !expired && ahead.offRouteKm <= ROUTE_DEVIATION_KM) {
      trip.routeGeometry = ahead.points;
      trip.remainingKm = ahead.km;
    } else {
      routeWasRefreshed = true;
      const destination = this.destinationPoint(trip);
      const road = await this.routing.findRoad(position, destination);
      trip.routeGeometry = road
        ? downsample(road.geometry, ROUTE_MAX_POINTS)
        : [];
      trip.remainingKm = road
        ? road.distanceKm
        : distanceKm(position, destination) * STRAIGHT_LINE_ROAD_FACTOR;
      trip.routeSource = road ? RouteSource.ROAD : RouteSource.STRAIGHT_LINE;
      trip.routeUpdatedAt = now;
      roadDurationSeconds = road?.durationSeconds ?? null;
    }

    // OSRM ya calcula el tiempo real de conducción de esa carretera. Dividir kilómetros
    // por una velocidad fija hacía que rutas intermunicipales pudieran verse absurdamente
    // cortas. Entre recálculos se conserva la hora vial anterior; cada seis minutos se
    // vuelve a consultar desde la posición GPS más reciente.
    if (roadDurationSeconds !== null) {
      trip.etaAt = new Date(now.getTime() + roadDurationSeconds * 1000);
    } else if (
      routeWasRefreshed ||
      !trip.etaAt ||
      trip.etaAt.getTime() <= now.getTime()
    ) {
      trip.etaAt = estimateArrival(trip.remainingKm, trip.speedKmh, now);
    }
  }

  /** Llegar es cuestión de metros: al entrar al acopio el viaje se cierra solo. */
  private applyArrival(
    trip: ConvoyTripEntity,
    position: GeoPoint,
    now: Date,
  ): void {
    if (distanceKm(position, this.destinationPoint(trip)) > ARRIVAL_RADIUS_KM)
      return;
    trip.status = ConvoyStatus.ARRIVED;
    trip.arrivedAt = now;
    trip.remainingKm = 0;
    trip.etaAt = now;
    trip.routeGeometry = [];
  }

  private applyStatus(trip: ConvoyTripEntity, status: ConvoyStatus): void {
    trip.status = status;
    if (status === ConvoyStatus.ARRIVED) {
      trip.arrivedAt = new Date();
      trip.remainingKm = 0;
      trip.etaAt = trip.arrivedAt;
      trip.routeGeometry = [];
    }
    if (status === ConvoyStatus.CANCELLED) trip.etaAt = null;
  }

  /** Apaga el rastreo y borra lo recorrido: sin permiso no queda ninguna coordenada. */
  private async stopTracking(trip: ConvoyTripEntity): Promise<void> {
    await this.pings.delete({ tripId: trip.id });
    trip.latitude = null;
    trip.longitude = null;
    trip.lastPingAt = null;
    trip.speedKmh = null;
    trip.remainingKm = null;
    trip.etaAt = null;
    trip.routeGeometry = [];
    trip.routeSource = null;
    trip.routeUpdatedAt = null;
    if (trip.status === ConvoyStatus.EN_ROUTE)
      trip.status = ConvoyStatus.PAUSED;
  }

  private async trimTrail(
    tripId: string,
    trail: TrailPoint[],
  ): Promise<TrailPoint[]> {
    if (trail.length <= MAX_TRAIL_POINTS) return trail;
    const surplus = trail.slice(0, trail.length - MAX_TRAIL_POINTS);
    await this.pings.delete({
      tripId,
      recordedAt: LessThanOrEqual(surplus[surplus.length - 1].recordedAt),
    });
    return trail.slice(surplus.length);
  }

  private async trailOf(trip: ConvoyTripEntity): Promise<TrailPoint[]> {
    if (!isActive(trip)) return [];
    const pings = await this.pings.find({
      where: { tripId: trip.id },
      order: { recordedAt: 'ASC' },
    });
    return pings.map((ping) => ({
      latitude: ping.latitude,
      longitude: ping.longitude,
      recordedAt: ping.recordedAt,
    }));
  }

  /** Caminos de todos los viajes en curso en una sola consulta, no uno por viaje. */
  private async trailsOf(
    trips: ConvoyTripEntity[],
  ): Promise<Map<string, TrailPoint[]>> {
    const trails = new Map<string, TrailPoint[]>();
    const ids = trips.filter(isActive).map((trip) => trip.id);
    if (!ids.length) return trails;

    const pings = await this.pings.find({
      where: { tripId: In(ids) },
      order: { recordedAt: 'ASC' },
    });
    for (const ping of pings) {
      const trail = trails.get(ping.tripId) ?? [];
      trail.push({
        latitude: ping.latitude,
        longitude: ping.longitude,
        recordedAt: ping.recordedAt,
      });
      trails.set(ping.tripId, trail);
    }
    return trails;
  }

  /**
   * El camino de un viaje terminado deja de ser útil y pasa a ser un rastro de por dónde
   * anduvo una persona: se borra al cumplirse su retención.
   */
  private async purgeExpiredTrails(): Promise<void> {
    const now = Date.now();
    if (now - this.lastPurgeAt < PURGE_EVERY_MINUTES * 60_000) return;
    this.lastPurgeAt = now;

    await this.pings
      .createQueryBuilder()
      .delete()
      .where(
        `"tripId" IN (SELECT "id" FROM "convoy_trips" WHERE "arrivedAt" < :cutoff)`,
        { cutoff: new Date(now - TRAIL_RETENTION_HOURS * 3_600_000) },
      )
      .execute();
  }

  private statusOrderSql(): string {
    const cases = STATUS_ORDER.map(
      (status, index) => `WHEN '${status}' THEN ${index}`,
    ).join(' ');
    return `CASE trip.status ${cases} ELSE ${STATUS_ORDER.length} END`;
  }

  private destinationPoint(trip: ConvoyTripEntity): GeoPoint {
    return {
      latitude: trip.destination.latitude,
      longitude: trip.destination.longitude,
    };
  }

  /** Solo quien anunció el viaje guarda su PIN, así que es su llave para moverlo. */
  private assertPinMatches(trip: ConvoyTripEntity, editPin: string): void {
    if (!editPin || !matchesEditPin(editPin, trip.editPinHash))
      throw new UnauthorizedException('El PIN del viaje no es correcto');
  }

  private async findEntity(id: string): Promise<ConvoyTripEntity> {
    const entity = await this.trips.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('El viaje solicitado no existe');
    return entity;
  }

  private toContract(
    entity: ConvoyTripEntity,
    trail: readonly TrailPoint[],
  ): ConvoyTrip {
    return {
      id: entity.id,
      driverName: entity.driverName,
      contactPhone: entity.contactPhone,
      vehiclePlate: entity.vehiclePlate,
      vehicleDescription: entity.vehicleDescription,
      cargo: entity.cargo,
      cargoNotes: entity.cargoNotes,
      originDepartment: entity.originDepartment,
      originMunicipality: entity.originMunicipality,
      destination: this.reliefPoints.toSummary(entity.destination),
      departureAt: entity.departureAt.toISOString(),
      status: entity.status,
      shareLocation: entity.shareLocation,
      position:
        entity.latitude === null || entity.longitude === null
          ? null
          : { latitude: entity.latitude, longitude: entity.longitude },
      lastPingAt: entity.lastPingAt?.toISOString() ?? null,
      speedKmh: entity.speedKmh,
      remainingKm:
        entity.remainingKm === null
          ? null
          : Math.round(entity.remainingKm * 10) / 10,
      etaAt: entity.etaAt?.toISOString() ?? null,
      routeSource: entity.routeSource,
      arrivedAt: entity.arrivedAt?.toISOString() ?? null,
      trail: downsample(
        trail.map(({ latitude, longitude }) => ({ latitude, longitude })),
        TRAIL_MAX_POINTS,
      ),
      remainingRoute: entity.routeGeometry,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
