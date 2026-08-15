import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Abre la red de recuperación a una persona concreta que necesita que le donen
 * algo (una silla de ruedas, un colchón) y permite adjuntar fotos del caso.
 */
export class RecoveryPersonalNeeds1787500000000 implements MigrationInterface {
  name = 'RecoveryPersonalNeeds1787500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."recovery_projects_kind_enum" ADD VALUE IF NOT EXISTS 'person'`,
    );
    for (const category of ['assistive_device', 'household_goods']) {
      await queryRunner.query(
        `ALTER TYPE "public"."recovery_tasks_category_enum" ADD VALUE IF NOT EXISTS '${category}'`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "recovery_projects" ADD COLUMN IF NOT EXISTS "photos" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
  }

  // PostgreSQL no permite retirar valores de un enum mientras existan filas que
  // los usen, así que la vuelta atrás solo suelta la columna de fotos.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recovery_projects" DROP COLUMN IF EXISTS "photos"`,
    );
  }
}
