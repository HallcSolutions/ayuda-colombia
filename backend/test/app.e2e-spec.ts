import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AlertsController } from '../src/alerts/alerts.controller';
import { AlertsService } from '../src/alerts/alerts.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { MealsController } from '../src/meals/meals.controller';
import { DigestTokenGuard } from '../src/monitoring/digest-token.guard';
import {
  MONITORING_OPTIONS,
  buildMonitoringOptions,
} from '../src/monitoring/monitoring.config';
import { MonitoringController } from '../src/monitoring/monitoring.controller';
import { MonitoringService } from '../src/monitoring/monitoring.service';
import { MealsService } from '../src/meals/meals.service';
import { NewsPublisherGuard } from '../src/news/news-publisher.guard';
import { NewsController } from '../src/news/news.controller';
import { NewsService } from '../src/news/news.service';
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
        MonitoringController,
        NewsController,
      ],
      providers: [
        {
          provide: ReportsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: ReliefPointsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            create: jest.fn((dto: unknown) => dto),
            update: jest.fn(),
          },
        },
        {
          provide: AlertsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            create: jest.fn((dto: unknown) => dto),
            resolve: jest.fn(),
          },
        },
        {
          provide: MealsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            create: jest.fn((dto: unknown) => dto),
            update: jest.fn(),
          },
        },
        {
          provide: MonitoringService,
          useValue: {
            findLast: jest.fn().mockResolvedValue({ id: 'digest-1' }),
            status: jest.fn().mockResolvedValue({ enabled: true }),
            runDigest: jest.fn().mockResolvedValue({ id: 'digest-2' }),
          },
        },
        {
          provide: NewsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        DigestTokenGuard,
        NewsPublisherGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback: unknown) => {
              if (key === 'NEWS_PUBLISHER_KEY') return 'editor-prueba';
              return fallback;
            }),
          },
        },
        {
          provide: MONITORING_OPTIONS,
          useValue: buildMonitoringOptions({
            DIGEST_TRIGGER_TOKEN: 'llave-de-prueba',
          }),
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

  it('no expone cambios públicos que otra persona pueda sabotear', async () => {
    await request(app.getHttpServer())
      .patch('/api/reports/5c4826f4-b3a9-4f18-8d81-67eb1301d017')
      .send({ status: 'in_progress' })
      .expect(404);
  });

  it('acepta el registro mínimo sin cédula, foto ni GPS', async () => {
    await request(app.getHttpServer())
      .post('/api/reports')
      .field('reporterName', 'Marta')
      .field('contactPhone', '3001234567')
      .field('contactRole', 'affected_person')
      .field('contactChannel', 'both')
      .field('consentToDirectContact', 'true')
      .field('department', 'Chocó')
      .field('municipality', 'Istmina')
      .field('addressReference', 'Sector La Esperanza')
      .field('householdSize', '4')
      .field('urgency', 'high')
      .field('needs', '["Agua potable","Alimentos"]')
      .field('consentToShareLocation', 'false')
      .expect(201);
  });

  it.each(['[]', '   ', '{}', '[""]'])(
    'rechaza un reporte sin necesidades reales: %s',
    async (needs) => {
      await request(app.getHttpServer())
        .post('/api/reports')
        .field('reporterName', 'Marta')
        .field('contactPhone', '3001234567')
        .field('contactRole', 'affected_person')
        .field('contactChannel', 'both')
        .field('consentToDirectContact', 'false')
        .field('department', 'Chocó')
        .field('municipality', 'Istmina')
        .field('addressReference', 'Sector La Esperanza')
        .field('householdSize', '4')
        .field('urgency', 'high')
        .field('needs', needs)
        .field('consentToShareLocation', 'false')
        .expect(400);
    },
  );

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

  it('deja consultar el resumen y el estado del chequeo sin ninguna llave', async () => {
    await request(app.getHttpServer())
      .get('/api/monitoring/digest')
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/monitoring/status')
      .expect(200);
  });

  it('no deja disparar el resumen a mano sin la llave', async () => {
    await request(app.getHttpServer())
      .post('/api/monitoring/digest/run')
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/monitoring/digest/run')
      .set('x-digest-token', 'llave-equivocada')
      .expect(401);
  });

  it('dispara el resumen a mano con la llave correcta', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/monitoring/digest/run')
      .set('x-digest-token', 'llave-de-prueba')
      .expect(200);

    expect((response.body as { data: unknown }).data).toEqual({
      id: 'digest-2',
    });
  });

  it('rechaza filtros de noticias que no son categorías de desastre', async () => {
    await request(app.getHttpServer())
      .get('/api/news?category=programa-general')
      .expect(400);
  });

  it('rechaza identificadores de noticia inválidos antes de consultar la base', async () => {
    await request(app.getHttpServer()).get('/api/news/no-es-uuid').expect(400);
  });

  it('mantiene la publicación de noticias detrás de la llave editorial', async () => {
    await request(app.getHttpServer()).post('/api/news').send({}).expect(401);
  });
});
