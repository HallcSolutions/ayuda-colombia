import { Test } from '@nestjs/testing';
import {
  HelpContactChannel,
  HelpContactRole,
  ReportStatus,
  UrgencyLevel,
} from '../common/constants/app.constants';
import { CreateReportDto } from './dto/create-report.dto';
import { PhotoStorageService } from '../common/uploads/photo-upload';
import { ReportEntity } from './infrastructure/entities/report.entity';
import { ReportsRepository } from './infrastructure/repositories/reports.repository';
import { ReportsGateway } from './reports.gateway';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let repository: jest.Mocked<ReportsRepository>;
  let gateway: jest.Mocked<ReportsGateway>;
  let photoStorage: jest.Mocked<PhotoStorageService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: ReportsRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: ReportsGateway,
          useValue: { reportCreated: jest.fn() },
        },
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

    service = module.get(ReportsService);
    repository = module.get(ReportsRepository);
    gateway = module.get(ReportsGateway);
    photoStorage = module.get(PhotoStorageService);
  });

  it('publica un reporte con fotos y necesidades normalizadas', async () => {
    const dto: CreateReportDto = {
      reporterName: 'Líder local',
      documentId: '1017234567',
      contactPhone: '3001234567',
      contactRole: HelpContactRole.LOCAL_SUPPORT,
      contactChannel: HelpContactChannel.BOTH,
      consentToDirectContact: false,
      department: 'Chocó',
      municipality: 'Istmina',
      addressReference: 'Vereda Central',
      householdSize: 4,
      urgency: UrgencyLevel.HIGH,
      needs: '["Agua potable","Medicinas"]',
      notice: 'Daño estructural',
      latitude: 5.16,
      longitude: -76.68,
      consentToShareLocation: true,
    };
    const entity = reportEntity();
    repository.create.mockReturnValue(entity);
    repository.save.mockResolvedValue(entity);

    const result = await service.create(dto, [
      { filename: 'evidencia.webp' } as Express.Multer.File,
    ]);

    expect(result.id).toBe(entity.id);
    expect(repository.create.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        needs: ['Agua potable', 'Medicinas'],
        photos: ['/uploads/evidencia.webp'],
      }),
    );
    expect(gateway.reportCreated.mock.calls[0][0]).toEqual(result);
  });

  it('guarda los datos de identidad y contacto sin exponerlos por la API', async () => {
    const entity = reportEntity();
    repository.findAll.mockResolvedValue([entity]);
    repository.findById.mockResolvedValue(entity);

    const [listed] = await service.findAll({});
    const detail = await service.findOne(entity.id);

    // El listado es público: la identidad y el contacto no viajan ni en el listado ni en el detalle.
    const publicPayload = JSON.stringify([listed, detail]);
    expect(publicPayload).not.toContain(entity.documentId);
    expect(publicPayload).not.toContain(entity.reporterName);
    expect(publicPayload).not.toContain(entity.contactPhone);
  });

  it('publica solo el contacto que la familia autorizó', async () => {
    const entity = reportEntity({
      consentToDirectContact: true,
      contactRole: HelpContactRole.FAMILY_MEMBER,
      contactChannel: HelpContactChannel.WHATSAPP,
    });
    repository.findById.mockResolvedValue(entity);

    const result = await service.findOne(entity.id);

    expect(result.directContact).toEqual({
      name: entity.reporterName,
      phone: entity.contactPhone,
      role: HelpContactRole.FAMILY_MEMBER,
      channel: HelpContactChannel.WHATSAPP,
    });
    expect(JSON.stringify(result)).not.toContain(entity.documentId);
  });

  it('registra una familia sin cédula, fotos ni GPS', async () => {
    const dto: CreateReportDto = {
      reporterName: 'Marta',
      contactPhone: '3001234567',
      contactRole: HelpContactRole.AFFECTED_PERSON,
      contactChannel: HelpContactChannel.BOTH,
      consentToDirectContact: true,
      department: 'Chocó',
      municipality: 'Istmina',
      addressReference: 'Sector La Esperanza',
      householdSize: 4,
      urgency: UrgencyLevel.HIGH,
      needs: '["Agua potable","Alimentos"]',
    };
    repository.create.mockImplementation((data) =>
      Object.assign(reportEntity(), data),
    );
    repository.save.mockImplementation((entity) => Promise.resolve(entity));

    const result = await service.create(dto, []);

    expect(repository.create.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        documentId: '',
        photos: [],
        latitude: null,
        longitude: null,
        locationCapturedAt: null,
        fieldVerified: false,
        verifiedAt: null,
      }),
    );
    expect(result.location).toBeNull();
    expect(result.directContact?.phone).toBe(dto.contactPhone);
  });

  it('rechaza necesidades vacías incluso si el servicio se invoca directamente', async () => {
    const dto: CreateReportDto = {
      reporterName: 'Marta',
      contactPhone: '3001234567',
      contactRole: HelpContactRole.AFFECTED_PERSON,
      contactChannel: HelpContactChannel.BOTH,
      consentToDirectContact: false,
      department: 'Chocó',
      municipality: 'Istmina',
      addressReference: 'Sector La Esperanza',
      householdSize: 4,
      urgency: UrgencyLevel.HIGH,
      needs: '[]',
    };

    await expect(service.create(dto, [])).rejects.toThrow(
      'Debes indicar al menos una necesidad válida',
    );
    expect(photoStorage.store.mock.calls).toHaveLength(0);
    expect(repository.save.mock.calls).toHaveLength(0);
  });

  it('elimina las fotos guardadas si falla la persistencia del reporte', async () => {
    const dto: CreateReportDto = {
      reporterName: 'Marta',
      contactPhone: '3001234567',
      contactRole: HelpContactRole.AFFECTED_PERSON,
      contactChannel: HelpContactChannel.BOTH,
      consentToDirectContact: false,
      department: 'Chocó',
      municipality: 'Istmina',
      addressReference: 'Sector La Esperanza',
      householdSize: 4,
      urgency: UrgencyLevel.HIGH,
      needs: '["Agua potable"]',
    };
    repository.create.mockReturnValue(reportEntity());
    repository.save.mockRejectedValue(new Error('base no disponible'));

    await expect(
      service.create(dto, [{ filename: 'qa.png' } as Express.Multer.File]),
    ).rejects.toThrow('base no disponible');

    expect(photoStorage.remove.mock.calls).toEqual([[['/uploads/qa.png']]]);
    expect(gateway.reportCreated.mock.calls).toHaveLength(0);
  });

  it('devuelve los reportes ordenados por el repositorio', async () => {
    repository.findAll.mockResolvedValue([reportEntity()]);

    const result = await service.findAll({ status: ReportStatus.OPEN });

    expect(result).toHaveLength(1);
    expect(repository.findAll.mock.calls[0][0]).toEqual({
      status: ReportStatus.OPEN,
    });
  });
});

function reportEntity(overrides: Partial<ReportEntity> = {}): ReportEntity {
  return {
    id: '5c4826f4-b3a9-4f18-8d81-67eb1301d017',
    reporterName: 'Líder local',
    documentId: '1017234567',
    contactPhone: '3001234567',
    contactRole: HelpContactRole.LOCAL_SUPPORT,
    contactChannel: HelpContactChannel.BOTH,
    consentToDirectContact: false,
    department: 'Chocó',
    municipality: 'Istmina',
    addressReference: 'Vereda Central',
    householdSize: 4,
    urgency: UrgencyLevel.HIGH,
    needs: ['Agua potable', 'Medicinas'],
    notice: 'Daño estructural',
    photos: ['/uploads/evidencia.webp'],
    latitude: 5.16,
    longitude: -76.68,
    accuracy: 8,
    locationCapturedAt: new Date('2026-08-13T20:00:00Z'),
    status: ReportStatus.OPEN,
    consentToShareLocation: true,
    fieldVerified: true,
    verifiedAt: new Date('2026-08-13T20:00:00Z'),
    createdAt: new Date('2026-08-13T20:00:00Z'),
    updatedAt: new Date('2026-08-13T20:00:00Z'),
    ...overrides,
  };
}
