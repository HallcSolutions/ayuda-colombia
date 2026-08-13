import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReliefPointStatus,
  ReliefPointType,
} from '../common/constants/app.constants';
import { ReliefPointEntity } from './infrastructure/entities/relief-point.entity';
import { ReliefPointsGateway } from './relief-points.gateway';
import { ReliefPointsService } from './relief-points.service';

const pointEntity = (
  overrides: Partial<ReliefPointEntity> = {},
): ReliefPointEntity => ({
  id: 'point-1',
  name: 'Punto de acopio Acopi',
  type: ReliefPointType.COLLECTION_CENTER,
  department: 'Valle del Cauca',
  municipality: 'Yumbo',
  addressReference: 'Zona industrial Acopi',
  latitude: 3.55,
  longitude: -76.5,
  contactName: 'Ana',
  contactPhone: '3001234567',
  schedule: '7:00 a 19:00',
  dailyMealCapacity: null,
  status: ReliefPointStatus.ACTIVE,
  notes: '',
  createdAt: new Date('2026-08-13T10:00:00Z'),
  updatedAt: new Date('2026-08-13T10:00:00Z'),
  ...overrides,
});

describe('ReliefPointsService', () => {
  let service: ReliefPointsService;
  let repository: jest.Mocked<Repository<ReliefPointEntity>>;
  let gateway: { pointCreated: jest.Mock; pointUpdated: jest.Mock };

  beforeEach(async () => {
    repository = {
      create: jest.fn((values) =>
        pointEntity(values as Partial<ReliefPointEntity>),
      ),
      save: jest.fn((entity: ReliefPointEntity) => Promise.resolve(entity)),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<ReliefPointEntity>>;
    gateway = { pointCreated: jest.fn(), pointUpdated: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReliefPointsService,
        {
          provide: getRepositoryToken(ReliefPointEntity),
          useValue: repository,
        },
        { provide: ReliefPointsGateway, useValue: gateway },
      ],
    }).compile();

    service = moduleRef.get(ReliefPointsService);
  });

  it('crea el punto abierto y lo publica en tiempo real', async () => {
    const point = await service.create({
      name: ' Punto de acopio Acopi ',
      type: ReliefPointType.COLLECTION_CENTER,
      department: ' Valle del Cauca ',
      municipality: ' Yumbo ',
      addressReference: ' Zona industrial Acopi ',
      latitude: 3.55,
      longitude: -76.5,
      contactName: ' Ana ',
      contactPhone: ' 3001234567 ',
      schedule: ' 7:00 a 19:00 ',
    });

    expect(point.status).toBe(ReliefPointStatus.ACTIVE);
    expect(point.dailyMealCapacity).toBeNull();
    expect(repository.create.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        name: 'Punto de acopio Acopi',
        municipality: 'Yumbo',
      }),
    );
    expect(gateway.pointCreated).toHaveBeenCalledWith(point);
  });

  it('expone departamento y municipio en el resumen que viaja con las alertas', () => {
    const summary = service.toSummary(pointEntity());

    expect(summary).toMatchObject({
      department: 'Valle del Cauca',
      municipality: 'Yumbo',
      latitude: 3.55,
      longitude: -76.5,
    });
  });

  it('cambia el estado sin tocar el resto de los datos', async () => {
    repository.findOneBy.mockResolvedValue(pointEntity());

    const point = await service.update('point-1', {
      status: ReliefPointStatus.FULL,
    });

    expect(point.status).toBe(ReliefPointStatus.FULL);
    expect(point.schedule).toBe('7:00 a 19:00');
    expect(gateway.pointUpdated).toHaveBeenCalledWith(point);
  });

  it('falla cuando el punto no existe', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne('ghost')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
