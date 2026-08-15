import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReportStatus } from '../common/constants/app.constants';
import { HouseReport } from '../common/interfaces/house-report.interface';
import { PhotoStorageService } from '../common/uploads/photo-upload';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportEntity } from './infrastructure/entities/report.entity';
import { ReportsRepository } from './infrastructure/repositories/reports.repository';
import { ReportFilters } from './interfaces/report-filters.interface';
import { ReportsGateway } from './reports.gateway';
import { parseReportNeeds } from './report-needs';

@Injectable()
export class ReportsService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly gateway: ReportsGateway,
    private readonly photoStorage: PhotoStorageService,
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
    const needs = parseReportNeeds(dto.needs);
    if (!needs.length) {
      throw new BadRequestException(
        'Debes indicar al menos una necesidad válida',
      );
    }
    const sharesLocation = Boolean(
      dto.consentToShareLocation &&
      dto.latitude !== undefined &&
      dto.longitude !== undefined,
    );
    const photos = await this.photoStorage.store(files);
    let saved: ReportEntity;
    try {
      const entity = this.repository.create({
        reporterName: dto.reporterName.trim(),
        documentId: dto.documentId?.trim() ?? '',
        contactPhone: dto.contactPhone.trim(),
        contactRole: dto.contactRole,
        contactChannel: dto.contactChannel,
        consentToDirectContact: dto.consentToDirectContact,
        department: dto.department.trim(),
        municipality: dto.municipality.trim(),
        addressReference: dto.addressReference.trim(),
        householdSize: dto.householdSize,
        urgency: dto.urgency,
        needs,
        notice: dto.notice?.trim() ?? '',
        photos,
        latitude: sharesLocation ? dto.latitude : null,
        longitude: sharesLocation ? dto.longitude : null,
        accuracy: sharesLocation ? (dto.accuracy ?? null) : null,
        locationCapturedAt: sharesLocation ? now : null,
        status: ReportStatus.OPEN,
        consentToShareLocation: sharesLocation,
        fieldVerified: false,
        verifiedAt: null,
      });
      saved = await this.repository.save(entity);
    } catch (error) {
      await this.photoStorage.remove(photos);
      throw error;
    }
    const report = this.toContract(saved);
    this.gateway.reportCreated(report);
    return report;
  }

  private async findEntity(id: string): Promise<ReportEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('El reporte solicitado no existe');
    return entity;
  }

  private toContract(entity: ReportEntity): HouseReport {
    const sharesLocation = Boolean(
      entity.consentToShareLocation &&
      entity.latitude !== null &&
      entity.longitude !== null &&
      entity.locationCapturedAt,
    );
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
      location: sharesLocation
        ? {
            latitude: entity.latitude!,
            longitude: entity.longitude!,
            accuracy: entity.accuracy,
            capturedAt: entity.locationCapturedAt!.toISOString(),
          }
        : null,
      directContact: entity.consentToDirectContact
        ? {
            name: entity.reporterName,
            phone: entity.contactPhone,
            role: entity.contactRole,
            channel: entity.contactChannel,
          }
        : null,
      fieldVerified: entity.fieldVerified,
      verifiedAt: entity.verifiedAt?.toISOString() ?? null,
      status: entity.status,
      consentToShareLocation: sharesLocation,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
