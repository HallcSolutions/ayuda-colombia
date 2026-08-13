import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ReliefPointStatus,
  ReliefPointType,
} from '../../../common/constants/app.constants';

@Entity({ name: 'relief_points' })
@Index(['department', 'municipality'])
@Index(['status', 'type'])
export class ReliefPointEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 }) name!: string;
  @Column({ type: 'enum', enum: ReliefPointType }) type!: ReliefPointType;
  @Column({ length: 80 }) department!: string;
  @Column({ length: 80 }) municipality!: string;
  @Column({ length: 180 }) addressReference!: string;
  @Column({ type: 'double precision' }) latitude!: number;
  @Column({ type: 'double precision' }) longitude!: number;
  @Column({ length: 80 }) contactName!: string;
  @Column({ length: 30 }) contactPhone!: string;
  @Column({ length: 120 }) schedule!: string;
  @Column({ type: 'int', nullable: true }) dailyMealCapacity!: number | null;
  @Column({
    type: 'enum',
    enum: ReliefPointStatus,
    default: ReliefPointStatus.ACTIVE,
  })
  status!: ReliefPointStatus;
  @Column({ type: 'varchar', length: 400, default: '' }) notes!: string;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
