import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { MAX_REPORT_PHOTOS } from '../common/constants/app.constants';
import { photoUploadOptions } from '../common/uploads/photo-upload';
import { CreateReportDto } from './dto/create-report.dto';
import { HouseReport } from '../common/interfaces/house-report.interface';
import { ReportsService } from './reports.service';
import { FindReportsQueryDto } from './dto/find-reports-query.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  findAll(@Query() filters: FindReportsQueryDto): Promise<HouseReport[]> {
    return this.reportsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<HouseReport> {
    return this.reportsService.findOne(id);
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FilesInterceptor('photos', MAX_REPORT_PHOTOS, photoUploadOptions),
  )
  create(
    @Body() dto: CreateReportDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ): Promise<HouseReport> {
    if (
      dto.consentToShareLocation &&
      (dto.latitude === undefined || dto.longitude === undefined)
    ) {
      throw new BadRequestException(
        'Para compartir la ubicación debes capturar el punto completo',
      );
    }
    return this.reportsService.create(dto, files);
  }
}
