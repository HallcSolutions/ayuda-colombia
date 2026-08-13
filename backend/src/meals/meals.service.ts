import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { applyRegionFilters } from '../common/database/region-filters';
import { MealService } from '../common/interfaces/meal-service.interface';
import { ReliefPointsService } from '../relief-points/relief-points.service';
import { CreateMealServiceDto } from './dto/create-meal-service.dto';
import { UpdateMealServiceDto } from './dto/update-meal-service.dto';
import { MealServiceEntity } from './infrastructure/entities/meal-service.entity';
import { MealServiceFilters } from './interfaces/meal-service-filters.interface';
import { MealsGateway } from './meals.gateway';

@Injectable()
export class MealsService {
  constructor(
    @InjectRepository(MealServiceEntity)
    private readonly repository: Repository<MealServiceEntity>,
    private readonly reliefPointsService: ReliefPointsService,
    private readonly gateway: MealsGateway,
  ) {}

  async findAll(filters: MealServiceFilters): Promise<MealService[]> {
    const query = this.repository
      .createQueryBuilder('meal')
      .innerJoin('meal.reliefPoint', 'reliefPoint')
      .orderBy('meal.servedOn', 'DESC')
      .addOrderBy('meal.startsAt', 'ASC');
    if (filters.reliefPointId) {
      query.andWhere('meal.reliefPointId = :reliefPointId', {
        reliefPointId: filters.reliefPointId,
      });
    }
    if (filters.servedOn)
      query.andWhere('meal.servedOn = :servedOn', {
        servedOn: filters.servedOn,
      });
    if (filters.mealType)
      query.andWhere('meal.mealType = :mealType', {
        mealType: filters.mealType,
      });
    applyRegionFilters(query, 'reliefPoint', filters);
    return (await query.getMany()).map((entity) => this.toContract(entity));
  }

  async create(dto: CreateMealServiceDto): Promise<MealService> {
    await this.reliefPointsService.findEntity(dto.reliefPointId);
    const entity = this.repository.create({
      reliefPointId: dto.reliefPointId,
      mealType: dto.mealType,
      servedOn: dto.servedOn,
      startsAt: dto.startsAt,
      portionsPlanned: dto.portionsPlanned,
      portionsDelivered: dto.portionsDelivered ?? 0,
      notes: dto.notes?.trim() ?? '',
    });
    const mealService = this.toContract(await this.repository.save(entity));
    this.gateway.mealServiceCreated(mealService);
    return mealService;
  }

  async update(id: string, dto: UpdateMealServiceDto): Promise<MealService> {
    const entity = await this.findEntity(id);
    if (dto.portionsPlanned !== undefined)
      entity.portionsPlanned = dto.portionsPlanned;
    if (dto.portionsDelivered !== undefined)
      entity.portionsDelivered = dto.portionsDelivered;
    if (dto.startsAt !== undefined) entity.startsAt = dto.startsAt;
    if (dto.notes !== undefined) entity.notes = dto.notes.trim();
    const mealService = this.toContract(await this.repository.save(entity));
    this.gateway.mealServiceUpdated(mealService);
    return mealService;
  }

  private async findEntity(id: string): Promise<MealServiceEntity> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity)
      throw new NotFoundException('La jornada de comida solicitada no existe');
    return entity;
  }

  private toContract(entity: MealServiceEntity): MealService {
    return {
      id: entity.id,
      reliefPointId: entity.reliefPointId,
      mealType: entity.mealType,
      servedOn: entity.servedOn,
      startsAt: entity.startsAt,
      portionsPlanned: entity.portionsPlanned,
      portionsDelivered: entity.portionsDelivered,
      notes: entity.notes,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
