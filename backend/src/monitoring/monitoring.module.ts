import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AidAlertEntity } from '../alerts/infrastructure/entities/aid-alert.entity';
import { MealServiceEntity } from '../meals/infrastructure/entities/meal-service.entity';
import { ReliefPointEntity } from '../relief-points/infrastructure/entities/relief-point.entity';
import { ReliefPointsModule } from '../relief-points/relief-points.module';
import { DigestTokenGuard } from './digest-token.guard';
import { NeedsDigestEntity } from './infrastructure/entities/needs-digest.entity';
import {
  MONITORING_OPTIONS,
  buildMonitoringOptions,
} from './monitoring.config';
import { MonitoringController } from './monitoring.controller';
import { MonitoringGateway } from './monitoring.gateway';
import { MonitoringScheduler } from './monitoring.scheduler';
import { MonitoringService } from './monitoring.service';
import { NeedsCheckService } from './needs-check.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      NeedsDigestEntity,
      ReliefPointEntity,
      AidAlertEntity,
      MealServiceEntity,
    ]),
    ReliefPointsModule,
  ],
  controllers: [MonitoringController],
  providers: [
    { provide: MONITORING_OPTIONS, useFactory: () => buildMonitoringOptions() },
    DigestTokenGuard,
    MonitoringGateway,
    NeedsCheckService,
    MonitoringService,
    MonitoringScheduler,
  ],
})
export class MonitoringModule {}
