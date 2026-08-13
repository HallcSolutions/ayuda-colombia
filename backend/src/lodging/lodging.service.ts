import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LodgingStatus } from '../common/constants/app.constants';
import { applyRegionFilters } from '../common/database/region-filters';
import {
  LodgingOffer,
  PublishedLodgingOffer,
} from '../common/interfaces/lodging-offer.interface';
import { createEditPin, matchesEditPin } from '../common/security/edit-pin';
import { CreateLodgingOfferDto } from './dto/create-lodging-offer.dto';
import { UpdateLodgingOfferDto } from './dto/update-lodging-offer.dto';
import { UpdateOccupancyDto } from './dto/update-occupancy.dto';
import { LodgingOfferEntity } from './infrastructure/entities/lodging-offer.entity';
import { LodgingFilters } from './interfaces/lodging-filters.interface';
import { LodgingGateway } from './lodging.gateway';

/**
 * Suma el movimiento a la ocupación dentro de la misma sentencia, para que dos
 * personas que asignan cupos a la vez no se pisen ni dejen el cupo en negativo.
 */
const CLAMPED_OCCUPANCY =
  'LEAST(GREATEST("occupiedSpaces" + :delta, 0), "totalSpaces")';

@Injectable()
export class LodgingService {
  constructor(
    @InjectRepository(LodgingOfferEntity)
    private readonly repository: Repository<LodgingOfferEntity>,
    private readonly gateway: LodgingGateway,
  ) {}

  async findAll(filters: LodgingFilters): Promise<LodgingOffer[]> {
    const query = this.repository
      .createQueryBuilder('offer')
      .orderBy('offer.department', 'ASC')
      .addOrderBy('offer.municipality', 'ASC')
      .addOrderBy('offer.placeName', 'ASC');
    if (filters.kind)
      query.andWhere('offer.kind = :kind', { kind: filters.kind });
    if (filters.status)
      query.andWhere('offer.status = :status', { status: filters.status });
    if (filters.onlyAvailable) {
      query.andWhere('offer.status = :available', {
        available: LodgingStatus.AVAILABLE,
      });
    }
    applyRegionFilters(query, 'offer', filters);
    return (await query.getMany()).map((entity) => this.toContract(entity));
  }

  async findOne(id: string): Promise<LodgingOffer> {
    return this.toContract(await this.findEntity(id));
  }

  async create(dto: CreateLodgingOfferDto): Promise<PublishedLodgingOffer> {
    const editPin = createEditPin();
    const entity = this.repository.create({
      placeName: dto.placeName.trim(),
      kind: dto.kind,
      hostName: dto.hostName.trim(),
      contactPhone: dto.contactPhone.trim(),
      department: dto.department.trim(),
      municipality: dto.municipality.trim(),
      addressReference: dto.addressReference.trim(),
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      totalSpaces: dto.totalSpaces,
      occupiedSpaces: 0,
      maxNights: dto.maxNights ?? null,
      freeOfCharge: dto.freeOfCharge ?? true,
      acceptsPets: dto.acceptsPets ?? false,
      notes: dto.notes?.trim() ?? '',
      status: LodgingStatus.AVAILABLE,
      editPinHash: editPin.hash,
    });
    const offer = this.toContract(await this.repository.save(entity));
    // El evento en vivo lleva el contrato público; el PIN solo vuelve a quien publica.
    this.gateway.offerCreated(offer);
    return { ...offer, editPin: editPin.pin };
  }

  async update(
    id: string,
    dto: UpdateLodgingOfferDto,
    editPin: string,
  ): Promise<LodgingOffer> {
    const entity = await this.findEntity(id);
    this.assertPinMatches(entity, editPin);
    if (dto.totalSpaces !== undefined) {
      entity.totalSpaces = dto.totalSpaces;
      // Si se reduce el ofrecimiento, la ocupación no puede quedar por encima.
      entity.occupiedSpaces = Math.min(entity.occupiedSpaces, dto.totalSpaces);
    }
    if (dto.hostName !== undefined) entity.hostName = dto.hostName.trim();
    if (dto.contactPhone !== undefined)
      entity.contactPhone = dto.contactPhone.trim();
    if (dto.addressReference !== undefined)
      entity.addressReference = dto.addressReference.trim();
    if (dto.maxNights !== undefined) entity.maxNights = dto.maxNights;
    if (dto.freeOfCharge !== undefined) entity.freeOfCharge = dto.freeOfCharge;
    if (dto.acceptsPets !== undefined) entity.acceptsPets = dto.acceptsPets;
    if (dto.notes !== undefined) entity.notes = dto.notes.trim();
    entity.status = this.resolveStatus(entity, dto.status);
    return this.saveAndPublish(entity);
  }

  /**
   * Merma o devuelve cupos. La suma se hace en la base de datos porque varias
   * personas pueden estar ubicando familias en el mismo alojamiento a la vez.
   */
  async changeOccupancy(
    id: string,
    dto: UpdateOccupancyDto,
    editPin: string,
  ): Promise<LodgingOffer> {
    const entity = await this.findEntity(id);
    this.assertPinMatches(entity, editPin);
    await this.repository
      .createQueryBuilder()
      .update(LodgingOfferEntity)
      .set({ occupiedSpaces: () => CLAMPED_OCCUPANCY })
      .where('id = :id', { id })
      .setParameter('delta', dto.delta)
      .execute();
    const updated = await this.findEntity(id);
    updated.status = this.resolveStatus(updated);
    return this.saveAndPublish(updated);
  }

  private async saveAndPublish(
    entity: LodgingOfferEntity,
  ): Promise<LodgingOffer> {
    const offer = this.toContract(await this.repository.save(entity));
    this.gateway.offerUpdated(offer);
    return offer;
  }

  /**
   * Cerrar o reabrir es decisión de quien ofrece; lleno o disponible lo dicen los cupos,
   * así que reabrir un alojamiento sin cupos libres lo deja en `full`, no en `available`.
   */
  private resolveStatus(
    entity: LodgingOfferEntity,
    requested?: LodgingStatus,
  ): LodgingStatus {
    const status = requested ?? entity.status;
    if (status === LodgingStatus.CLOSED) return LodgingStatus.CLOSED;
    return entity.occupiedSpaces >= entity.totalSpaces
      ? LodgingStatus.FULL
      : LodgingStatus.AVAILABLE;
  }

  /** Solo quien publicó el alojamiento guarda su PIN: es su llave para editarlo. */
  private assertPinMatches(entity: LodgingOfferEntity, editPin: string): void {
    if (!editPin || !matchesEditPin(editPin, entity.editPinHash)) {
      throw new UnauthorizedException('El PIN del alojamiento no es correcto');
    }
  }

  private async findEntity(id: string): Promise<LodgingOfferEntity> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity)
      throw new NotFoundException('El alojamiento solicitado no existe');
    return entity;
  }

  private toContract(entity: LodgingOfferEntity): LodgingOffer {
    return {
      id: entity.id,
      placeName: entity.placeName,
      kind: entity.kind,
      hostName: entity.hostName,
      contactPhone: entity.contactPhone,
      department: entity.department,
      municipality: entity.municipality,
      addressReference: entity.addressReference,
      coordinates:
        entity.latitude === null || entity.longitude === null
          ? null
          : { latitude: entity.latitude, longitude: entity.longitude },
      totalSpaces: entity.totalSpaces,
      occupiedSpaces: entity.occupiedSpaces,
      availableSpaces: Math.max(entity.totalSpaces - entity.occupiedSpaces, 0),
      maxNights: entity.maxNights,
      freeOfCharge: entity.freeOfCharge,
      acceptsPets: entity.acceptsPets,
      notes: entity.notes,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
