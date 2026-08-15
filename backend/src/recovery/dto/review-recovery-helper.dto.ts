import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  HelperVerificationLevel,
  HelperVerificationMethod,
  RecoveryTaskCategory,
} from '../../common/constants/app.constants';

export class ReviewRecoveryHelperDto {
  @IsEnum(HelperVerificationLevel) verificationLevel!: HelperVerificationLevel;
  @IsEnum(HelperVerificationMethod)
  @IsOptional()
  verificationMethod?: HelperVerificationMethod;
  @IsArray()
  @ArrayMaxSize(8)
  @IsEnum(RecoveryTaskCategory, { each: true })
  verifiedSkills!: RecoveryTaskCategory[];
  @IsString() @IsNotEmpty() @MaxLength(120) verifiedBy!: string;
  @IsString() @MaxLength(600) @IsOptional() verificationNotes?: string;

  @IsString() @MaxLength(160) @IsOptional() verificationSourceName?: string;

  @IsString() @MaxLength(500) @IsOptional() verificationSourceUrl?: string;
}
