import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AlertStatus,
  ReliefPointStatus,
  ReliefPointType,
  SupplyCategory,
  UrgencyLevel,
} from '../common/constants/app.constants';
import { ReliefPointEntity } from '../relief-points/infrastructure/entities/relief-point.entity';
import { ReliefPointsService } from '../relief-points/relief-points.service';
import { AlertsGateway } from './alerts.gateway';
import { AlertsService } from './alerts.service';
import { AidAlertEntity } from './infrastructure/entities/aid-alert.entity';

const reliefPoint = (): ReliefPointEntity => ({
  id: 'point-1',
  name: 'Comedor Salón Comunal',
  type: ReliefPointType.COMMUNITY_KITCHEN,
  department: 'Valle del Cauca',
  municipality: 'Yumbo',
  addressReference: 'Acopi, calle 15',
  latitude: 3.55,
  longitude: -76.5,
  contactName: 'Ana',
  contactPhone: '3001234567',
  schedule: '7:00 a 19:00',
  dailyMealCapacity: 300,
  status: ReliefPointStatus.ACTIVE,
  notes: '',
  createdAt: new Date('2026-08-13T10:00:00Z'),
  updatedAt: new Date('2026-08-13T10:00:00Z'),
});

const alertEntity = (
  overrides: Partial<AidAlertEntity> = {},
): AidAlertEntity => ({
  id: 'alert-1',
  reliefPointId: 'point-1',
  reliefPoint: reliefPoint(),
  category: SupplyCategory.FOOD,
  severity: UrgencyLevel.CRITICAL,
  title: 'Sin alimentos para el almuerzo',
  message: 'Faltan 200 raciones',
  requestedQuantity: '200 raciones',
  status: AlertStatus.ACTIVE,
  createdBy: 'Brigada 1',
  resolvedAt: null,
  createdAt: new Date('2026-08-13T12:00:00Z'),
  updatedAt: new Date('2026-08-13T12:00:00Z'),
  ...overrides,
});

describe('AlertsService', () => {
  let service: AlertsService;
  let repository: jest.Mocked<Repository<AidAlertEntity>>;
  let gateway: {
    alertCreated: jest.Mock;
    alertUpdated: jest.Mock;
    alertResolved: jest.Mock;
  };
  let reliefPointsService: { findEntity: jest.Mock; toSummary: jest.Mock };

  beforeEach(async () => {
    repository = {
      create: jest.fn((values) =>
        alertEntity(values as Partial<AidAlertEntity>),
      ),
      save: jest.fn((entity: AidAlertEntity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<AidAlertEntity>>;
    gateway = {
      alertCreated: jest.fn(),
      alertUpdated: jest.fn(),
      alertResolved: jest.fn(),
    };
    reliefPointsService = {
      findEntity: jest.fn().mockResolvedValue(reliefPoint()),
      toSummary: jest.fn((entity: ReliefPointEntity) => ({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        department: entity.department,
        municipality: entity.municipality,
        latitude: entity.latitude,
        longitude: entity.longitude,
      })),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: getRepositoryToken(AidAlertEntity), useValue: repository },
        { provide: AlertsGateway, useValue: gateway },
        { provide: ReliefPointsService, useValue: reliefPointsService },
      ],
    }).compile();

    service = moduleRef.get(AlertsService);
  });

  describe('create', () => {
    const dto = {
      reliefPointId: 'point-1',
      category: SupplyCategory.FOOD,
      severity: UrgencyLevel.CRITICAL,
      title: '  Sin alimentos para el almuerzo  ',
      message: '  Faltan 200 raciones  ',
      requestedQuantity: ' 200 raciones ',
      createdBy: ' Brigada 1 ',
    };

    it('difunde la alerta a toda la red con el punto que la necesita', async () => {
      const alert = await service.create(dto);

      expect(reliefPointsService.findEntity).toHaveBeenCalledWith('point-1');
      expect(gateway.alertCreated).toHaveBeenCalledWith(alert);
      expect(alert.reliefPoint.municipality).toBe('Yumbo');
      expect(alert.reliefPoint.department).toBe('Valle del Cauca');
      expect(alert.status).toBe(AlertStatus.ACTIVE);
    });

    it('normaliza los textos antes de guardarlos', async () => {
      await service.create(dto);

      expect(repository.create.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          title: 'Sin alimentos para el almuerzo',
          message: 'Faltan 200 raciones',
          requestedQuantity: '200 raciones',
          createdBy: 'Brigada 1',
        }),
      );
    });

    it('rechaza alertas de puntos inexistentes', async () => {
      reliefPointsService.findEntity.mockRejectedValueOnce(
        new NotFoundException(),
      );

      await expect(
        service.create({ ...dto, reliefPointId: 'ghost' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(gateway.alertCreated).not.toHaveBeenCalled();
    });
  });

  describe('resolve', () => {
    it('marca la alerta como atendida y avisa a la red', async () => {
      repository.findOne.mockResolvedValue(alertEntity());

      const alert = await service.resolve('alert-1');

      expect(alert.status).toBe(AlertStatus.RESOLVED);
      expect(alert.resolvedAt).not.toBeNull();
      expect(gateway.alertResolved).toHaveBeenCalledWith(alert);
    });

    it('no permite cerrar dos veces la misma alerta', async () => {
      repository.findOne.mockResolvedValue(
        alertEntity({ status: AlertStatus.RESOLVED }),
      );

      await expect(service.resolve('alert-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(gateway.alertResolved).not.toHaveBeenCalled();
    });

    it('falla cuando la alerta no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.resolve('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('removeNeed', () => {
    const withNeeds = () =>
      alertEntity({
        message: 'Guantes de construcción, gafas de seguridad, cascos',
      });

    it('retira solo lo que ya llegó y deja pedido el resto', async () => {
      repository.findOne.mockResolvedValue(withNeeds());

      const alert = await service.removeNeed(
        'alert-1',
        'Guantes de construcción',
      );

      expect(alert.message).toBe('gafas de seguridad, cascos');
      expect(alert.status).toBe(AlertStatus.ACTIVE);
      expect(gateway.alertUpdated).toHaveBeenCalledWith(alert);
      expect(gateway.alertResolved).not.toHaveBeenCalled();
    });

    it('compara sin acentos ni mayúsculas, como se ve en pantalla', async () => {
      repository.findOne.mockResolvedValue(withNeeds());

      const alert = await service.removeNeed('alert-1', 'GAFAS DE SEGURIDAD');

      expect(alert.message).toBe('Guantes de construcción, cascos');
    });

    it('cierra la alerta cuando se retira la última necesidad', async () => {
      repository.findOne.mockResolvedValue(alertEntity({ message: 'Cascos' }));

      const alert = await service.removeNeed('alert-1', 'Cascos');

      expect(alert.status).toBe(AlertStatus.RESOLVED);
      expect(gateway.alertResolved).toHaveBeenCalledWith(alert);
      expect(gateway.alertUpdated).not.toHaveBeenCalled();
    });

    it('no cambia nada si otra brigada ya la había retirado', async () => {
      repository.findOne.mockResolvedValue(withNeeds());

      const alert = await service.removeNeed('alert-1', 'Pañales');

      expect(alert.message).toBe(
        'Guantes de construcción, gafas de seguridad, cascos',
      );
      expect(repository.save.mock.calls).toHaveLength(0);
      expect(gateway.alertUpdated).not.toHaveBeenCalled();
    });

    it('deja retirar la alerta que no enumera nada, por su titular', async () => {
      repository.findOne.mockResolvedValue(alertEntity({ message: '' }));

      const alert = await service.removeNeed(
        'alert-1',
        'Sin alimentos para el almuerzo',
      );

      expect(alert.status).toBe(AlertStatus.RESOLVED);
    });
  });
});
