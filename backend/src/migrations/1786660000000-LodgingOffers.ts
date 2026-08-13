import { MigrationInterface, QueryRunner } from 'typeorm';

export class LodgingOffers1786660000000 implements MigrationInterface {
  name = 'LodgingOffers1786660000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."lodging_offers_kind_enum" AS ENUM('home', 'hotel', 'motel', 'hostel', 'farm', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lodging_offers_status_enum" AS ENUM('available', 'full', 'closed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "lodging_offers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "placeName" character varying(120) NOT NULL, "kind" "public"."lodging_offers_kind_enum" NOT NULL, "hostName" character varying(80) NOT NULL, "contactPhone" character varying(30) NOT NULL, "department" character varying(80) NOT NULL, "municipality" character varying(80) NOT NULL, "addressReference" character varying(180) NOT NULL, "latitude" double precision, "longitude" double precision, "totalSpaces" integer NOT NULL, "occupiedSpaces" integer NOT NULL DEFAULT 0, "maxNights" smallint, "freeOfCharge" boolean NOT NULL DEFAULT true, "acceptsPets" boolean NOT NULL DEFAULT false, "notes" character varying(400) NOT NULL DEFAULT '', "status" "public"."lodging_offers_status_enum" NOT NULL DEFAULT 'available', "editPinHash" character varying(160) NOT NULL DEFAULT '', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_lodging_offers_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lodging_offers_status_kind" ON "lodging_offers" ("status", "kind") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lodging_offers_region" ON "lodging_offers" ("department", "municipality") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_lodging_offers_region"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_lodging_offers_status_kind"`,
    );
    await queryRunner.query(`DROP TABLE "lodging_offers"`);
    await queryRunner.query(`DROP TYPE "public"."lodging_offers_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."lodging_offers_kind_enum"`);
  }
}
