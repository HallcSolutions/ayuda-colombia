import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ReporterAccessGuard } from '../src/common/guards/reporter-access.guard';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ReportsController } from '../src/reports/reports.controller';
import { ReportsService } from '../src/reports/reports.service';

describe('Reports API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        ReporterAccessGuard,
        {
          provide: ConfigService,
          useValue: { get: () => 'brigada-prueba' },
        },
        {
          provide: ReportsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateLocation: jest.fn(),
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

  it('rechaza escritura sin código de brigada', async () => {
    await request(app.getHttpServer())
      .patch('/api/reports/5c4826f4-b3a9-4f18-8d81-67eb1301d017')
      .send({ status: 'in_progress' })
      .expect(401);
  });
});
