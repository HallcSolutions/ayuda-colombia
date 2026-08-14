import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ReliefPointStatus } from '../../common/constants/app.constants';

export class UpdateReliefPointDto {
  @IsEnum(ReliefPointStatus)
  @IsOptional()
  status?: ReliefPointStatus;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  schedule?: string;

  @IsString()
  @MaxLength(80)
  @IsOptional()
  contactName?: string;

  @IsString()
  @MaxLength(30)
  @IsOptional()
  contactPhone?: string;

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

  /** Nombre de quien verificó el sitio; cadena vacía retira el sello. */
  @IsString()
  @MaxLength(120)
  @IsOptional()
  verifiedBy?: string;

  @Type(() => Number)
  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @Type(() => Number)
  @IsLongitude()
  @IsOptional()
  longitude?: number;
}
