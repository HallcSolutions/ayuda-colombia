import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConvoyStatus,
  ReliefPointStatus,
  ReliefPointType,
  RouteSource,
  SupplyCategory,
} from '../common/constants/app.constants';
import { ConvoyTrip } from '../common/interfaces/convoy-trip.interface';
import { createEditPin } from '../common/security/edit-pin';
import { ReliefPointEntity } from '../relief-points/infrastructure/entities/relief-point.entity';
import { ReliefPointsService } from '../relief-points/relief-points.service';
import { ConvoysGateway } from './convoys.gateway';
import { ConvoysService } from './convoys.service';
import { ConvoyPingEntity } from './infrastructure/entities/convoy-ping.entity';
import { ConvoyTripEntity } from './infrastructure/entities/convoy-trip.entity';
import { RoutingService } from './routing.service';

// PIN real generado una vez: los tests usan su hash y su valor en claro.
const knownPin = createEditPin();

/** Acopio de destino en Cali; el camión sale de Bogotá. */
const destination = (): ReliefPointEntity => ({
  id: 'point-1',
  name: 'Acopio Unidad Deportiva',
  type: ReliefPointType.COLLECTION_CENTER,
  department: 'Valle del Cauca',
  municipality: 'Cali',
  addressReference: 'Calle 5',
  latitude: 3.4516,
  longitude: -76.532,
  contactName: 'Ana',
  contactPhone: '3001112233',
  schedule: '8:00 a 18:00',
  dailyMealCapacity: null,
  status: ReliefPointStatus.ACTIVE,
  notes: '',
  createdAt: new Date('2026-08-10T12:00:00Z'),
  updatedAt: new Date('2026-08-10T12:00:00Z'),
});

const tripEntity = (
  overrides: Partial<ConvoyTripEntity> = {},
): ConvoyTripEntity => ({
  id: 'trip-1',
  driverName: 'Jorge Rendón',
  contactPhone: '3010001122',
  vehiclePlate: 'SXK123',
  vehicleDescription: 'Camión sencillo de 5 toneladas',
  cargo: [SupplyCategory.WATER, SupplyCategory.FOOD],
  cargoNotes: '',
  originDepartment: 'Bogotá D.C.',
  originMunicipality: 'Bogotá',
  destinationPointId: 'point-1',
  destination: destination(),
  departureAt: new Date('2026-08-13T12:00:00Z'),
  status: ConvoyStatus.EN_ROUTE,
  shareLocation: true,
  latitude: null,
  longitude: null,
  lastPingAt: null,
  speedKmh: null,
  remainingKm: null,
  etaAt: null,
  routeGeometry: [],
  routeSource: null,
  routeUpdatedAt: null,
  arrivedAt: null,
  editPinHash: knownPin.hash,
  createdAt: new Date('2026-08-13T11:00:00Z'),
  updatedAt: new Date('2026-08-13T11:00:00Z'),
  ...overrides,
});

/** Ibagué: a mitad de camino entre Bogotá y Cali. */
const onTheRoad = { latitude: 4.4389, longitude: -75.2322 };

describe('ConvoysService', () => {
  let service: ConvoysService;
  let trips: jest.Mocked<Repository<ConvoyTripEntity>>;
  let pings: jest.Mocked<Repository<ConvoyPingEntity>>;
  /** Se guardan aparte porque los tests preguntan por ellas, no solo el servicio. */
  let savePing: jest.Mock;
  let deletePings: jest.Mock;
  let routing: { findRoad: jest.Mock };
  let gateway: {
    tripCreated: jest.Mock<void, [ConvoyTrip]>;
    tripMoved: jest.Mock<void, [ConvoyTrip]>;
    tripUpdated: jest.Mock<void, [ConvoyTrip]>;
  };

  beforeEach(async () => {
    trips = {
      create: jest.fn((values) =>
        tripEntity(values as Partial<ConvoyTripEntity>),
      ),
      save: jest.fn((entity: ConvoyTripEntity) => Promise.resolve(entity)),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<ConvoyTripEntity>>;
    savePing = jest.fn((entity: ConvoyPingEntity) => Promise.resolve(entity));
    deletePings = jest.fn().mockResolvedValue({ affected: 0 });
    pings = {
      create: jest.fn((values) => values as ConvoyPingEntity),
      save: savePing,
      find: jest.fn().mockResolvedValue([]),
      delete: deletePings,
    } as unknown as jest.Mocked<Repository<ConvoyPingEntity>>;
    routing = { findRoad: jest.fn().mockResolvedValue(null) };
    gateway = {
      tripCreated: jest.fn<void, [ConvoyTrip]>(),
      tripMoved: jest.fn<void, [ConvoyTrip]>(),
      tripUpdated: jest.fn<void, [ConvoyTrip]>(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ConvoysService,
        { provide: getRepositoryToken(ConvoyTripEntity), useValue: trips },
        { provide: getRepositoryToken(ConvoyPingEntity), useValue: pings },
        {
          provide: ReliefPointsService,
          useValue: {
            findEntity: jest.fn().mockResolvedValue(destination()),
            toSummary: (entity: ReliefPointEntity) => ({
              id: entity.id,
              name: entity.name,
              type: entity.type,
              department: entity.department,
              municipality: entity.municipality,
              latitude: entity.latitude,
              longitude: entity.longitude,
            }),
          },
        },
        { provide: RoutingService, useValue: routing },
        { provide: ConvoysGateway, useValue: gateway },
      ],
    }).compile();

    service = moduleRef.get(ConvoysService);
  });

  describe('create', () => {
    const dto = {
      driverName: 'Jorge Rendón',
      contactPhone: '3010001122',
      vehiclePlate: 'sxk123',
      vehicleDescription: 'Camión sencillo de 5 toneladas',
      cargo: [SupplyCategory.WATER],
      originDepartment: 'Bogotá D.C.',
      originMunicipality: 'Bogotá',
      destinationPointId: 'point-1',
      departureAt: '2026-08-13T12:00:00.000Z',
      shareLocation: true,
    };

    it('entrega el PIN una sola vez y guarda solo su hash', async () => {
      const published = await service.create(dto);

      expect(published.editPin).toHaveLength(6);
      const saved = trips.save.mock.calls[0][0] as ConvoyTripEntity;
      expect(saved.editPinHash).not.toContain(published.editPin);
    });

    it('anuncia el viaje sin el PIN y todavía sin recorrido', async () => {
      await service.create(dto);

      const announced = gateway.tripCreated.mock.calls[0][0];
      expect(announced).not.toHaveProperty('editPin');
      expect(announced.status).toBe(ConvoyStatus.SCHEDULED);
      expect(announced.trail).toEqual([]);
      expect(announced.etaAt).toBeNull();
    });
  });

  describe('addPing', () => {
    const position = {
      latitude: onTheRoad.latitude,
      longitude: onTheRoad.longitude,
    };

    it('rechaza a quien no tiene el PIN del viaje', async () => {
      trips.findOne.mockResolvedValue(tripEntity());

      await expect(
        service.addPing('trip-1', position, '000000'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('no acepta posiciones de un viaje que no autorizó el rastreo', async () => {
      trips.findOne.mockResolvedValue(
        tripEntity({ shareLocation: false, status: ConvoyStatus.SCHEDULED }),
      );

      await expect(
        service.addPing('trip-1', position, knownPin.pin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('avisa cuando el viaje no existe', async () => {
      trips.findOne.mockResolvedValue(null);

      await expect(
        service.addPing('trip-1', position, knownPin.pin),
      ).rejects.toThrow(NotFoundException);
    });

    it('sigue la carretera del motor de rutas y proyecta la llegada', async () => {
      trips.findOne.mockResolvedValue(
        tripEntity({ status: ConvoyStatus.SCHEDULED }),
      );
      routing.findRoad.mockResolvedValue({
        geometry: [onTheRoad, { latitude: 3.4516, longitude: -76.532 }],
        distanceKm: 225,
      });

      const trip = await service.addPing('trip-1', position, knownPin.pin);

      // La primera señal pone el viaje en camino sin que nadie lo declare.
      expect(trip.status).toBe(ConvoyStatus.EN_ROUTE);
      expect(trip.routeSource).toBe(RouteSource.ROAD);
      expect(trip.remainingKm).toBe(225);
      expect(trip.remainingRoute).toHaveLength(2);
      expect(trip.trail).toEqual([position]);
      // Sin marcha medida todavía, la referencia son 45 km/h: 225 km son cinco horas.
      const hoursAhead =
        (new Date(trip.etaAt!).getTime() - Date.now()) / 3_600_000;
      expect(hoursAhead).toBeCloseTo(5, 1);
      expect(gateway.tripMoved).toHaveBeenCalledWith(trip);
    });

    it('mide en línea recta con castigo de carretera si el motor no responde', async () => {
      trips.findOne.mockResolvedValue(tripEntity());

      const trip = await service.addPing('trip-1', position, knownPin.pin);

      expect(trip.routeSource).toBe(RouteSource.STRAIGHT_LINE);
      expect(trip.remainingRoute).toEqual([]);
      // 165 km en línea recta hasta Cali, corregidos por lo que la carretera da de vueltas.
      expect(trip.remainingKm).toBeGreaterThan(200);
    });

    it('no repite la miga cuando el camión no se ha movido', async () => {
      trips.findOne.mockResolvedValue(tripEntity());
      pings.find.mockResolvedValue([
        {
          tripId: 'trip-1',
          latitude: position.latitude,
          longitude: position.longitude,
          recordedAt: new Date(),
        } as ConvoyPingEntity,
      ]);

      const trip = await service.addPing('trip-1', position, knownPin.pin);

      expect(savePing).not.toHaveBeenCalled();
      expect(trip.trail).toHaveLength(1);
    });

    it('da el viaje por llegado al entrar al acopio', async () => {
      trips.findOne.mockResolvedValue(tripEntity());

      const trip = await service.addPing(
        'trip-1',
        { latitude: 3.4518, longitude: -76.5321 },
        knownPin.pin,
      );

      expect(trip.status).toBe(ConvoyStatus.ARRIVED);
      expect(trip.arrivedAt).not.toBeNull();
      expect(trip.remainingKm).toBe(0);
      expect(trip.remainingRoute).toEqual([]);
    });
  });

  describe('update', () => {
    it('borra el camino recorrido al retirar el permiso de rastreo', async () => {
      trips.findOne.mockResolvedValue(
        tripEntity({ latitude: 4.4389, longitude: -75.2322 }),
      );

      const trip = await service.update(
        'trip-1',
        { shareLocation: false },
        knownPin.pin,
      );

      expect(deletePings).toHaveBeenCalledWith({ tripId: 'trip-1' });
      expect(trip.position).toBeNull();
      expect(trip.etaAt).toBeNull();
      expect(trip.trail).toEqual([]);
      expect(trip.status).toBe(ConvoyStatus.PAUSED);
      expect(gateway.tripUpdated).toHaveBeenCalledWith(trip);
    });

    it('deja marcar la llegada a mano y cierra la cuenta regresiva', async () => {
      trips.findOne.mockResolvedValue(tripEntity());

      const trip = await service.update(
        'trip-1',
        { status: ConvoyStatus.ARRIVED },
        knownPin.pin,
      );

      expect(trip.status).toBe(ConvoyStatus.ARRIVED);
      expect(trip.arrivedAt).toBe(trip.etaAt);
      expect(trip.remainingKm).toBe(0);
    });
  });
});
