import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ConvoyStatus } from '../../common/constants/app.constants';

const trimOptional = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || undefined : value;

export class FindConvoysQueryDto {
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

  @IsEnum(ConvoyStatus)
  @IsOptional()
  status?: ConvoyStatus;

  @IsUUID()
  @IsOptional()
  destinationPointId?: string;
}
