import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Correo privado de quien publica un caso o registra su oficio: sin él, perder el
 * PIN significa perder el acceso, porque solo se guarda cifrado.
 */
export class RecoveryContactEmail1787400000000 implements MigrationInterface {
  name = 'RecoveryContactEmail1787400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recovery_projects" ADD COLUMN IF NOT EXISTS "contactEmail" character varying(160) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "recovery_helpers" ADD COLUMN IF NOT EXISTS "contactEmail" character varying(160) NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recovery_helpers" DROP COLUMN IF EXISTS "contactEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recovery_projects" DROP COLUMN IF EXISTS "contactEmail"`,
    );
  }
}
