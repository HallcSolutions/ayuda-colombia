import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportStatus } from '../common/constants/app.constants';
import { HouseReport } from '../common/interfaces/house-report.interface';
import { photoUrl } from '../common/uploads/photo-upload';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportEntity } from './infrastructure/entities/report.entity';
import { ReportsRepository } from './infrastructure/repositories/reports.repository';
import { ReportFilters } from './interfaces/report-filters.interface';
import { ReportsGateway } from './reports.gateway';

@Injectable()
export class ReportsService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly gateway: ReportsGateway,
  ) {}

  async findAll(filters: ReportFilters): Promise<HouseReport[]> {
    return (await this.repository.findAll(filters)).map((entity) =>
      this.toContract(entity),
    );
  }

  async findOne(id: string): Promise<HouseReport> {
    return this.toContract(await this.findEntity(id));
  }

  async create(
    dto: CreateReportDto,
    files: Express.Multer.File[],
  ): Promise<HouseReport> {
    const now = new Date();
    const entity = this.repository.create({
      reporterName: dto.reporterName.trim(),
      documentId: dto.documentId.trim(),
      contactPhone: dto.contactPhone.trim(),
      department: dto.department.trim(),
      municipality: dto.municipality.trim(),
      addressReference: dto.addressReference.trim(),
      householdSize: dto.householdSize,
      urgency: dto.urgency,
      needs: this.parseNeeds(dto.needs),
      notice: dto.notice.trim(),
      photos: files.map(photoUrl),
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy ?? null,
      locationCapturedAt: now,
      status: ReportStatus.OPEN,
      consentToShareLocation: dto.consentToShareLocation,
    });
    const report = this.toContract(await this.repository.save(entity));
    this.gateway.reportCreated(report);
    return report;
  }

  async update(id: string, dto: UpdateReportDto): Promise<HouseReport> {
    const entity = await this.findEntity(id);
    if (dto.status) entity.status = dto.status;
    if (dto.urgency) entity.urgency = dto.urgency;
    if (dto.notice !== undefined) entity.notice = dto.notice.trim();
    if (dto.needs !== undefined) entity.needs = this.parseNeeds(dto.needs);
    const report = this.toContract(await this.repository.save(entity));
    this.gateway.reportUpdated(report);
    return report;
  }

  async updateLocation(
    id: string,
    dto: UpdateLocationDto,
  ): Promise<HouseReport> {
    const entity = await this.findEntity(id);
    entity.latitude = dto.latitude;
    entity.longitude = dto.longitude;
    entity.accuracy = dto.accuracy ?? null;
    entity.locationCapturedAt = new Date();
    const report = this.toContract(await this.repository.save(entity));
    this.gateway.reportUpdated(report);
    return report;
  }

  private async findEntity(id: string): Promise<ReportEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('El reporte solicitado no existe');
    return entity;
  }

  private parseNeeds(value: string): string[] {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map(String)
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 12);
      }
    } catch {
      // También acepta texto separado por comas.
    }
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  private toContract(entity: ReportEntity): HouseReport {
    return {
      id: entity.id,
      department: entity.department,
      municipality: entity.municipality,
      addressReference: entity.addressReference,
      householdSize: entity.householdSize,
      urgency: entity.urgency,
      needs: entity.needs,
      notice: entity.notice,
      photos: entity.photos,
      location: {
        latitude: entity.latitude,
        longitude: entity.longitude,
        accuracy: entity.accuracy,
        capturedAt: entity.locationCapturedAt.toISOString(),
      },
      status: entity.status,
      consentToShareLocation: entity.consentToShareLocation,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
