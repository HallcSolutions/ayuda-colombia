import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MissingStatus } from '../../common/constants/app.constants';

export class UpdateMissingRecordDto {
  @IsEnum(MissingStatus)
  @IsOptional()
  status?: MissingStatus;

  @IsString()
  @IsNotEmpty()
  @MaxLength(600)
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  @IsOptional()
  lastSeenPlace?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @IsOptional()
  contactPhone?: string;
}
