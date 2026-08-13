import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReliefPointStatus } from '../common/constants/app.constants';
import { applyRegionFilters } from '../common/database/region-filters';
import {
  ReliefPoint,
  ReliefPointSummary,
} from '../common/interfaces/relief-point.interface';
import { CreateReliefPointDto } from './dto/create-relief-point.dto';
import { UpdateReliefPointDto } from './dto/update-relief-point.dto';
import { ReliefPointEntity } from './infrastructure/entities/relief-point.entity';
import { ReliefPointFilters } from './interfaces/relief-point-filters.interface';
import { ReliefPointsGateway } from './relief-points.gateway';

@Injectable()
export class ReliefPointsService {
  constructor(
    @InjectRepository(ReliefPointEntity)
    private readonly repository: Repository<ReliefPointEntity>,
    private readonly gateway: ReliefPointsGateway,
  ) {}

  async findAll(filters: ReliefPointFilters): Promise<ReliefPoint[]> {
    const query = this.repository
      .createQueryBuilder('point')
      .orderBy('point.department', 'ASC')
      .addOrderBy('point.municipality', 'ASC')
      .addOrderBy('point.name', 'ASC');
    if (filters.type)
      query.andWhere('point.type = :type', { type: filters.type });
    if (filters.status)
      query.andWhere('point.status = :status', { status: filters.status });
    applyRegionFilters(query, 'point', filters);
    return (await query.getMany()).map((entity) => this.toContract(entity));
  }

  async findOne(id: string): Promise<ReliefPoint> {
    return this.toContract(await this.findEntity(id));
  }

  async create(dto: CreateReliefPointDto): Promise<ReliefPoint> {
    const entity = this.repository.create({
      name: dto.name.trim(),
      type: dto.type,
      department: dto.department.trim(),
      municipality: dto.municipality.trim(),
      addressReference: dto.addressReference.trim(),
      latitude: dto.latitude,
      longitude: dto.longitude,
      contactName: dto.contactName.trim(),
      contactPhone: dto.contactPhone.trim(),
      schedule: dto.schedule.trim(),
      dailyMealCapacity: dto.dailyMealCapacity ?? null,
      notes: dto.notes?.trim() ?? '',
      status: ReliefPointStatus.ACTIVE,
    });
    const point = this.toContract(await this.repository.save(entity));
    this.gateway.pointCreated(point);
    return point;
  }

  async update(id: string, dto: UpdateReliefPointDto): Promise<ReliefPoint> {
    const entity = await this.findEntity(id);
    if (dto.status) entity.status = dto.status;
    if (dto.schedule !== undefined) entity.schedule = dto.schedule.trim();
    if (dto.contactName !== undefined)
      entity.contactName = dto.contactName.trim();
    if (dto.contactPhone !== undefined)
      entity.contactPhone = dto.contactPhone.trim();
    if (dto.dailyMealCapacity !== undefined)
      entity.dailyMealCapacity = dto.dailyMealCapacity;
    if (dto.notes !== undefined) entity.notes = dto.notes.trim();
    if (dto.latitude !== undefined) entity.latitude = dto.latitude;
    if (dto.longitude !== undefined) entity.longitude = dto.longitude;
    const point = this.toContract(await this.repository.save(entity));
    this.gateway.pointUpdated(point);
    return point;
  }

  async findEntity(id: string): Promise<ReliefPointEntity> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity)
      throw new NotFoundException('El punto de acopio solicitado no existe');
    return entity;
  }

  toSummary(entity: ReliefPointEntity): ReliefPointSummary {
    return {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      department: entity.department,
      municipality: entity.municipality,
      latitude: entity.latitude,
      longitude: entity.longitude,
    };
  }

  private toContract(entity: ReliefPointEntity): ReliefPoint {
    return {
      ...this.toSummary(entity),
      addressReference: entity.addressReference,
      contactName: entity.contactName,
      contactPhone: entity.contactPhone,
      schedule: entity.schedule,
      dailyMealCapacity: entity.dailyMealCapacity,
      status: entity.status,
      notes: entity.notes,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
