import { Type } from 'class-transformer';
import {
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
import { ReliefPointType } from '../../common/constants/app.constants';

export class CreateReliefPointDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsEnum(ReliefPointType)
  type!: ReliefPointType;

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
  latitude!: number;

  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  contactName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  contactPhone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  schedule!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50000)
  @IsOptional()
  dailyMealCapacity?: number;

  @IsString()
  @MaxLength(400)
  @IsOptional()
  notes?: string;
}
