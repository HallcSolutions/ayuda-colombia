import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConvoyTripEntity } from './convoy-trip.entity';

/**
 * Una miga del camino: dónde estaba el camión y cuándo. Juntas dibujan el recorrido
 * real, y se borran cuando el viaje termina y pasa su tiempo de retención.
 */
@Entity({ name: 'convoy_pings' })
@Index(['tripId', 'recordedAt'])
export class ConvoyPingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' }) tripId!: string;

  @ManyToOne(() => ConvoyTripEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip!: ConvoyTripEntity;

  @Column({ type: 'double precision' }) latitude!: number;
  @Column({ type: 'double precision' }) longitude!: number;
  @Column({ type: 'int', nullable: true }) accuracyMeters!: number | null;
  @Column({ type: 'timestamptz' }) recordedAt!: Date;
}
