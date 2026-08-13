import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReliefPointsModule } from '../relief-points/relief-points.module';
import { ConvoysController } from './convoys.controller';
import { ConvoysGateway } from './convoys.gateway';
import { ConvoysService } from './convoys.service';
import { ConvoyPingEntity } from './infrastructure/entities/convoy-ping.entity';
import { ConvoyTripEntity } from './infrastructure/entities/convoy-trip.entity';
import { RoutingService } from './routing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConvoyTripEntity, ConvoyPingEntity]),
    ReliefPointsModule,
  ],
  controllers: [ConvoysController],
  providers: [ConvoysGateway, ConvoysService, RoutingService],
})
export class ConvoysModule {}
