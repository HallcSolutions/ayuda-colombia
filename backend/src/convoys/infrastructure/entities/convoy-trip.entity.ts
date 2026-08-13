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
  ConvoyStatus,
  RouteSource,
  SupplyCategory,
} from '../../../common/constants/app.constants';
import { GeoPoint } from '../../../common/interfaces/convoy-trip.interface';
import { ReliefPointEntity } from '../../../relief-points/infrastructure/entities/relief-point.entity';

@Entity({ name: 'convoy_trips' })
@Index(['status', 'etaAt'])
export class ConvoyTripEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 80 }) driverName!: string;
  @Column({ length: 30 }) contactPhone!: string;
  @Column({ type: 'varchar', length: 12, default: '' }) vehiclePlate!: string;
  @Column({ length: 80 }) vehicleDescription!: string;
  /** Qué lleva, con las mismas categorías con las que un acopio pide ayuda. */
  @Column({ type: 'jsonb' }) cargo!: SupplyCategory[];
  @Column({ type: 'varchar', length: 300, default: '' }) cargoNotes!: string;
  @Column({ length: 80 }) originDepartment!: string;
  @Column({ length: 80 }) originMunicipality!: string;

  @Column({ type: 'uuid' }) destinationPointId!: string;

  @ManyToOne(() => ReliefPointEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'destinationPointId' })
  destination!: ReliefPointEntity;

  @Column({ type: 'timestamptz' }) departureAt!: Date;
  @Column({ type: 'enum', enum: ConvoyStatus, default: ConvoyStatus.SCHEDULED })
  status!: ConvoyStatus;
  /** Permiso expreso de quien conduce: sin él no se guarda ni una coordenada. */
  @Column({ default: false }) shareLocation!: boolean;

  @Column({ type: 'double precision', nullable: true }) latitude!:
    number | null;
  @Column({ type: 'double precision', nullable: true }) longitude!:
    number | null;
  @Column({ type: 'timestamptz', nullable: true }) lastPingAt!: Date | null;
  @Column({ type: 'double precision', nullable: true }) speedKmh!:
    number | null;
  @Column({ type: 'double precision', nullable: true }) remainingKm!:
    number | null;
  @Column({ type: 'timestamptz', nullable: true }) etaAt!: Date | null;

  /** Tramo de carretera que aún falta; se recorta en cada ping y se rehace si se desvía. */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  routeGeometry!: GeoPoint[];
  @Column({ type: 'enum', enum: RouteSource, nullable: true })
  routeSource!: RouteSource | null;
  @Column({ type: 'timestamptz', nullable: true }) routeUpdatedAt!: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) arrivedAt!: Date | null;

  /** `salt:hash` del PIN del viaje. Nunca sale por la API. */
  @Column({ type: 'varchar', length: 160, default: '' }) editPinHash!: string;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
