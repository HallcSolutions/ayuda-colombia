import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  RecoveryRiskLevel,
  RecoveryTaskStatus,
} from '../../common/constants/app.constants';

export class ReviewRecoveryTaskDto {
  @IsEnum(RecoveryRiskLevel) riskLevel!: RecoveryRiskLevel;
  @IsEnum(RecoveryTaskStatus) status!: RecoveryTaskStatus;
  @IsString() @IsNotEmpty() @MaxLength(120) reviewedBy!: string;
}
