import { MigrationInterface, QueryRunner } from 'typeorm';

export class NeedsDigests1786800000000 implements MigrationInterface {
  name = 'NeedsDigests1786800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."needs_digests_status_enum" AS ENUM('ok', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "needs_digests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "windowFrom" TIMESTAMP WITH TIME ZONE NOT NULL, "windowTo" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."needs_digests_status_enum" NOT NULL, "error" character varying(500) NOT NULL DEFAULT '', "durationMs" integer NOT NULL DEFAULT '0', "content" jsonb NOT NULL, "ranAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_needs_digests_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_needs_digests_ran_at" ON "needs_digests" ("ranAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_needs_digests_ran_at"`);
    await queryRunner.query(`DROP TABLE "needs_digests"`);
    await queryRunner.query(`DROP TYPE "public"."needs_digests_status_enum"`);
  }
}
