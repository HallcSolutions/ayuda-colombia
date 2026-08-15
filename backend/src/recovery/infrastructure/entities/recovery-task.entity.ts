import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  RecoveryRiskLevel,
  RecoveryTaskCategory,
  RecoveryTaskStatus,
} from '../../../common/constants/app.constants';
import { RecoveryApplicationEntity } from './recovery-application.entity';
import { RecoveryProjectEntity } from './recovery-project.entity';

@Entity({ name: 'recovery_tasks' })
@Index(['projectId', 'status'])
@Index(['category', 'status'])
export class RecoveryTaskEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) projectId!: string;
  @ManyToOne(() => RecoveryProjectEntity, (project) => project.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project!: RecoveryProjectEntity;
  @Column({ length: 160 }) title!: string;
  @Column({ type: 'varchar', length: 900 }) description!: string;
  @Column({ type: 'enum', enum: RecoveryTaskCategory })
  category!: RecoveryTaskCategory;
  @Column({ type: 'enum', enum: RecoveryRiskLevel })
  riskLevel!: RecoveryRiskLevel;
  @Column({
    type: 'enum',
    enum: RecoveryTaskStatus,
    default: RecoveryTaskStatus.PENDING_REVIEW,
  })
  status!: RecoveryTaskStatus;
  @Column({ type: 'smallint', default: 1 }) peopleNeeded!: number;
  @Column({ type: 'timestamptz', nullable: true }) scheduledFor!: Date | null;
  @Column({ type: 'smallint', nullable: true }) durationHours!: number | null;
  @Column({ type: 'varchar', length: 400, default: '' })
  skillsRequired!: string;
  @Column({ type: 'varchar', length: 500, default: '' })
  materialsNeeded!: string;
  @Column({ default: false }) professionalRequired!: boolean;
  @Column({ type: 'varchar', length: 120, default: '' }) reviewedBy!: string;
  @Column({ type: 'timestamptz', nullable: true }) reviewedAt!: Date | null;
  @OneToMany(() => RecoveryApplicationEntity, (application) => application.task)
  applications!: RecoveryApplicationEntity[];
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
