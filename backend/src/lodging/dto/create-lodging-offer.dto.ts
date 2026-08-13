import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LodgingKind } from '../../common/constants/app.constants';

export class CreateLodgingOfferDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  placeName!: string;

  @IsEnum(LodgingKind)
  kind!: LodgingKind;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  hostName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  contactPhone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  department!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  municipality!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  addressReference!: string;

  @Type(() => Number)
  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @Type(() => Number)
  @IsLongitude()
  @IsOptional()
  longitude?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  totalSpaces!: number;

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
