import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildDatabaseOptions } from './common/database/database.config';
import { AlertsModule } from './alerts/alerts.module';
import { ConvoysModule } from './convoys/convoys.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { LodgingModule } from './lodging/lodging.module';
import { MealsModule } from './meals/meals.module';
import { MissingModule } from './missing/missing.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { NewsModule } from './news/news.module';
import { RecoveryModule } from './recovery/recovery.module';
import { ReliefPointsModule } from './relief-points/relief-points.module';
import { ReportsModule } from './reports/reports.module';

/**
 * El SPA compilado que la imagen de producción deja junto al API. En desarrollo no
 * existe —el frontend lo sirve `ng serve`—, así que solo se monta si está presente.
 */
const CLIENT_PATH = join(process.cwd(), 'client');

const serveClient = existsSync(CLIENT_PATH)
  ? [
      ServeStaticModule.forRoot({
        rootPath: CLIENT_PATH,
        // Sin esto, el comodín que devuelve index.html para las rutas del router
        // de Angular se tragaría también las del API y las imágenes subidas.
        exclude: ['/api/{*path}', '/uploads/{*path}'],
      }),
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...buildDatabaseOptions(process.env),
        autoLoadEntities: true,
        migrationsRun: config.get('DB_RUN_MIGRATIONS', 'true') !== 'false',
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ...serveClient,
    ReportsModule,
    ReliefPointsModule,
    MealsModule,
    AlertsModule,
    MissingModule,
    LodgingModule,
    ConvoysModule,
    GeocodingModule,
    MonitoringModule,
    NewsModule,
    RecoveryModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
