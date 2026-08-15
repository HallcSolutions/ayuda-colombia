import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RecoveryTaskCategory } from '../../common/constants/app.constants';
import { emptyToUndefined } from '../../common/validation/empty-to-undefined';

export class RegisterRecoveryHelperDto {
  @IsString() @IsNotEmpty() @MaxLength(80) displayName!: string;
  @IsString() @IsNotEmpty() @MaxLength(30) contactPhone!: string;
  @Transform(emptyToUndefined)
  @IsEmail()
  @MaxLength(160)
  @IsOptional()
  contactEmail?: string;
  @IsString() @IsNotEmpty() @MaxLength(80) department!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) municipality!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsEnum(RecoveryTaskCategory, { each: true })
  skills!: RecoveryTaskCategory[];
  @IsBoolean() consentToShareContact!: boolean;
}
