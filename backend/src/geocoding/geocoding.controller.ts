import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SearchAddressDto } from './dto/search-address.dto';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto';
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

  @Get('reverse')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  reverse(@Query() query: ReverseGeocodeDto): Promise<AddressSuggestion | null> {
    return this.geocodingService.reverse(query.latitude, query.longitude);
  }
}
