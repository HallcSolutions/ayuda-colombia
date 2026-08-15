import { IsEnum } from 'class-validator';
import { RecoveryProjectStatus } from '../../common/constants/app.constants';

export class UpdateRecoveryProjectDto {
  @IsEnum(RecoveryProjectStatus) status!: RecoveryProjectStatus;
}
