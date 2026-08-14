import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertStatus } from '../common/constants/app.constants';
import { applyRegionFilters } from '../common/database/region-filters';
import { AidAlert } from '../common/interfaces/aid-alert.interface';
import { ReliefPointsService } from '../relief-points/relief-points.service';
import { CreateAidAlertDto } from './dto/create-aid-alert.dto';
import { AidAlertEntity } from './infrastructure/entities/aid-alert.entity';
import { AidAlertFilters } from './interfaces/aid-alert-filters.interface';
import { AlertsGateway } from './alerts.gateway';
import { splitNeeds, withoutNeed } from './needs.util';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(AidAlertEntity)
    private readonly repository: Repository<AidAlertEntity>,
    private readonly reliefPointsService: ReliefPointsService,
    private readonly gateway: AlertsGateway,
  ) {}

  async findAll(filters: AidAlertFilters): Promise<AidAlert[]> {
    const query = this.repository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.reliefPoint', 'reliefPoint')
      .orderBy('alert.createdAt', 'DESC');
    if (filters.status)
      query.andWhere('alert.status = :status', { status: filters.status });
    if (filters.category)
      query.andWhere('alert.category = :category', {
        category: filters.category,
      });
    if (filters.reliefPointId) {
      query.andWhere('alert.reliefPointId = :reliefPointId', {
        reliefPointId: filters.reliefPointId,
      });
    }
    applyRegionFilters(query, 'reliefPoint', filters);
    return (await query.getMany()).map((entity) => this.toContract(entity));
  }

  async create(dto: CreateAidAlertDto): Promise<AidAlert> {
    const reliefPoint = await this.reliefPointsService.findEntity(
      dto.reliefPointId,
    );
    const entity = this.repository.create({
      reliefPointId: reliefPoint.id,
      reliefPoint,
      category: dto.category,
      severity: dto.severity,
      title: dto.title.trim(),
      message: dto.message.trim(),
      requestedQuantity: dto.requestedQuantity?.trim() ?? '',
      createdBy: dto.createdBy.trim(),
      status: AlertStatus.ACTIVE,
      resolvedAt: null,
    });
    const alert = this.toContract(await this.repository.save(entity));
    this.gateway.alertCreated(alert);
    return alert;
  }

  /**
   * Quien atiende el punto retira solo lo que ya no hace falta ("los guantes ya
   * llegaron") y lo demás sigue pidiéndose. Cuando se retira lo último, la alerta
   * se cierra sola: no queda una petición vacía en el mapa.
   */
  async removeNeed(id: string, need: string): Promise<AidAlert> {
    const entity = await this.findEntity(id);
    if (entity.status === AlertStatus.RESOLVED) return this.toContract(entity);

    const needs = splitNeeds(entity);
    const remaining = withoutNeed(needs, need);
    // Otra brigada pudo retirarla antes: sin cambios se devuelve la alerta tal cual.
    if (remaining.length === needs.length) return this.toContract(entity);
    if (!remaining.length) return this.resolve(id);

    entity.message = remaining.join(', ');
    const alert = this.toContract(await this.repository.save(entity));
    this.gateway.alertUpdated(alert);
    return alert;
  }

  async resolve(id: string): Promise<AidAlert> {
    const entity = await this.findEntity(id);
    if (entity.status === AlertStatus.RESOLVED) {
      throw new ConflictException('Esta alerta ya fue marcada como atendida');
    }
    entity.status = AlertStatus.RESOLVED;
    entity.resolvedAt = new Date();
    const alert = this.toContract(await this.repository.save(entity));
    this.gateway.alertResolved(alert);
    return alert;
  }

  private async findEntity(id: string): Promise<AidAlertEntity> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: { reliefPoint: true },
    });
    if (!entity) throw new NotFoundException('La alerta solicitada no existe');
    return entity;
  }

  private toContract(entity: AidAlertEntity): AidAlert {
    return {
      id: entity.id,
      reliefPointId: entity.reliefPointId,
      reliefPoint: this.reliefPointsService.toSummary(entity.reliefPoint),
      category: entity.category,
      severity: entity.severity,
      title: entity.title,
      message: entity.message,
      requestedQuantity: entity.requestedQuantity,
      status: entity.status,
      createdBy: entity.createdBy,
      resolvedAt: entity.resolvedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
