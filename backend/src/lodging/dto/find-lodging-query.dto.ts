import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  LodgingKind,
  LodgingStatus,
} from '../../common/constants/app.constants';

const trimOptional = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || undefined : value;

export class FindLodgingQueryDto {
  @Transform(trimOptional)
  @IsString()
  @MaxLength(80)
  @IsOptional()
  department?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(80)
  @IsOptional()
  municipality?: string;

  @IsEnum(LodgingKind)
  @IsOptional()
  kind?: LodgingKind;

  @IsEnum(LodgingStatus)
  @IsOptional()
  status?: LodgingStatus;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  onlyAvailable?: boolean;
}
