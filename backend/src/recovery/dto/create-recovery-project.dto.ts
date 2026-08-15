import { Transform, TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
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
import { emptyToUndefined } from '../../common/validation/empty-to-undefined';

/** El formulario viaja como multipart para poder adjuntar fotos: todo llega en texto. */
const toBoolean = ({ value }: TransformFnParams): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

const toArray = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export class CreateRecoveryProjectDto {
  @IsEnum(RecoveryProjectKind) kind!: RecoveryProjectKind;
  @IsString() @IsNotEmpty() @MaxLength(140) name!: string;
  @IsString() @IsNotEmpty() @MaxLength(1200) story!: string;
  @IsString() @IsNotEmpty() @MaxLength(100) organizerName!: string;
  @IsString() @IsNotEmpty() @MaxLength(30) contactPhone!: string;
  @Transform(emptyToUndefined)
  @IsEmail()
  @MaxLength(160)
  @IsOptional()
  contactEmail?: string;
  @IsString() @IsNotEmpty() @MaxLength(80) department!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) municipality!: string;
  @IsString() @IsNotEmpty() @MaxLength(180) areaReference!: string;
  @IsString() @MaxLength(700) @IsOptional() productsOrServices?: string;
  @IsString() @MaxLength(180) @IsOptional() priceReference?: string;
  @Transform(toArray)
  @IsArray()
  @ArrayMaxSize(5)
  @IsEnum(RecoverySalesMode, { each: true })
  @IsOptional()
  salesModes?: RecoverySalesMode[];
  @IsString() @MaxLength(180) @IsOptional() schedule?: string;
  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  shareContactPublicly?: boolean;
  @Transform(toBoolean) @IsBoolean() consentToVerification!: boolean;
}
