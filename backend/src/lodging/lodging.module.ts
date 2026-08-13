import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LodgingOfferEntity } from './infrastructure/entities/lodging-offer.entity';
import { LodgingController } from './lodging.controller';
import { LodgingGateway } from './lodging.gateway';
import { LodgingService } from './lodging.service';

@Module({
  imports: [TypeOrmModule.forFeature([LodgingOfferEntity])],
  controllers: [LodgingController],
  providers: [LodgingGateway, LodgingService],
})
export class LodgingModule {}
