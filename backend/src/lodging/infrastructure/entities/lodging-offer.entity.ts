import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  LodgingKind,
  LodgingStatus,
} from '../../../common/constants/app.constants';

@Entity({ name: 'lodging_offers' })
@Index(['department', 'municipality'])
@Index(['status', 'kind'])
export class LodgingOfferEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 }) placeName!: string;
  @Column({ type: 'enum', enum: LodgingKind }) kind!: LodgingKind;
  @Column({ length: 80 }) hostName!: string;
  @Column({ length: 30 }) contactPhone!: string;
  @Column({ length: 80 }) department!: string;
  @Column({ length: 80 }) municipality!: string;
  @Column({ length: 180 }) addressReference!: string;
  @Column({ type: 'double precision', nullable: true }) latitude!:
    number | null;
  @Column({ type: 'double precision', nullable: true }) longitude!:
    number | null;
  @Column({ type: 'int' }) totalSpaces!: number;
  /** Nunca baja de cero ni pasa de `totalSpaces`: lo garantiza el UPDATE de ocupación. */
  @Column({ type: 'int', default: 0 }) occupiedSpaces!: number;
  @Column({ type: 'smallint', nullable: true }) maxNights!: number | null;
  @Column({ default: true }) freeOfCharge!: boolean;
  @Column({ default: false }) acceptsPets!: boolean;
  @Column({ type: 'varchar', length: 400, default: '' }) notes!: string;
  @Column({
    type: 'enum',
    enum: LodgingStatus,
    default: LodgingStatus.AVAILABLE,
  })
  status!: LodgingStatus;
  /** `salt:hash` del PIN de edición. Nunca sale por la API. */
  @Column({ type: 'varchar', length: 160, default: '' }) editPinHash!: string;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
