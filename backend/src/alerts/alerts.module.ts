import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReporterAccessGuard } from '../common/guards/reporter-access.guard';
import { ReliefPointsModule } from '../relief-points/relief-points.module';
import { AlertsController } from './alerts.controller';
import { AlertsGateway } from './alerts.gateway';
import { AlertsService } from './alerts.service';
import { AidAlertEntity } from './infrastructure/entities/aid-alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AidAlertEntity]), ReliefPointsModule],
  controllers: [AlertsController],
  providers: [AlertsGateway, AlertsService, ReporterAccessGuard],
})
export class AlertsModule {}
