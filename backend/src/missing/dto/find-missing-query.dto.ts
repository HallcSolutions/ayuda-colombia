import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  MissingStatus,
  MissingSubjectKind,
} from '../../common/constants/app.constants';

const trimOptional = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || undefined : value;

export class FindMissingQueryDto {
  @Transform(trimOptional)
  @IsString()
  @MaxLength(80)
  @IsOptional()
  department?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(80)
  @IsOptional()
  municipality?: string;

  @IsEnum(MissingSubjectKind)
  @IsOptional()
  kind?: MissingSubjectKind;

  @IsEnum(MissingStatus)
  @IsOptional()
  status?: MissingStatus;
}
