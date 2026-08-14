import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DigestRunStatus } from '../../../common/constants/app.constants';
import type { DigestContent } from '../../../common/interfaces/needs-digest.interface';

/**
 * Una fila por corrida del chequeo, incluidas las que fallaron: si el resumen deja de
 * generarse, la única forma de enterarse es que quede escrito que lo intentó y no pudo.
 */
@Entity({ name: 'needs_digests' })
@Index(['ranAt'])
export class NeedsDigestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'timestamptz' }) windowFrom!: Date;
  @Column({ type: 'timestamptz' }) windowTo!: Date;
  @Column({ type: 'enum', enum: DigestRunStatus }) status!: DigestRunStatus;
  @Column({ type: 'varchar', length: 500, default: '' }) error!: string;
  @Column({ type: 'int', default: 0 }) durationMs!: number;

  /** Lo encontrado. En una corrida fallida queda el contenido vacío. */
  @Column({ type: 'jsonb' }) content!: DigestContent;

  @CreateDateColumn({ type: 'timestamptz' }) ranAt!: Date;
}
