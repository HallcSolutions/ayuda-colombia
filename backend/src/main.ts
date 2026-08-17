import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import {
  missingIdFromSharePath,
  renderMissingSharePreview,
} from './missing/missing-share-preview';
import { MissingService } from './missing/missing.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const clientIndexPath = join(process.cwd(), 'client', 'index.html');
  if (existsSync(clientIndexPath)) {
    const clientIndex = readFileSync(clientIndexPath, 'utf8');
    const missingService = app.get(MissingService);
    const publicSiteUrl =
      process.env.FRONTEND_URL?.split(',')[0]?.trim() ||
      'https://redayudacolombia.com';
    app.use(
      async (request: Request, response: Response, next: NextFunction) => {
        if (request.method !== 'GET') return next();
        const missingId = missingIdFromSharePath(request.path);
        if (!missingId) return next();

        try {
          const record = await missingService.findOne(missingId);
          response.setHeader('Cache-Control', 'public, max-age=60');
          response
            .type('html')
            .send(
              renderMissingSharePreview(clientIndex, record, publicSiteUrl),
            );
        } catch {
          next();
        }
      },
    );
  }

  app.use((_request: Request, response: Response, next: NextFunction) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',') ?? ['http://localhost:4200'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('RedAyuda Colombia API')
    .setDescription(
      'Reportes de viviendas afectadas, necesidades y ubicación para ayuda humanitaria',
    )
    .setVersion('1.0')
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  const port = Number(process.env.PORT ?? 3000);
  // El host explícito es lo que hace visible el proceso fuera del contenedor.
  await app.listen(port, '0.0.0.0');
  console.log(`RedAyuda API escuchando en el puerto ${port}`);
}
void bootstrap();
