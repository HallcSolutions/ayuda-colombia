import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  HelperCredentialType,
  RecoveryTaskCategory,
} from '../../common/constants/app.constants';

export class RegisterRecoveryHelperDto {
  @IsString() @IsNotEmpty() @MaxLength(100) fullName!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) displayName!: string;
  @IsString() @IsNotEmpty() @MaxLength(20) documentType!: string;
  @IsString() @IsNotEmpty() @MaxLength(40) documentNumber!: string;
  @IsString() @IsNotEmpty() @MaxLength(30) contactPhone!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) department!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) municipality!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsEnum(RecoveryTaskCategory, { each: true })
  skills!: RecoveryTaskCategory[];
  @IsString() @MaxLength(600) @IsOptional() bio?: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(80) yearsExperience!: number;
  @IsEnum(HelperCredentialType) credentialType!: HelperCredentialType;
  @IsString() @MaxLength(80) @IsOptional() credentialNumber?: string;
  @IsString() @MaxLength(160) @IsOptional() credentialIssuer?: string;
  @IsString() @MaxLength(100) @IsOptional() referenceName?: string;
  @IsString() @MaxLength(30) @IsOptional() referencePhone?: string;
  @IsBoolean() consentToVerification!: boolean;
}
