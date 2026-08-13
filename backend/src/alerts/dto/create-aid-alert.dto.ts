import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  SupplyCategory,
  UrgencyLevel,
} from '../../common/constants/app.constants';

export class CreateAidAlertDto {
  @IsUUID()
  reliefPointId!: string;

  @IsEnum(SupplyCategory)
  category!: SupplyCategory;

  @IsEnum(UrgencyLevel)
  severity!: UrgencyLevel;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message!: string;

  @IsString()
  @MaxLength(60)
  @IsOptional()
  requestedQuantity?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  createdBy!: string;
}
