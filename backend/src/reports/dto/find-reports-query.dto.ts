import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportStatus } from '../../common/constants/app.constants';

const trimOptional = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || undefined : value;

export class FindReportsQueryDto {
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

  @Transform(trimOptional)
  @IsString()
  @MaxLength(80)
  @IsOptional()
  need?: string;

  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;
}
