import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecoveryProjectsPublishImmediately1787200000000 implements MigrationInterface {
  name = 'RecoveryProjectsPublishImmediately1787200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recovery_projects" ALTER COLUMN "status" SET DEFAULT 'open'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recovery_projects" ALTER COLUMN "status" SET DEFAULT 'pending_review'`,
    );
  }
}
