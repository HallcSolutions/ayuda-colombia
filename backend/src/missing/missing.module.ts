import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MissingRecordEntity } from './infrastructure/entities/missing-record.entity';
import { MissingController } from './missing.controller';
import { MissingGateway } from './missing.gateway';
import { MissingPublisherGuard } from './missing-publisher.guard';
import { MissingService } from './missing.service';
import { PhotoStorageService } from '../common/uploads/photo-upload';

@Module({
  imports: [TypeOrmModule.forFeature([MissingRecordEntity])],
  controllers: [MissingController],
  providers: [
    PhotoStorageService,
    MissingGateway,
    MissingPublisherGuard,
    MissingService,
  ],
})
export class MissingModule {}
