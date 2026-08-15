import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MissingStatus,
  MissingSubjectKind,
} from '../common/constants/app.constants';
import { MissingRecord } from '../common/interfaces/missing-record.interface';
import { createEditPin } from '../common/security/edit-pin';
import { PhotoStorageService } from '../common/uploads/photo-upload';
import { MissingRecordEntity } from './infrastructure/entities/missing-record.entity';
import { MissingGateway } from './missing.gateway';
import { MissingService } from './missing.service';

// PIN real generado una vez: los tests usan su hash y su valor en claro.
const knownPin = createEditPin();

const recordEntity = (
  overrides: Partial<MissingRecordEntity> = {},
): MissingRecordEntity => ({
  id: 'missing-1',
  kind: MissingSubjectKind.PERSON,
  name: 'Luisa Martínez',
  ageYears: 12,
  description: 'Vestía sudadera azul y llevaba un morral rojo.',
  department: 'Chocó',
  municipality: 'Quibdó',
  lastSeenPlace: 'Malecón, cerca del puente',
  lastSeenAt: new Date('2026-08-12T18:30:00Z'),
  latitude: null,
  longitude: null,
  contactName: 'Marta Martínez',
  contactPhone: '3001234567',
  photos: ['/uploads/foto.jpg'],
  status: MissingStatus.SEARCHING,
  foundAt: null,
  consentToPublish: true,
  editPinHash: knownPin.hash,
  createdAt: new Date('2026-08-13T10:00:00Z'),
  updatedAt: new Date('2026-08-13T10:00:00Z'),
  ...overrides,
});

const photoFile = (filename: string): Express.Multer.File =>
  ({ filename }) as Express.Multer.File;

describe('MissingService', () => {
  let service: MissingService;
  let repository: jest.Mocked<Repository<MissingRecordEntity>>;
  let gateway: {
    recordCreated: jest.Mock<void, [MissingRecord]>;
    recordUpdated: jest.Mock<void, [MissingRecord]>;
  };
  let photoStorage: jest.Mocked<PhotoStorageService>;

  beforeEach(async () => {
    repository = {
      create: jest.fn((values) =>
        recordEntity(values as Partial<MissingRecordEntity>),
      ),
      save: jest.fn((entity: MissingRecordEntity) => Promise.resolve(entity)),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<MissingRecordEntity>>;
    gateway = {
      recordCreated: jest.fn<void, [MissingRecord]>(),
      recordUpdated: jest.fn<void, [MissingRecord]>(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        MissingService,
        {
          provide: getRepositoryToken(MissingRecordEntity),
          useValue: repository,
        },
        { provide: MissingGateway, useValue: gateway },
        {
          provide: PhotoStorageService,
          useValue: {
            store: jest.fn((files: Express.Multer.File[]) =>
              Promise.resolve(files.map((file) => `/uploads/${file.filename}`)),
            ),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(MissingService);
    photoStorage = moduleRef.get(PhotoStorageService);
  });

  it('publica la búsqueda en estado «buscando» y la difunde a la red', async () => {
    const record = await service.create(
      {
        kind: MissingSubjectKind.ANIMAL,
        name: ' Nube ',
        description: ' Perra criolla blanca con collar rojo ',
        department: ' Chocó ',
        municipality: ' Quibdó ',
        lastSeenPlace: ' Parque principal ',
        lastSeenAt: '2026-08-12T18:30:00.000Z',
        contactName: ' Marta ',
        contactPhone: ' 3001234567 ',
        consentToPublish: true,
      },
      [photoFile('nube.jpg')],
    );

    expect(record.status).toBe(MissingStatus.SEARCHING);
    expect(record.photos).toEqual(['/uploads/nube.jpg']);
    expect(record.ageYears).toBeNull();
    expect(record.coordinates).toBeNull();
    expect(repository.create.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        name: 'Nube',
        municipality: 'Quibdó',
        description: 'Perra criolla blanca con collar rojo',
      }),
    );
    expect(gateway.recordCreated).toHaveBeenCalledWith(
      expect.objectContaining({ id: record.id, name: 'Nube' }),
    );
  });

  it('expone las coordenadas solo cuando se conocen las dos', async () => {
    const record = await service.create(
      {
        kind: MissingSubjectKind.PERSON,
        name: 'Luisa Martínez',
        description: 'Sudadera azul',
        department: 'Chocó',
        municipality: 'Quibdó',
        lastSeenPlace: 'Malecón',
        lastSeenAt: '2026-08-12T18:30:00.000Z',
        latitude: 5.69,
        longitude: -76.66,
        contactName: 'Marta',
        contactPhone: '3001234567',
        consentToPublish: true,
      },
      [photoFile('luisa.jpg')],
    );

    expect(record.coordinates).toEqual({ latitude: 5.69, longitude: -76.66 });
  });

  it('marca el reencuentro con su fecha y lo limpia si se reabre la búsqueda', async () => {
    repository.findOneBy.mockResolvedValue(recordEntity());

    const found = await service.update(
      'missing-1',
      { status: MissingStatus.FOUND },
      knownPin.pin,
    );
    expect(found.status).toBe(MissingStatus.FOUND);
    expect(found.foundAt).not.toBeNull();
    expect(gateway.recordUpdated).toHaveBeenCalledWith(found);

    repository.findOneBy.mockResolvedValue(
      recordEntity({ status: MissingStatus.FOUND, foundAt: new Date() }),
    );
    const reopened = await service.update(
      'missing-1',
      { status: MissingStatus.SEARCHING },
      knownPin.pin,
    );
    expect(reopened.foundAt).toBeNull();
  });

  it('actualiza el contacto sin tocar el resto de la publicación', async () => {
    repository.findOneBy.mockResolvedValue(recordEntity());

    const record = await service.update(
      'missing-1',
      { contactPhone: ' 3109876543 ' },
      knownPin.pin,
    );

    expect(record.contactPhone).toBe('3109876543');
    expect(record.status).toBe(MissingStatus.SEARCHING);
    expect(record.description).toBe(
      'Vestía sudadera azul y llevaba un morral rojo.',
    );
  });

  it('devuelve el PIN una sola vez y nunca lo difunde por el socket', async () => {
    const record = await service.create(
      {
        kind: MissingSubjectKind.PERSON,
        name: 'Luisa Martínez',
        description: 'Sudadera azul',
        department: 'Chocó',
        municipality: 'Quibdó',
        lastSeenPlace: 'Malecón',
        lastSeenAt: '2026-08-12T18:30:00.000Z',
        contactName: 'Marta',
        contactPhone: '3001234567',
        consentToPublish: true,
      },
      [photoFile('luisa.jpg')],
    );

    expect(record.editPin).toMatch(/^\d{6}$/);
    // Lo guardado es el hash con su salt, nunca el PIN en claro.
    const saved = repository.create.mock.calls[0][0] as MissingRecordEntity;
    expect(saved.editPinHash).toContain(':');
    expect(saved.editPinHash).not.toContain(record.editPin);
    // Y el PIN tampoco viaja por el socket a toda la red.
    expect(gateway.recordCreated.mock.calls[0][0]).not.toHaveProperty(
      'editPin',
    );
  });

  it('rechaza la edición con un PIN equivocado o vacío', async () => {
    repository.findOneBy.mockResolvedValue(recordEntity());

    await expect(
      service.update('missing-1', { status: MissingStatus.FOUND }, '000000'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.update('missing-1', { status: MissingStatus.FOUND }, ''),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(gateway.recordUpdated).not.toHaveBeenCalled();
  });

  it('falla cuando la búsqueda no existe', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne('ghost')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('elimina la foto si la búsqueda no se puede guardar', async () => {
    repository.save.mockRejectedValue(new Error('base no disponible'));

    await expect(
      service.create(
        {
          kind: MissingSubjectKind.PERSON,
          name: 'Luisa',
          description: 'Sudadera azul',
          department: 'Chocó',
          municipality: 'Quibdó',
          lastSeenPlace: 'Malecón',
          lastSeenAt: '2026-08-12T18:30:00.000Z',
          contactName: 'Marta',
          contactPhone: '3001234567',
          consentToPublish: true,
        },
        [photoFile('luisa.jpg')],
      ),
    ).rejects.toThrow('base no disponible');

    expect(photoStorage.remove.mock.calls).toEqual([[['/uploads/luisa.jpg']]]);
    expect(gateway.recordCreated).not.toHaveBeenCalled();
  });
});
