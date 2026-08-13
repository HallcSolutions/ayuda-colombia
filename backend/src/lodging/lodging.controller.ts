import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  LodgingOffer,
  PublishedLodgingOffer,
} from '../common/interfaces/lodging-offer.interface';
import { CreateLodgingOfferDto } from './dto/create-lodging-offer.dto';
import { FindLodgingQueryDto } from './dto/find-lodging-query.dto';
import { UpdateLodgingOfferDto } from './dto/update-lodging-offer.dto';
import { UpdateOccupancyDto } from './dto/update-occupancy.dto';
import { LodgingService } from './lodging.service';

/**
 * Como en `missing`, aquí las escrituras NO piden `x-reporter-key`: una familia,
 * un hotel o un motel que ofrece dormida no tiene código de brigadista. Quien
 * publica recibe un PIN y con él va mermando los cupos que ya ocupó.
 */
@Controller('lodging')
export class LodgingController {
  constructor(private readonly lodgingService: LodgingService) {}

  @Get()
  findAll(@Query() filters: FindLodgingQueryDto): Promise<LodgingOffer[]> {
    return this.lodgingService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<LodgingOffer> {
    return this.lodgingService.findOne(id);
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(@Body() dto: CreateLodgingOfferDto): Promise<PublishedLodgingOffer> {
    return this.lodgingService.create(dto);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLodgingOfferDto,
    @Headers('x-lodging-pin') editPin = '',
  ): Promise<LodgingOffer> {
    return this.lodgingService.update(id, dto, editPin);
  }

  @Patch(':id/occupancy')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  changeOccupancy(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOccupancyDto,
    @Headers('x-lodging-pin') editPin = '',
  ): Promise<LodgingOffer> {
    return this.lodgingService.changeOccupancy(id, dto, editPin);
  }
}
