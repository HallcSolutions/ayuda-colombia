import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { applyRegionFilters } from '../../../common/database/region-filters';
import { ReportFilters } from '../../interfaces/report-filters.interface';
import { ReportEntity } from '../entities/report.entity';

@Injectable()
export class ReportsRepository {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly repository: Repository<ReportEntity>,
  ) {}

  create(values: Partial<ReportEntity>): ReportEntity {
    return this.repository.create(values);
  }

  findById(id: string): Promise<ReportEntity | null> {
    return this.repository.findOneBy({ id });
  }

  findAll(filters: ReportFilters): Promise<ReportEntity[]> {
    const query = this.repository
      .createQueryBuilder('report')
      .orderBy('report.createdAt', 'DESC');

    applyRegionFilters(query, 'report', filters);
    if (filters.need) {
      query.andWhere('report.needs @> :need::jsonb', {
        need: JSON.stringify([filters.need]),
      });
    }
    if (filters.status) {
      query.andWhere('report.status = :status', { status: filters.status });
    }

    return query.getMany();
  }

  save(entity: ReportEntity): Promise<ReportEntity> {
    return this.repository.save(entity);
  }
}
