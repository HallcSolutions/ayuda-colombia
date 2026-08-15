import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { RecoveryApplicationStatus } from '../../../common/constants/app.constants';
import { RecoveryHelperEntity } from './recovery-helper.entity';
import { RecoveryTaskEntity } from './recovery-task.entity';

@Entity({ name: 'recovery_applications' })
@Unique('UQ_recovery_application_task_helper', ['taskId', 'helperId'])
@Index(['taskId', 'status'])
@Index(['helperId', 'status'])
export class RecoveryApplicationEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) taskId!: string;
  @ManyToOne(() => RecoveryTaskEntity, (task) => task.applications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskId' })
  task!: RecoveryTaskEntity;
  @Column({ type: 'uuid' }) helperId!: string;
  @ManyToOne(() => RecoveryHelperEntity, (helper) => helper.applications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'helperId' })
  helper!: RecoveryHelperEntity;
  @Column({ type: 'varchar', length: 500, default: '' }) message!: string;
  @Column({ type: 'varchar', length: 180, default: '' }) availability!: string;
  @Column({
    type: 'enum',
    enum: RecoveryApplicationStatus,
    default: RecoveryApplicationStatus.PENDING,
  })
  status!: RecoveryApplicationStatus;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
