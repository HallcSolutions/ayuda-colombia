import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReliefPointsModule } from '../relief-points/relief-points.module';
import { MealServiceEntity } from './infrastructure/entities/meal-service.entity';
import { MealsController } from './meals.controller';
import { MealsGateway } from './meals.gateway';
import { MealsService } from './meals.service';

@Module({
  imports: [TypeOrmModule.forFeature([MealServiceEntity]), ReliefPointsModule],
  controllers: [MealsController],
  providers: [MealsGateway, MealsService],
})
export class MealsModule {}
