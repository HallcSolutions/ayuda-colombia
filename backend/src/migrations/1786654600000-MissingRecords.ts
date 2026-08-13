import { MigrationInterface, QueryRunner } from 'typeorm';

export class MissingRecords1786654600000 implements MigrationInterface {
  name = 'MissingRecords1786654600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."missing_records_kind_enum" AS ENUM('person', 'animal')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."missing_records_status_enum" AS ENUM('searching', 'found', 'closed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "missing_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "kind" "public"."missing_records_kind_enum" NOT NULL, "name" character varying(80) NOT NULL, "ageYears" smallint, "description" character varying(600) NOT NULL, "department" character varying(80) NOT NULL, "municipality" character varying(80) NOT NULL, "lastSeenPlace" character varying(180) NOT NULL, "lastSeenAt" TIMESTAMP WITH TIME ZONE NOT NULL, "latitude" double precision, "longitude" double precision, "contactName" character varying(80) NOT NULL, "contactPhone" character varying(30) NOT NULL, "photos" jsonb NOT NULL, "status" "public"."missing_records_status_enum" NOT NULL DEFAULT 'searching', "foundAt" TIMESTAMP WITH TIME ZONE, "consentToPublish" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_missing_records_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_missing_records_status_last_seen" ON "missing_records" ("status", "lastSeenAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_missing_records_region" ON "missing_records" ("department", "municipality") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_missing_records_region"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_missing_records_status_last_seen"`,
    );
    await queryRunner.query(`DROP TABLE "missing_records"`);
    await queryRunner.query(`DROP TYPE "public"."missing_records_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."missing_records_kind_enum"`);
  }
}
