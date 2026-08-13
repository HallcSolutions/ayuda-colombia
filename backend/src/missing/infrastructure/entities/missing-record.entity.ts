import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  MissingStatus,
  MissingSubjectKind,
} from '../../../common/constants/app.constants';

@Entity({ name: 'missing_records' })
@Index(['department', 'municipality'])
@Index(['status', 'lastSeenAt'])
export class MissingRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: MissingSubjectKind })
  kind!: MissingSubjectKind;
  @Column({ length: 80 }) name!: string;
  @Column({ type: 'smallint', nullable: true }) ageYears!: number | null;
  @Column({ type: 'varchar', length: 600 }) description!: string;
  @Column({ length: 80 }) department!: string;
  @Column({ length: 80 }) municipality!: string;
  @Column({ length: 180 }) lastSeenPlace!: string;
  @Column({ type: 'timestamptz' }) lastSeenAt!: Date;
  @Column({ type: 'double precision', nullable: true }) latitude!:
    number | null;
  @Column({ type: 'double precision', nullable: true }) longitude!:
    number | null;
  @Column({ length: 80 }) contactName!: string;
  @Column({ length: 30 }) contactPhone!: string;
  @Column({ type: 'jsonb' }) photos!: string[];
  @Column({
    type: 'enum',
    enum: MissingStatus,
    default: MissingStatus.SEARCHING,
  })
  status!: MissingStatus;
  @Column({ type: 'timestamptz', nullable: true }) foundAt!: Date | null;
  @Column({ default: false }) consentToPublish!: boolean;
  /** `salt:hash` del PIN de edición. Nunca sale por la API. */
  @Column({ type: 'varchar', length: 160, default: '' }) editPinHash!: string;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
