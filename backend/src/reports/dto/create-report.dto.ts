import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { UrgencyLevel } from '../../common/constants/app.constants';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  reporterName!: string;

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
  @IsInt()
  @Min(1)
  @Max(50)
  householdSize!: number;

  @IsEnum(UrgencyLevel)
  urgency!: UrgencyLevel;

  @IsString()
  @IsNotEmpty()
  needs!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(800)
  notice!: string;

  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  accuracy?: number;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  consentToShareLocation!: boolean;
}
