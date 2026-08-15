import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  RecoveryProjectKind,
  RecoverySalesMode,
} from '../../common/constants/app.constants';

export class CreateRecoveryProjectDto {
  @IsEnum(RecoveryProjectKind) kind!: RecoveryProjectKind;
  @IsString() @IsNotEmpty() @MaxLength(140) name!: string;
  @IsString() @IsNotEmpty() @MaxLength(1200) story!: string;
  @IsString() @IsNotEmpty() @MaxLength(100) organizerName!: string;
  @IsString() @IsNotEmpty() @MaxLength(30) contactPhone!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) department!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) municipality!: string;
  @IsString() @IsNotEmpty() @MaxLength(180) areaReference!: string;
  @IsString() @MaxLength(700) @IsOptional() productsOrServices?: string;
  @IsString() @MaxLength(180) @IsOptional() priceReference?: string;
  @IsArray()
  @ArrayMaxSize(5)
  @IsEnum(RecoverySalesMode, { each: true })
  @IsOptional()
  salesModes?: RecoverySalesMode[];
  @IsString() @MaxLength(180) @IsOptional() schedule?: string;
  @IsBoolean() @IsOptional() shareContactPublicly?: boolean;
  @IsBoolean() consentToVerification!: boolean;
}
