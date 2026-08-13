import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LodgingStatus } from '../../common/constants/app.constants';

/**
 * Lo que puede cambiar quien ofrece la dormida sin tocar la ocupación:
 * cuántos cupos ofrece, cómo lo contactan y si retira el ofrecimiento.
 */
export class UpdateLodgingOfferDto {
  @IsEnum(LodgingStatus)
  @IsOptional()
  status?: LodgingStatus;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2000)
  @IsOptional()
  totalSpaces?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @IsOptional()
  hostName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  @IsOptional()
  addressReference?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  maxNights?: number;

  @IsBoolean()
  @IsOptional()
  freeOfCharge?: boolean;

  @IsBoolean()
  @IsOptional()
  acceptsPets?: boolean;

  @IsString()
  @MaxLength(400)
  @IsOptional()
  notes?: string;
}
