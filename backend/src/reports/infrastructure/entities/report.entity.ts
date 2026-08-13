import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
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
  /**
   * Cédula de quien reporta, para cruzar con los censos oficiales de damnificados.
   * Se queda en la base a propósito: `HouseReport`, que es lo que sale por la API
   * pública, no la lleva. Los reportes anteriores a este campo quedan en vacío.
   */
  @Column({ length: 20, default: '' }) documentId!: string;
  @Column({ length: 30 }) contactPhone!: string;
  @Column({ length: 80 }) department!: string;
  @Column({ length: 80 }) municipality!: string;
  @Column({ length: 180 }) addressReference!: string;
  @Column({ type: 'smallint' }) householdSize!: number;
  @Column({ type: 'enum', enum: UrgencyLevel }) urgency!: UrgencyLevel;
  @Column({ type: 'jsonb' }) needs!: string[];
  @Column({ type: 'varchar', length: 800 }) notice!: string;
  @Column({ type: 'jsonb' }) photos!: string[];
  @Column({ type: 'double precision' }) latitude!: number;
  @Column({ type: 'double precision' }) longitude!: number;
  @Column({ type: 'double precision', nullable: true }) accuracy!:
    number | null;
  @Column({ type: 'timestamptz' }) locationCapturedAt!: Date;
  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.OPEN })
  status!: ReportStatus;
  @Column({ default: false }) consentToShareLocation!: boolean;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
