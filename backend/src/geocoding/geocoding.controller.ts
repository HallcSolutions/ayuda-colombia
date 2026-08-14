import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SearchAddressDto } from './dto/search-address.dto';
import { GeocodingService } from './geocoding.service';
import { AddressSuggestion } from './geocoding.interface';

@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get('addresses')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  search(@Query() query: SearchAddressDto): Promise<AddressSuggestion[]> {
    return this.geocodingService.search(query);
  }
}
