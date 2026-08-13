import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  ReportStatus,
  UrgencyLevel,
} from '../../common/constants/app.constants';

export class UpdateReportDto {
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @IsEnum(UrgencyLevel)
  @IsOptional()
  urgency?: UrgencyLevel;

  @IsString()
  @MaxLength(800)
  @IsOptional()
  notice?: string;

  @IsString()
  @IsOptional()
  needs?: string;
}
