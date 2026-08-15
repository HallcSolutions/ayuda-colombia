import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  RecoveryProjectKind,
  RecoveryProjectStatus,
  RecoverySalesMode,
} from '../../../common/constants/app.constants';
import { RecoveryTaskEntity } from './recovery-task.entity';

@Entity({ name: 'recovery_projects' })
@Index(['department', 'municipality'])
@Index(['status', 'kind'])
export class RecoveryProjectEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'enum', enum: RecoveryProjectKind })
  kind!: RecoveryProjectKind;
  @Column({ length: 140 }) name!: string;
  @Column({ type: 'varchar', length: 1200 }) story!: string;
  @Column({ length: 100 }) organizerName!: string;
  /** Privado salvo autorización explícita; la cola de verificación sí lo muestra. */
  @Column({ length: 30 }) contactPhone!: string;
  @Column({ length: 80 }) department!: string;
  @Column({ length: 80 }) municipality!: string;
  /** Zona aproximada; nunca se almacena aquí una dirección residencial exacta. */
  @Column({ length: 180 }) areaReference!: string;
  @Column({ type: 'varchar', length: 700, default: '' })
  productsOrServices!: string;
  @Column({ type: 'varchar', length: 180, default: '' })
  priceReference!: string;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  salesModes!: RecoverySalesMode[];
  @Column({ type: 'varchar', length: 180, default: '' }) schedule!: string;
  @Column({ default: false }) shareContactPublicly!: boolean;
  @Column({
    type: 'enum',
    enum: RecoveryProjectStatus,
    default: RecoveryProjectStatus.OPEN,
  })
  status!: RecoveryProjectStatus;
  @Column({ type: 'varchar', length: 120, default: '' }) verifiedBy!: string;
  @Column({ type: 'timestamptz', nullable: true }) verifiedAt!: Date | null;
  @Column({ type: 'varchar', length: 160 }) editPinHash!: string;
  @OneToMany(() => RecoveryTaskEntity, (task) => task.project)
  tasks!: RecoveryTaskEntity[];
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
