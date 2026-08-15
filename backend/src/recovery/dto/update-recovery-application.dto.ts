import { IsEnum } from 'class-validator';
import { RecoveryApplicationStatus } from '../../common/constants/app.constants';

export class UpdateRecoveryApplicationDto {
  @IsEnum(RecoveryApplicationStatus) status!: RecoveryApplicationStatus;
}
