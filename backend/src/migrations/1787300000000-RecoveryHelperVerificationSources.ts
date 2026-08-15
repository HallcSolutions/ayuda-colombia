import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecoveryHelperVerificationSources1787300000000 implements MigrationInterface {
  name = 'RecoveryHelperVerificationSources1787300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recovery_helpers" ADD COLUMN IF NOT EXISTS "verificationSourceName" character varying(160) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "recovery_helpers" ADD COLUMN IF NOT EXISTS "verificationSourceUrl" character varying(500) NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recovery_helpers" DROP COLUMN IF EXISTS "verificationSourceUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recovery_helpers" DROP COLUMN IF EXISTS "verificationSourceName"`,
    );
  }
}
