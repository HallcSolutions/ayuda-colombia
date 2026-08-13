import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MealType } from '../../common/constants/app.constants';

export class CreateMealServiceDto {
  @IsUUID()
  reliefPointId!: string;

  @IsEnum(MealType)
  mealType!: MealType;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'servedOn debe tener el formato AAAA-MM-DD',
  })
  servedOn!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startsAt debe tener el formato HH:mm',
  })
  startsAt!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50000)
  portionsPlanned!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50000)
  @IsOptional()
  portionsDelivered?: number;

  @IsString()
  @MaxLength(300)
  @IsOptional()
  notes?: string;
}
