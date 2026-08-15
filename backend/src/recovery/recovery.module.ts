import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecoveryApplicationEntity } from './infrastructure/entities/recovery-application.entity';
import { RecoveryHelperEntity } from './infrastructure/entities/recovery-helper.entity';
import { RecoveryProjectEntity } from './infrastructure/entities/recovery-project.entity';
import { RecoveryTaskEntity } from './infrastructure/entities/recovery-task.entity';
import { RecoveryController } from './recovery.controller';
import { RecoveryGateway } from './recovery.gateway';
import { RecoveryService } from './recovery.service';
import { RecoveryVerifierGuard } from './recovery-verifier.guard';
import { PhotoStorageService } from '../common/uploads/photo-upload';
import { EmailModule } from '../common/email/email.module';
import { RecoveryAccessMailer } from './recovery-access.mailer';

@Module({
  imports: [
    EmailModule,
    TypeOrmModule.forFeature([
      RecoveryProjectEntity,
      RecoveryTaskEntity,
      RecoveryHelperEntity,
      RecoveryApplicationEntity,
    ]),
  ],
  controllers: [RecoveryController],
  providers: [
    PhotoStorageService,
    RecoveryAccessMailer,
    RecoveryGateway,
    RecoveryService,
    RecoveryVerifierGuard,
  ],
})
export class RecoveryModule {}
