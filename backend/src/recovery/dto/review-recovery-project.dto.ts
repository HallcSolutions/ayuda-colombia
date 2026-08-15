import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { RecoveryProjectStatus } from '../../common/constants/app.constants';

export class ReviewRecoveryProjectDto {
  @IsEnum(RecoveryProjectStatus) status!: RecoveryProjectStatus;
  @IsString() @IsNotEmpty() @MaxLength(120) verifiedBy!: string;
}
