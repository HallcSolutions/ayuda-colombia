import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { MAX_MISSING_PHOTOS } from '../common/constants/app.constants';
import {
  MissingRecord,
  PublishedMissingRecord,
} from '../common/interfaces/missing-record.interface';
import { photoUploadOptions } from '../common/uploads/photo-upload';
import { CreateMissingRecordDto } from './dto/create-missing-record.dto';
import { FindMissingQueryDto } from './dto/find-missing-query.dto';
import { UpdateMissingRecordDto } from './dto/update-missing-record.dto';
import { MissingService } from './missing.service';

/**
 * Cualquier persona puede publicar una búsqueda sin cuenta. El abuso se contiene
 * con el límite de peticiones y con el máximo de fotos por publicación.
 */
@Controller('missing')
export class MissingController {
  constructor(private readonly missingService: MissingService) {}

  @Get()
  findAll(@Query() filters: FindMissingQueryDto): Promise<MissingRecord[]> {
    return this.missingService.findAll(filters);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<MissingRecord> {
    return this.missingService.findOne(id);
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FilesInterceptor('photos', MAX_MISSING_PHOTOS, photoUploadOptions),
  )
  create(
    @Body() dto: CreateMissingRecordDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ): Promise<PublishedMissingRecord> {
    if (!files.length)
      throw new BadRequestException('Debes adjuntar al menos una foto');
    if (!dto.consentToPublish) {
      throw new BadRequestException(
        'Se requiere autorización para publicar la foto y el contacto',
      );
    }
    return this.missingService.create(dto, files);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMissingRecordDto,
    @Headers('x-missing-pin') editPin = '',
  ): Promise<MissingRecord> {
    return this.missingService.update(id, dto, editPin);
  }
}
