import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ReliefPointStatus,
  ReliefPointType,
} from '../common/constants/app.constants';
import { ReliefPoint } from '../common/interfaces/relief-point.interface';
import { CreateReliefPointDto } from './dto/create-relief-point.dto';
import { UpdateReliefPointDto } from './dto/update-relief-point.dto';
import { ReliefPointsService } from './relief-points.service';

@Controller('relief-points')
export class ReliefPointsController {
  constructor(private readonly reliefPointsService: ReliefPointsService) {}

  @Get()
  findAll(
    @Query('type') type?: ReliefPointType,
    @Query('department') department?: string,
    @Query('municipality') municipality?: string,
    @Query('status') status?: ReliefPointStatus,
  ): Promise<ReliefPoint[]> {
    return this.reliefPointsService.findAll({
      type,
      department,
      municipality,
      status,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ReliefPoint> {
    return this.reliefPointsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateReliefPointDto): Promise<ReliefPoint> {
    return this.reliefPointsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReliefPointDto,
  ): Promise<ReliefPoint> {
    return this.reliefPointsService.update(id, dto);
  }
}
