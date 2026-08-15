import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  RecoveryProjectKind,
  RecoveryProjectStatus,
} from '../../common/constants/app.constants';

export class FindRecoveryProjectsQueryDto {
  @IsString() @MaxLength(80) @IsOptional() department?: string;
  @IsString() @MaxLength(80) @IsOptional() municipality?: string;
  @IsEnum(RecoveryProjectKind) @IsOptional() kind?: RecoveryProjectKind;
  @IsEnum(RecoveryProjectStatus) @IsOptional() status?: RecoveryProjectStatus;
}
