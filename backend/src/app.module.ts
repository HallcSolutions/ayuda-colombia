import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { join } from 'node:path';
import { buildDatabaseOptions } from './common/database/database.config';
import { AlertsModule } from './alerts/alerts.module';
import { ConvoysModule } from './convoys/convoys.module';
import { LodgingModule } from './lodging/lodging.module';
import { MealsModule } from './meals/meals.module';
import { MissingModule } from './missing/missing.module';
import { ReliefPointsModule } from './relief-points/relief-points.module';
import { ReportsModule } from './reports/reports.module';

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
    ReportsModule,
    ReliefPointsModule,
    MealsModule,
    AlertsModule,
    MissingModule,
    LodgingModule,
    ConvoysModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
