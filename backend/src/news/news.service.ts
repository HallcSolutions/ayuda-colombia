import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicNewsStatus } from '../common/constants/app.constants';
import { PublicNewsItem } from '../common/interfaces/public-news.interface';
import { CreatePublicNewsDto } from './dto/create-public-news.dto';
import { UpdatePublicNewsDto } from './dto/update-public-news.dto';
import { PublicNewsEntity } from './infrastructure/entities/public-news.entity';
import { PublicNewsFilters } from './interfaces/public-news-filters.interface';
import { NewsGateway } from './news.gateway';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(PublicNewsEntity)
    private readonly repository: Repository<PublicNewsEntity>,
    private readonly gateway: NewsGateway,
  ) {}

  async findAll(filters: PublicNewsFilters): Promise<PublicNewsItem[]> {
    const query = this.repository
      .createQueryBuilder('news')
      .orderBy('news.featured', 'DESC')
      .addOrderBy('news.publishedAt', 'DESC');
    query.andWhere('news.status = :status', {
      status: PublicNewsStatus.PUBLISHED,
    });
    query.andWhere('news.publishedAt <= :now', { now: new Date() });
    // La vista pública es un boletín de emergencias activas, no un archivo histórico.
    query.andWhere('(news.validUntil IS NULL OR news.validUntil >= :now)', {
      now: new Date(),
    });
    if (filters.category) {
      query.andWhere('news.category = :category', {
        category: filters.category,
      });
    }
    // Una emergencia nacional siempre acompaña las noticias del territorio seleccionado.
    if (filters.department) {
      query.andWhere(
        `(news.department = '' OR LOWER(news.department) = LOWER(:department))`,
        { department: filters.department },
      );
    }
    if (filters.municipality) {
      query.andWhere(
        `(news.municipality = '' OR LOWER(news.municipality) = LOWER(:municipality))`,
        { municipality: filters.municipality },
      );
    }
    return (await query.getMany()).map((entity) => this.toContract(entity));
  }

  async findOne(id: string): Promise<PublicNewsItem> {
    const entity = await this.findEntity(id);
    if (
      entity.status !== PublicNewsStatus.PUBLISHED ||
      entity.publishedAt > new Date() ||
      (entity.validUntil !== null && entity.validUntil < new Date())
    ) {
      throw new NotFoundException('La noticia solicitada no existe');
    }
    return this.toContract(entity);
  }

  async create(dto: CreatePublicNewsDto): Promise<PublicNewsItem> {
    const item = this.toContract(
      await this.repository.save(
        this.repository.create({
          ...this.valuesOf(dto),
          verifiedAt: new Date(),
          status: PublicNewsStatus.PUBLISHED,
        }),
      ),
    );
    this.gateway.created(item);
    return item;
  }

  async update(id: string, dto: UpdatePublicNewsDto): Promise<PublicNewsItem> {
    const entity = await this.findEntity(id);
    Object.assign(entity, this.valuesOf(dto));
    if (dto.status) entity.status = dto.status;
    entity.verifiedAt = new Date();
    const item = this.toContract(await this.repository.save(entity));
    this.gateway.updated(item);
    return item;
  }

  private valuesOf(dto: UpdatePublicNewsDto): Partial<PublicNewsEntity> {
    const values: Partial<PublicNewsEntity> = {};
    if (dto.title !== undefined) values.title = dto.title.trim();
    if (dto.summary !== undefined) values.summary = dto.summary.trim();
    if (dto.steps !== undefined) values.steps = this.cleanList(dto.steps);
    if (dto.requirements !== undefined)
      values.requirements = this.cleanList(dto.requirements);
    if (dto.category !== undefined) values.category = dto.category;
    if (dto.department !== undefined) values.department = dto.department.trim();
    if (dto.municipality !== undefined)
      values.municipality = dto.municipality.trim();
    if (dto.sourceName !== undefined) values.sourceName = dto.sourceName.trim();
    if (dto.sourceUrl !== undefined) values.sourceUrl = dto.sourceUrl.trim();
    if (dto.contactInfo !== undefined)
      values.contactInfo = dto.contactInfo.trim();
    if (dto.publishedAt !== undefined) values.publishedAt = dto.publishedAt;
    if (dto.validUntil !== undefined) values.validUntil = dto.validUntil;
    if (dto.featured !== undefined) values.featured = dto.featured;
    return values;
  }

  private cleanList(items: string[]): string[] {
    return items.map((item) => item.trim()).filter(Boolean);
  }

  private async findEntity(id: string): Promise<PublicNewsEntity> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) throw new NotFoundException('La noticia solicitada no existe');
    return entity;
  }

  private toContract(entity: PublicNewsEntity): PublicNewsItem {
    return {
      id: entity.id,
      title: entity.title,
      summary: entity.summary,
      steps: entity.steps,
      requirements: entity.requirements,
      category: entity.category,
      department: entity.department,
      municipality: entity.municipality,
      sourceName: entity.sourceName,
      sourceUrl: entity.sourceUrl,
      contactInfo: entity.contactInfo,
      publishedAt: entity.publishedAt.toISOString(),
      validUntil: entity.validUntil?.toISOString() ?? null,
      verifiedAt: entity.verifiedAt.toISOString(),
      featured: entity.featured,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
