import { IsEnum } from 'class-validator';
import { RecoveryTaskStatus } from '../../common/constants/app.constants';

export class UpdateRecoveryTaskDto {
  @IsEnum(RecoveryTaskStatus) status!: RecoveryTaskStatus;
}
