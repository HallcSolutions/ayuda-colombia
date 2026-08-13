import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateMealServiceDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50000)
  @IsOptional()
  portionsPlanned?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50000)
  @IsOptional()
  portionsDelivered?: number;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startsAt debe tener el formato HH:mm',
  })
  @IsOptional()
  startsAt?: string;

  @IsString()
  @MaxLength(300)
  @IsOptional()
  notes?: string;
}
