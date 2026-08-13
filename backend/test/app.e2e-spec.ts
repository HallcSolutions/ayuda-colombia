import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AlertsController } from '../src/alerts/alerts.controller';
import { AlertsService } from '../src/alerts/alerts.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { MealsController } from '../src/meals/meals.controller';
import { MealsService } from '../src/meals/meals.service';
import { ReliefPointsController } from '../src/relief-points/relief-points.controller';
import { ReliefPointsService } from '../src/relief-points/relief-points.service';
import { ReportsController } from '../src/reports/reports.controller';
import { ReportsService } from '../src/reports/reports.service';

describe('Reports API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        ReportsController,
        ReliefPointsController,
        AlertsController,
        MealsController,
      ],
      providers: [
        {
          provide: ReportsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue({
              id: '5c4826f4-b3a9-4f18-8d81-67eb1301d017',
              status: 'in_progress',
            }),
            updateLocation: jest.fn(),
          },
        },
        {
          provide: ReliefPointsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            create: jest.fn().mockImplementation((dto) => dto),
            update: jest.fn(),
          },
        },
        {
          provide: AlertsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockImplementation((dto) => dto),
            resolve: jest.fn(),
          },
        },
        {
          provide: MealsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockImplementation((dto) => dto),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('permite consultar reportes sin cuenta', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/reports')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: [],
      message: 'Operación exitosa',
    });
  });

  it('permite actualizar un reporte sin código de brigada', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/reports/5c4826f4-b3a9-4f18-8d81-67eb1301d017')
      .send({ status: 'in_progress' })
      .expect(200);

    expect(response.body.data).toEqual({
      id: '5c4826f4-b3a9-4f18-8d81-67eb1301d017',
      status: 'in_progress',
    });
  });

  it('permite crear un punto sin código de brigada', async () => {
    await request(app.getHttpServer())
      .post('/api/relief-points')
      .send({
        name: 'Punto comunitario',
        type: 'collection_center',
        department: 'Valle del Cauca',
        municipality: 'Cali',
        addressReference: 'Barrio Chiminangos',
        latitude: 3.4783,
        longitude: -76.4933,
        contactName: 'Comunidad',
        contactPhone: '3001234567',
        schedule: '24 horas',
      })
      .expect(201);
  });

  it('permite pedir ayuda sin código de brigada', async () => {
    await request(app.getHttpServer())
      .post('/api/alerts')
      .send({
        reliefPointId: '5c4826f4-b3a9-4f18-8d81-67eb1301d017',
        category: 'water',
        severity: 'high',
        title: 'Se necesita agua',
        message: 'Se requieren botellas de agua',
        createdBy: 'Comunidad',
      })
      .expect(201);
  });

  it('permite registrar comidas sin código de brigada', async () => {
    await request(app.getHttpServer())
      .post('/api/meal-services')
      .send({
        reliefPointId: '5c4826f4-b3a9-4f18-8d81-67eb1301d017',
        mealType: 'lunch',
        servedOn: '2026-08-13',
        startsAt: '12:00',
        portionsPlanned: 20,
      })
      .expect(201);
  });
});
