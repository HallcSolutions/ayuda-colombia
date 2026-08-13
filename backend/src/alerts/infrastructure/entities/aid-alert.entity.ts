import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  AlertStatus,
  SupplyCategory,
  UrgencyLevel,
} from '../../../common/constants/app.constants';
import { ReliefPointEntity } from '../../../relief-points/infrastructure/entities/relief-point.entity';

@Entity({ name: 'aid_alerts' })
@Index(['status', 'createdAt'])
export class AidAlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' }) reliefPointId!: string;

  @ManyToOne(() => ReliefPointEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'reliefPointId' })
  reliefPoint!: ReliefPointEntity;

  @Column({ type: 'enum', enum: SupplyCategory }) category!: SupplyCategory;
  @Column({ type: 'enum', enum: UrgencyLevel }) severity!: UrgencyLevel;
  @Column({ length: 120 }) title!: string;
  @Column({ type: 'varchar', length: 500 }) message!: string;
  @Column({ type: 'varchar', length: 60, default: '' })
  requestedQuantity!: string;
  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.ACTIVE })
  status!: AlertStatus;
  @Column({ length: 80 }) createdBy!: string;
  @Column({ type: 'timestamptz', nullable: true }) resolvedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
