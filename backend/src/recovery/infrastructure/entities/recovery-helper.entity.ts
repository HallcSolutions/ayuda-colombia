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
  HelperCredentialType,
  HelperVerificationLevel,
  HelperVerificationMethod,
  RecoveryTaskCategory,
} from '../../../common/constants/app.constants';
import { RecoveryApplicationEntity } from './recovery-application.entity';

@Entity({ name: 'recovery_helpers' })
@Index(['verificationLevel', 'department', 'municipality'])
export class RecoveryHelperEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 100 }) fullName!: string;
  @Column({ length: 80 }) displayName!: string;
  @Column({ length: 20 }) documentType!: string;
  /** Siempre privado; nunca forma parte del contrato público ni de postulaciones. */
  @Column({ length: 40 }) documentNumber!: string;
  @Column({ length: 30 }) contactPhone!: string;
  @Column({ length: 80 }) department!: string;
  @Column({ length: 80 }) municipality!: string;
  @Column({ type: 'jsonb' }) skills!: RecoveryTaskCategory[];
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  verifiedSkills!: RecoveryTaskCategory[];
  @Column({ type: 'varchar', length: 600, default: '' }) bio!: string;
  @Column({ type: 'smallint', default: 0 }) yearsExperience!: number;
  @Column({ type: 'enum', enum: HelperCredentialType })
  credentialType!: HelperCredentialType;
  @Column({ type: 'varchar', length: 80, default: '' })
  credentialNumber!: string;
  @Column({ type: 'varchar', length: 160, default: '' })
  credentialIssuer!: string;
  @Column({ type: 'varchar', length: 100, default: '' }) referenceName!: string;
  @Column({ type: 'varchar', length: 30, default: '' }) referencePhone!: string;
  @Column({
    type: 'enum',
    enum: HelperVerificationLevel,
    default: HelperVerificationLevel.PENDING,
  })
  verificationLevel!: HelperVerificationLevel;
  @Column({ type: 'enum', enum: HelperVerificationMethod, nullable: true })
  verificationMethod!: HelperVerificationMethod | null;
  @Column({ type: 'varchar', length: 120, default: '' }) verifiedBy!: string;
  @Column({ type: 'timestamptz', nullable: true }) verifiedAt!: Date | null;
  @Column({ type: 'varchar', length: 600, default: '' })
  verificationNotes!: string;
  /** Fuente consultada por el revisor; nunca incluye el documento de identidad. */
  @Column({ type: 'varchar', length: 160, default: '' })
  verificationSourceName!: string;
  @Column({ type: 'varchar', length: 500, default: '' })
  verificationSourceUrl!: string;
  @Column({ type: 'varchar', length: 160 }) editPinHash!: string;
  @OneToMany(
    () => RecoveryApplicationEntity,
    (application) => application.helper,
  )
  applications!: RecoveryApplicationEntity[];
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
