import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ConvoyStatus } from '../../common/constants/app.constants';

export class UpdateConvoyTripDto {
  @IsEnum(ConvoyStatus)
  @IsOptional()
  status?: ConvoyStatus;

  /** Apagarlo detiene el rastreo y borra el camino recorrido. */
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  shareLocation?: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @MaxLength(300)
  @IsOptional()
  cargoNotes?: string;

  @IsDateString()
  @IsOptional()
  departureAt?: string;
}
