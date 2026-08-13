import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AlertStatus, SupplyCategory } from '../common/constants/app.constants';
import { AidAlert } from '../common/interfaces/aid-alert.interface';
import { AlertsService } from './alerts.service';
import { CreateAidAlertDto } from './dto/create-aid-alert.dto';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  findAll(
    @Query('status') status?: AlertStatus,
    @Query('category') category?: SupplyCategory,
    @Query('reliefPointId') reliefPointId?: string,
    @Query('department') department?: string,
    @Query('municipality') municipality?: string,
  ): Promise<AidAlert[]> {
    return this.alertsService.findAll({
      status,
      category,
      reliefPointId,
      department,
      municipality,
    });
  }

  @Post()
  create(@Body() dto: CreateAidAlertDto): Promise<AidAlert> {
    return this.alertsService.create(dto);
  }

  @Patch(':id/resolve')
  resolve(@Param('id') id: string): Promise<AidAlert> {
    return this.alertsService.resolve(id);
  }
}
