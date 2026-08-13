import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReporterAccessGuard } from '../common/guards/reporter-access.guard';
import { ReliefPointEntity } from './infrastructure/entities/relief-point.entity';
import { ReliefPointsController } from './relief-points.controller';
import { ReliefPointsGateway } from './relief-points.gateway';
import { ReliefPointsService } from './relief-points.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReliefPointEntity])],
  controllers: [ReliefPointsController],
  providers: [ReliefPointsGateway, ReliefPointsService, ReporterAccessGuard],
  exports: [ReliefPointsService],
})
export class ReliefPointsModule {}
