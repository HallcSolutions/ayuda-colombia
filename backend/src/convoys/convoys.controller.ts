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
  ConvoyTrip,
  PublishedConvoyTrip,
} from '../common/interfaces/convoy-trip.interface';
import { ConvoysService } from './convoys.service';
import { AddConvoyPingDto } from './dto/add-convoy-ping.dto';
import { CreateConvoyTripDto } from './dto/create-convoy-trip.dto';
import { FindConvoysQueryDto } from './dto/find-convoys-query.dto';
import { UpdateConvoyTripDto } from './dto/update-convoy-trip.dto';

/**
 * Como en `missing`, aquí las escrituras NO piden `x-reporter-key`: quien presta su
 * camión no es brigadista y exigirlo dejaría el módulo sin uso. Cada viaje se mueve con
 * el PIN que se entregó al anunciarlo, y el abuso se contiene con el límite de peticiones.
 */
@Controller('convoys')
export class ConvoysController {
  constructor(private readonly convoysService: ConvoysService) {}

  @Get()
  findAll(@Query() filters: FindConvoysQueryDto): Promise<ConvoyTrip[]> {
    return this.convoysService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ConvoyTrip> {
    return this.convoysService.findOne(id);
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(@Body() dto: CreateConvoyTripDto): Promise<PublishedConvoyTrip> {
    return this.convoysService.create(dto);
  }

  /** Señal de posición del camión; llega cada pocos segundos mientras esté en marcha. */
  @Post(':id/pings')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  addPing(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddConvoyPingDto,
    @Headers('x-convoy-pin') editPin = '',
  ): Promise<ConvoyTrip> {
    return this.convoysService.addPing(id, dto, editPin);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateConvoyTripDto,
    @Headers('x-convoy-pin') editPin = '',
  ): Promise<ConvoyTrip> {
    return this.convoysService.update(id, dto, editPin);
  }
}
