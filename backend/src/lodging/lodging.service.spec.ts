import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LodgingKind, LodgingStatus } from '../common/constants/app.constants';
import { LodgingOffer } from '../common/interfaces/lodging-offer.interface';
import { createEditPin } from '../common/security/edit-pin';
import { LodgingOfferEntity } from './infrastructure/entities/lodging-offer.entity';
import { LodgingGateway } from './lodging.gateway';
import { LodgingService } from './lodging.service';

// PIN real generado una vez: los tests usan su hash y su valor en claro.
const knownPin = createEditPin();

const offerEntity = (
  overrides: Partial<LodgingOfferEntity> = {},
): LodgingOfferEntity => ({
  id: 'lodging-1',
  placeName: 'Hotel La Ceiba',
  kind: LodgingKind.HOTEL,
  hostName: 'Marta Ríos',
  contactPhone: '3001234567',
  department: 'Chocó',
  municipality: 'Quibdó',
  addressReference: 'Calle 24 con carrera 5',
  latitude: null,
  longitude: null,
  totalSpaces: 10,
  occupiedSpaces: 0,
  maxNights: 5,
  freeOfCharge: true,
  acceptsPets: false,
  notes: '',
  status: LodgingStatus.AVAILABLE,
  editPinHash: knownPin.hash,
  createdAt: new Date('2026-08-13T10:00:00Z'),
  updatedAt: new Date('2026-08-13T10:00:00Z'),
  ...overrides,
});

describe('LodgingService', () => {
  let service: LodgingService;
  let repository: jest.Mocked<Repository<LodgingOfferEntity>>;
  let gateway: {
    offerCreated: jest.Mock<void, [LodgingOffer]>;
    offerUpdated: jest.Mock<void, [LodgingOffer]>;
  };
  let execute: jest.Mock;

  beforeEach(async () => {
    execute = jest.fn().mockResolvedValue({ affected: 1 });
    repository = {
      create: jest.fn((values) =>
        offerEntity(values as Partial<LodgingOfferEntity>),
      ),
      save: jest.fn((entity: LodgingOfferEntity) => Promise.resolve(entity)),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        execute,
      })),
    } as unknown as jest.Mocked<Repository<LodgingOfferEntity>>;
    gateway = {
      offerCreated: jest.fn<void, [LodgingOffer]>(),
      offerUpdated: jest.fn<void, [LodgingOffer]>(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        LodgingService,
        {
          provide: getRepositoryToken(LodgingOfferEntity),
          useValue: repository,
        },
        { provide: LodgingGateway, useValue: gateway },
      ],
    }).compile();
    service = moduleRef.get(LodgingService);
  });

  it('devuelve el PIN una sola vez al publicar y anuncia el alojamiento', async () => {
    const published = await service.create({
      placeName: 'Hotel La Ceiba',
      kind: LodgingKind.HOTEL,
      hostName: 'Marta Ríos',
      contactPhone: '3001234567',
      department: 'Chocó',
      municipality: 'Quibdó',
      addressReference: 'Calle 24 con carrera 5',
      totalSpaces: 10,
    });

    expect(published.editPin).toHaveLength(6);
    expect(published.availableSpaces).toBe(10);
    expect(gateway.offerCreated).toHaveBeenCalledTimes(1);
    // El contrato que viaja por el socket no lleva el PIN.
    expect(gateway.offerCreated.mock.calls[0][0]).not.toHaveProperty('editPin');
  });

  it('merma los cupos y deja el alojamiento lleno cuando se ocupan todos', async () => {
    repository.findOneBy
      .mockResolvedValueOnce(offerEntity())
      .mockResolvedValueOnce(offerEntity({ occupiedSpaces: 10 }));

    const offer = await service.changeOccupancy(
      'lodging-1',
      { delta: 10 },
      knownPin.pin,
    );

    expect(execute).toHaveBeenCalledTimes(1);
    expect(offer.availableSpaces).toBe(0);
    expect(offer.status).toBe(LodgingStatus.FULL);
    expect(gateway.offerUpdated).toHaveBeenCalledWith(offer);
  });

  it('vuelve a quedar disponible cuando se liberan cupos', async () => {
    repository.findOneBy
      .mockResolvedValueOnce(
        offerEntity({ occupiedSpaces: 10, status: LodgingStatus.FULL }),
      )
      .mockResolvedValueOnce(
        offerEntity({ occupiedSpaces: 6, status: LodgingStatus.FULL }),
      );

    const offer = await service.changeOccupancy(
      'lodging-1',
      { delta: -4 },
      knownPin.pin,
    );

    expect(offer.availableSpaces).toBe(4);
    expect(offer.status).toBe(LodgingStatus.AVAILABLE);
  });

  it('rechaza mover cupos sin el PIN de quien publicó', async () => {
    repository.findOneBy.mockResolvedValue(offerEntity());

    await expect(
      service.changeOccupancy('lodging-1', { delta: 1 }, '000000'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(execute).not.toHaveBeenCalled();
  });

  it('un alojamiento cerrado sigue cerrado aunque tenga cupos libres', async () => {
    repository.findOneBy.mockResolvedValue(offerEntity());

    const offer = await service.update(
      'lodging-1',
      { status: LodgingStatus.CLOSED },
      knownPin.pin,
    );

    expect(offer.status).toBe(LodgingStatus.CLOSED);
  });

  it('al reducir el total de cupos la ocupación nunca queda por encima', async () => {
    repository.findOneBy.mockResolvedValue(offerEntity({ occupiedSpaces: 8 }));

    const offer = await service.update(
      'lodging-1',
      { totalSpaces: 4 },
      knownPin.pin,
    );

    expect(offer.occupiedSpaces).toBe(4);
    expect(offer.availableSpaces).toBe(0);
    expect(offer.status).toBe(LodgingStatus.FULL);
  });
});
