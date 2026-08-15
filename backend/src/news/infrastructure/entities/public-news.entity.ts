import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  PublicNewsCategory,
  PublicNewsStatus,
} from '../../../common/constants/app.constants';

@Entity({ name: 'public_news' })
@Index('IDX_public_news_region', ['department', 'municipality'])
@Index('IDX_public_news_status_date', ['status', 'publishedAt'])
export class PublicNewsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 180 }) title!: string;
  @Column({ type: 'varchar', length: 700 }) summary!: string;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) steps!: string[];
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  requirements!: string[];
  @Column({ type: 'enum', enum: PublicNewsCategory })
  category!: PublicNewsCategory;
  /** Vacío significa que aplica a todo el país. */
  @Column({ length: 80, default: '' }) department!: string;
  /** Vacío significa que aplica a todo el departamento o a todo el país. */
  @Column({ length: 80, default: '' }) municipality!: string;
  @Column({ length: 160 }) sourceName!: string;
  @Column({ type: 'varchar', length: 500 }) sourceUrl!: string;
  @Column({ type: 'varchar', length: 300, default: '' }) contactInfo!: string;
  @Column({ type: 'timestamptz' }) publishedAt!: Date;
  @Column({ type: 'timestamptz', nullable: true }) validUntil!: Date | null;
  @Column({ type: 'timestamptz' }) verifiedAt!: Date;
  @Column({ default: false }) featured!: boolean;
  @Column({
    type: 'enum',
    enum: PublicNewsStatus,
    default: PublicNewsStatus.PUBLISHED,
  })
  status!: PublicNewsStatus;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
