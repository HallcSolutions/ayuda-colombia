import { Test } from '@nestjs/testing';
import { ReportStatus, UrgencyLevel } from '../common/constants/app.constants';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportEntity } from './infrastructure/entities/report.entity';
import { ReportsRepository } from './infrastructure/repositories/reports.repository';
import { ReportsGateway } from './reports.gateway';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let repository: jest.Mocked<ReportsRepository>;
  let gateway: jest.Mocked<ReportsGateway>;

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
          useValue: { reportCreated: jest.fn(), reportUpdated: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ReportsService);
    repository = module.get(ReportsRepository);
    gateway = module.get(ReportsGateway);
  });

  it('publica un reporte con fotos y necesidades normalizadas', async () => {
    const dto: CreateReportDto = {
      reporterName: 'Líder local',
      documentId: '1017234567',
      contactPhone: '3001234567',
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

  it('devuelve los reportes ordenados por el repositorio', async () => {
    repository.findAll.mockResolvedValue([reportEntity()]);

    const result = await service.findAll({ status: ReportStatus.OPEN });

    expect(result).toHaveLength(1);
    expect(repository.findAll.mock.calls[0][0]).toEqual({
      status: ReportStatus.OPEN,
    });
  });
});

function reportEntity(): ReportEntity {
  return {
    id: '5c4826f4-b3a9-4f18-8d81-67eb1301d017',
    reporterName: 'Líder local',
    documentId: '1017234567',
    contactPhone: '3001234567',
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
    createdAt: new Date('2026-08-13T20:00:00Z'),
    updatedAt: new Date('2026-08-13T20:00:00Z'),
  };
}
