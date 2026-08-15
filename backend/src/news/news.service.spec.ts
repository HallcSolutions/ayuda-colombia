import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  PublicNewsCategory,
  PublicNewsStatus,
} from '../common/constants/app.constants';
import { PublicNewsEntity } from './infrastructure/entities/public-news.entity';
import { NewsGateway } from './news.gateway';
import { NewsService } from './news.service';

describe('NewsService', () => {
  let service: NewsService;
  let andWhere: jest.Mock;
  let findOneBy: jest.Mock;

  beforeEach(() => {
    const query = {
      orderBy: jest.fn(),
      addOrderBy: jest.fn(),
      andWhere: jest.fn(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    query.orderBy.mockReturnValue(query);
    query.addOrderBy.mockReturnValue(query);
    query.andWhere.mockReturnValue(query);
    andWhere = query.andWhere;
    findOneBy = jest.fn();

    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
      findOneBy,
    } as unknown as Repository<PublicNewsEntity>;

    service = new NewsService(repository, {} as NewsGateway);
  });

  it('solo ofrece categorías que corresponden a desastres', () => {
    expect(Object.values(PublicNewsCategory)).toEqual([
      'earthquake',
      'flood',
      'landslide',
      'wildfire',
      'storm',
      'drought',
      'other',
    ]);
  });

  it('oculta de la vista pública los boletines que ya vencieron', async () => {
    await service.findAll({});

    expect(andWhere).toHaveBeenCalledWith(
      '(news.validUntil IS NULL OR news.validUntil >= :now)',
      { now: expect.any(Date) as unknown },
    );
  });

  it('no publica boletines programados para una fecha futura', async () => {
    await service.findAll({});

    expect(andWhere).toHaveBeenCalledWith('news.publishedAt <= :now', {
      now: expect.any(Date) as unknown,
    });
  });

  it('no expone una publicación archivada aunque se conozca su id', async () => {
    findOneBy.mockResolvedValue({
      id: 'archived-news',
      status: PublicNewsStatus.ARCHIVED,
      validUntil: null,
    });

    await expect(service.findOne('archived-news')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
