import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  HelpContactChannel,
  HelpContactRole,
  ReportStatus,
  UrgencyLevel,
} from '../../../common/constants/app.constants';

@Entity({ name: 'house_reports' })
@Index(['department', 'municipality'])
@Index(['status', 'createdAt'])
export class ReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 80 }) reporterName!: string;
  /** Campo heredado: ya no se exige a una familia durante la emergencia. */
  @Column({ length: 20, default: '' }) documentId!: string;
  @Column({ length: 30 }) contactPhone!: string;
  @Column({
    type: 'varchar',
    length: 24,
    default: HelpContactRole.LOCAL_SUPPORT,
  })
  contactRole!: HelpContactRole;
  @Column({ type: 'varchar', length: 16, default: HelpContactChannel.BOTH })
  contactChannel!: HelpContactChannel;
  @Column({ default: false }) consentToDirectContact!: boolean;
  @Column({ length: 80 }) department!: string;
  @Column({ length: 80 }) municipality!: string;
  @Column({ length: 180 }) addressReference!: string;
  @Column({ type: 'smallint' }) householdSize!: number;
  @Column({ type: 'enum', enum: UrgencyLevel }) urgency!: UrgencyLevel;
  @Column({ type: 'jsonb' }) needs!: string[];
  @Column({ type: 'varchar', length: 800 }) notice!: string;
  @Column({ type: 'jsonb' }) photos!: string[];
  @Column({ type: 'double precision', nullable: true }) latitude!:
    number | null;
  @Column({ type: 'double precision', nullable: true }) longitude!:
    number | null;
  @Column({ type: 'double precision', nullable: true }) accuracy!:
    number | null;
  @Column({ type: 'timestamptz', nullable: true })
  locationCapturedAt!: Date | null;
  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.OPEN })
  status!: ReportStatus;
  @Column({ default: false }) consentToShareLocation!: boolean;
  @Column({ default: false }) fieldVerified!: boolean;
  @Column({ type: 'timestamptz', nullable: true }) verifiedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
