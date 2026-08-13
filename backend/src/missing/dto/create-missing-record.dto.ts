import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
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
import { MissingSubjectKind } from '../../common/constants/app.constants';

export class CreateMissingRecordDto {
  @IsEnum(MissingSubjectKind)
  kind!: MissingSubjectKind;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  @IsOptional()
  ageYears?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(600)
  description!: string;

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
  lastSeenPlace!: string;

  @IsDateString()
  lastSeenAt!: string;

  @Type(() => Number)
  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @Type(() => Number)
  @IsLongitude()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  contactName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  contactPhone!: string;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  consentToPublish!: boolean;
}
