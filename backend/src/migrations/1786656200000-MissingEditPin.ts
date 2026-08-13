import { MigrationInterface, QueryRunner } from 'typeorm';

export class MissingEditPin1786656200000 implements MigrationInterface {
  name = 'MissingEditPin1786656200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "missing_records" ADD "editPinHash" character varying(160) NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "missing_records" DROP COLUMN "editPinHash"`,
    );
  }
}
