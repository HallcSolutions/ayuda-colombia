import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RecoveryTaskCategory } from '../../common/constants/app.constants';

export class CreateRecoveryTaskDto {
  @IsString() @IsNotEmpty() @MaxLength(160) title!: string;
  @IsString() @IsNotEmpty() @MaxLength(900) description!: string;
  @IsEnum(RecoveryTaskCategory) category!: RecoveryTaskCategory;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) peopleNeeded!: number;
  @IsDateString() @IsOptional() scheduledFor?: string;
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  @IsOptional()
  durationHours?: number;
  @IsString() @MaxLength(400) @IsOptional() skillsRequired?: string;
  @IsString() @MaxLength(500) @IsOptional() materialsNeeded?: string;
}
