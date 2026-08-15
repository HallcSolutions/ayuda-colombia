import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RecoveryTaskCategory } from '../../../common/constants/app.constants';
import { RecoveryApplicationEntity } from './recovery-application.entity';

@Entity({ name: 'recovery_helpers' })
@Index(['department', 'municipality'])
export class RecoveryHelperEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 80 }) displayName!: string;
  /** Solo se entrega a quien publicó la necesidad cuando acepta la postulación. */
  @Column({ length: 30 }) contactPhone!: string;
  /** Nunca público: solo sirve para devolver el código y el PIN a quien se registró. */
  @Column({ type: 'varchar', length: 160, default: '' })
  contactEmail!: string;
  @Column({ length: 80 }) department!: string;
  @Column({ length: 80 }) municipality!: string;
  @Column({ type: 'jsonb' }) skills!: RecoveryTaskCategory[];
  @Column({ type: 'varchar', length: 160 }) editPinHash!: string;
  @OneToMany(
    () => RecoveryApplicationEntity,
    (application) => application.helper,
  )
  applications!: RecoveryApplicationEntity[];
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
