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
import { MealType } from '../../../common/constants/app.constants';
import { ReliefPointEntity } from '../../../relief-points/infrastructure/entities/relief-point.entity';

@Entity({ name: 'meal_services' })
@Index(['reliefPointId', 'servedOn'])
export class MealServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' }) reliefPointId!: string;

  @ManyToOne(() => ReliefPointEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reliefPointId' })
  reliefPoint!: ReliefPointEntity;

  @Column({ type: 'enum', enum: MealType }) mealType!: MealType;
  @Column({ type: 'date' }) servedOn!: string;
  @Column({ type: 'varchar', length: 5 }) startsAt!: string;
  @Column({ type: 'int' }) portionsPlanned!: number;
  @Column({ type: 'int', default: 0 }) portionsDelivered!: number;
  @Column({ type: 'varchar', length: 300, default: '' }) notes!: string;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
