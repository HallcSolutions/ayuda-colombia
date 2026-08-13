import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealType } from '../common/constants/app.constants';
import { ReliefPointsService } from '../relief-points/relief-points.service';
import { MealServiceEntity } from './infrastructure/entities/meal-service.entity';
import { MealsGateway } from './meals.gateway';
import { MealsService } from './meals.service';

const mealEntity = (
  overrides: Partial<MealServiceEntity> = {},
): MealServiceEntity =>
  ({
    id: 'meal-1',
    reliefPointId: 'point-1',
    mealType: MealType.LUNCH,
    servedOn: '2026-08-13',
    startsAt: '12:00',
    portionsPlanned: 200,
    portionsDelivered: 0,
    notes: '',
    createdAt: new Date('2026-08-13T09:00:00Z'),
    updatedAt: new Date('2026-08-13T09:00:00Z'),
    ...overrides,
  }) as MealServiceEntity;

describe('MealsService', () => {
  let service: MealsService;
  let repository: jest.Mocked<Repository<MealServiceEntity>>;
  let gateway: { mealServiceCreated: jest.Mock; mealServiceUpdated: jest.Mock };
  let reliefPointsService: { findEntity: jest.Mock };

  beforeEach(async () => {
    repository = {
      create: jest.fn((values) =>
        mealEntity(values as Partial<MealServiceEntity>),
      ),
      save: jest.fn((entity: MealServiceEntity) => Promise.resolve(entity)),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<MealServiceEntity>>;
    gateway = { mealServiceCreated: jest.fn(), mealServiceUpdated: jest.fn() };
    reliefPointsService = {
      findEntity: jest.fn().mockResolvedValue({ id: 'point-1' }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        MealsService,
        {
          provide: getRepositoryToken(MealServiceEntity),
          useValue: repository,
        },
        { provide: MealsGateway, useValue: gateway },
        { provide: ReliefPointsService, useValue: reliefPointsService },
      ],
    }).compile();

    service = moduleRef.get(MealsService);
  });

  describe('create', () => {
    const dto = {
      reliefPointId: 'point-1',
      mealType: MealType.LUNCH,
      servedOn: '2026-08-13',
      startsAt: '12:00',
      portionsPlanned: 200,
    };

    it('registra la jornada y la publica en tiempo real', async () => {
      const mealService = await service.create(dto);

      expect(reliefPointsService.findEntity).toHaveBeenCalledWith('point-1');
      expect(mealService.portionsDelivered).toBe(0);
      expect(gateway.mealServiceCreated).toHaveBeenCalledWith(mealService);
    });

    it('no registra comidas en puntos inexistentes', async () => {
      reliefPointsService.findEntity.mockRejectedValueOnce(
        new NotFoundException(),
      );

      await expect(
        service.create({ ...dto, reliefPointId: 'ghost' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.save.mock.calls).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('actualiza las raciones entregadas y avisa a la red', async () => {
      repository.findOneBy.mockResolvedValue(mealEntity());

      const mealService = await service.update('meal-1', {
        portionsDelivered: 180,
      });

      expect(mealService.portionsDelivered).toBe(180);
      expect(mealService.portionsPlanned).toBe(200);
      expect(gateway.mealServiceUpdated).toHaveBeenCalledWith(mealService);
    });

    it('conserva los valores que no se envían', async () => {
      repository.findOneBy.mockResolvedValue(
        mealEntity({ notes: 'Menú del día' }),
      );

      const mealService = await service.update('meal-1', {
        portionsDelivered: 10,
      });

      expect(mealService.notes).toBe('Menú del día');
      expect(mealService.startsAt).toBe('12:00');
    });

    it('falla cuando la jornada no existe', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('ghost', { portionsDelivered: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
