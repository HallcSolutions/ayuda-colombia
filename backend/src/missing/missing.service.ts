import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MissingStatus } from '../common/constants/app.constants';
import { applyRegionFilters } from '../common/database/region-filters';
import {
  MissingRecord,
  PublishedMissingRecord,
} from '../common/interfaces/missing-record.interface';
import { createEditPin, matchesEditPin } from '../common/security/edit-pin';
import { PhotoStorageService } from '../common/uploads/photo-upload';
import { CreateMissingRecordDto } from './dto/create-missing-record.dto';
import { UpdateMissingRecordDto } from './dto/update-missing-record.dto';
import { MissingGateway } from './missing.gateway';
import { MissingRecordEntity } from './infrastructure/entities/missing-record.entity';
import { MissingFilters } from './interfaces/missing-filters.interface';

@Injectable()
export class MissingService {
  constructor(
    @InjectRepository(MissingRecordEntity)
    private readonly repository: Repository<MissingRecordEntity>,
    private readonly gateway: MissingGateway,
    private readonly photoStorage: PhotoStorageService,
  ) {}

  async findAll(filters: MissingFilters): Promise<MissingRecord[]> {
    const query = this.repository
      .createQueryBuilder('record')
      .orderBy('record.lastSeenAt', 'DESC');
    if (filters.kind)
      query.andWhere('record.kind = :kind', { kind: filters.kind });
    if (filters.status)
      query.andWhere('record.status = :status', { status: filters.status });
    applyRegionFilters(query, 'record', filters);
    return (await query.getMany()).map((entity) => this.toContract(entity));
  }

  async findOne(id: string): Promise<MissingRecord> {
    return this.toContract(await this.findEntity(id));
  }

  async create(
    dto: CreateMissingRecordDto,
    files: Express.Multer.File[],
  ): Promise<PublishedMissingRecord> {
    const editPin = createEditPin();
    const photos = await this.photoStorage.store(files);
    let saved: MissingRecordEntity;
    try {
      const entity = this.repository.create({
        kind: dto.kind,
        name: dto.name.trim(),
        ageYears: dto.ageYears ?? null,
        description: dto.description.trim(),
        department: dto.department.trim(),
        municipality: dto.municipality.trim(),
        lastSeenPlace: dto.lastSeenPlace.trim(),
        lastSeenAt: new Date(dto.lastSeenAt),
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        contactName: dto.contactName.trim(),
        contactPhone: dto.contactPhone.trim(),
        photos,
        status: MissingStatus.SEARCHING,
        foundAt: null,
        consentToPublish: dto.consentToPublish,
        editPinHash: editPin.hash,
      });
      saved = await this.repository.save(entity);
    } catch (error) {
      await this.photoStorage.remove(photos);
      throw error;
    }
    const record = this.toContract(saved);
    // El evento en vivo lleva el contrato público; el PIN solo vuelve a quien publica.
    this.gateway.recordCreated(record);
    return { ...record, editPin: editPin.pin };
  }

  async update(
    id: string,
    dto: UpdateMissingRecordDto,
    editPin: string,
  ): Promise<MissingRecord> {
    const entity = await this.findEntity(id);
    this.assertPinMatches(entity, editPin);
    if (dto.status) {
      entity.status = dto.status;
      // La fecha del reencuentro solo existe mientras el caso esté marcado como encontrado.
      entity.foundAt = dto.status === MissingStatus.FOUND ? new Date() : null;
    }
    if (dto.description !== undefined)
      entity.description = dto.description.trim();
    if (dto.lastSeenPlace !== undefined)
      entity.lastSeenPlace = dto.lastSeenPlace.trim();
    if (dto.contactName !== undefined)
      entity.contactName = dto.contactName.trim();
    if (dto.contactPhone !== undefined)
      entity.contactPhone = dto.contactPhone.trim();
    const record = this.toContract(await this.repository.save(entity));
    this.gateway.recordUpdated(record);
    return record;
  }

  /** Solo quien publicó el aviso guarda su PIN, así que es su llave para editarlo. */
  private assertPinMatches(entity: MissingRecordEntity, editPin: string): void {
    if (!editPin || !matchesEditPin(editPin, entity.editPinHash)) {
      throw new UnauthorizedException(
        'El PIN de la publicación no es correcto',
      );
    }
  }

  private async findEntity(id: string): Promise<MissingRecordEntity> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity)
      throw new NotFoundException('La búsqueda solicitada no existe');
    return entity;
  }

  private toContract(entity: MissingRecordEntity): MissingRecord {
    return {
      id: entity.id,
      kind: entity.kind,
      name: entity.name,
      ageYears: entity.ageYears,
      description: entity.description,
      department: entity.department,
      municipality: entity.municipality,
      lastSeenPlace: entity.lastSeenPlace,
      lastSeenAt: entity.lastSeenAt.toISOString(),
      coordinates:
        entity.latitude === null || entity.longitude === null
          ? null
          : { latitude: entity.latitude, longitude: entity.longitude },
      contactName: entity.contactName,
      contactPhone: entity.contactPhone,
      photos: entity.photos,
      status: entity.status,
      foundAt: entity.foundAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
