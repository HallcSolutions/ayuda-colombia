import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MealType } from '../common/constants/app.constants';
import { MealService } from '../common/interfaces/meal-service.interface';
import { CreateMealServiceDto } from './dto/create-meal-service.dto';
import { UpdateMealServiceDto } from './dto/update-meal-service.dto';
import { MealsService } from './meals.service';

@Controller('meal-services')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Get()
  findAll(
    @Query('reliefPointId') reliefPointId?: string,
    @Query('servedOn') servedOn?: string,
    @Query('mealType') mealType?: MealType,
    @Query('department') department?: string,
    @Query('municipality') municipality?: string,
  ): Promise<MealService[]> {
    return this.mealsService.findAll({
      reliefPointId,
      servedOn,
      mealType,
      department,
      municipality,
    });
  }

  @Post()
  create(@Body() dto: CreateMealServiceDto): Promise<MealService> {
    return this.mealsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMealServiceDto,
  ): Promise<MealService> {
    return this.mealsService.update(id, dto);
  }
}
