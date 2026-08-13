import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsGateway } from './reports.gateway';
import { ReportsService } from './reports.service';
import { ReportEntity } from './infrastructure/entities/report.entity';
import { ReportsRepository } from './infrastructure/repositories/reports.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ReportEntity])],
  controllers: [ReportsController],
  providers: [ReportsGateway, ReportsRepository, ReportsService],
})
export class ReportsModule {}
