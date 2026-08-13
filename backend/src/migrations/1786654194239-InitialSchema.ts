import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1786654194239 implements MigrationInterface {
  name = 'InitialSchema1786654194239';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Las claves primarias usan uuid_generate_v4(): la extensión debe existir
    // antes de crear las tablas en una base recién creada.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TYPE "public"."house_reports_urgency_enum" AS ENUM('critical', 'high', 'medium', 'low')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."house_reports_status_enum" AS ENUM('open', 'in_progress', 'resolved')`,
    );
    await queryRunner.query(
      `CREATE TABLE "house_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reporterName" character varying(80) NOT NULL, "contactPhone" character varying(30) NOT NULL, "department" character varying(80) NOT NULL, "municipality" character varying(80) NOT NULL, "addressReference" character varying(180) NOT NULL, "householdSize" smallint NOT NULL, "urgency" "public"."house_reports_urgency_enum" NOT NULL, "needs" jsonb NOT NULL, "notice" character varying(800) NOT NULL, "photos" jsonb NOT NULL, "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, "accuracy" double precision, "locationCapturedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."house_reports_status_enum" NOT NULL DEFAULT 'open', "consentToShareLocation" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a450969b419f1cf4018e7cd13b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_04a54eaa848e3f212e63129811" ON "house_reports" ("status", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_99b291684c6d7c0a854c2bc7f1" ON "house_reports" ("department", "municipality") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."relief_points_type_enum" AS ENUM('collection_center', 'community_kitchen', 'shelter', 'medical_post')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."relief_points_status_enum" AS ENUM('active', 'full', 'closed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "relief_points" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "type" "public"."relief_points_type_enum" NOT NULL, "department" character varying(80) NOT NULL, "municipality" character varying(80) NOT NULL, "addressReference" character varying(180) NOT NULL, "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, "contactName" character varying(80) NOT NULL, "contactPhone" character varying(30) NOT NULL, "schedule" character varying(120) NOT NULL, "dailyMealCapacity" integer, "status" "public"."relief_points_status_enum" NOT NULL DEFAULT 'active', "notes" character varying(400) NOT NULL DEFAULT '', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6c9c3f2c3722693bda31b8e3fdf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fb5e11a77a83eafaccf5d57733" ON "relief_points" ("status", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d912097906cbeedfa8adac982e" ON "relief_points" ("department", "municipality") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."meal_services_mealtype_enum" AS ENUM('breakfast', 'lunch', 'dinner', 'snack')`,
    );
    await queryRunner.query(
      `CREATE TABLE "meal_services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reliefPointId" uuid NOT NULL, "mealType" "public"."meal_services_mealtype_enum" NOT NULL, "servedOn" date NOT NULL, "startsAt" character varying(5) NOT NULL, "portionsPlanned" integer NOT NULL, "portionsDelivered" integer NOT NULL DEFAULT '0', "notes" character varying(300) NOT NULL DEFAULT '', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_bc31c38b46b9076e670027190c1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_12edec1a878a0981708ea9777e" ON "meal_services" ("reliefPointId", "servedOn") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."aid_alerts_category_enum" AS ENUM('food', 'water', 'medicine', 'hygiene', 'clothing', 'shelter_kit', 'volunteers', 'transport', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."aid_alerts_severity_enum" AS ENUM('critical', 'high', 'medium', 'low')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."aid_alerts_status_enum" AS ENUM('active', 'resolved')`,
    );
    await queryRunner.query(
      `CREATE TABLE "aid_alerts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reliefPointId" uuid NOT NULL, "category" "public"."aid_alerts_category_enum" NOT NULL, "severity" "public"."aid_alerts_severity_enum" NOT NULL, "title" character varying(120) NOT NULL, "message" character varying(500) NOT NULL, "requestedQuantity" character varying(60) NOT NULL DEFAULT '', "status" "public"."aid_alerts_status_enum" NOT NULL DEFAULT 'active', "createdBy" character varying(80) NOT NULL, "resolvedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1b90b67ba5555023404a9daffac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2d58c5d1ecf47e34a76063f184" ON "aid_alerts" ("status", "createdAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_services" ADD CONSTRAINT "FK_a8eae2c5dea3991eafbd78499ac" FOREIGN KEY ("reliefPointId") REFERENCES "relief_points"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "aid_alerts" ADD CONSTRAINT "FK_024a6ea0a50e2390e29e6805c9a" FOREIGN KEY ("reliefPointId") REFERENCES "relief_points"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "aid_alerts" DROP CONSTRAINT "FK_024a6ea0a50e2390e29e6805c9a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_services" DROP CONSTRAINT "FK_a8eae2c5dea3991eafbd78499ac"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2d58c5d1ecf47e34a76063f184"`,
    );
    await queryRunner.query(`DROP TABLE "aid_alerts"`);
    await queryRunner.query(`DROP TYPE "public"."aid_alerts_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."aid_alerts_severity_enum"`);
    await queryRunner.query(`DROP TYPE "public"."aid_alerts_category_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_12edec1a878a0981708ea9777e"`,
    );
    await queryRunner.query(`DROP TABLE "meal_services"`);
    await queryRunner.query(`DROP TYPE "public"."meal_services_mealtype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d912097906cbeedfa8adac982e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fb5e11a77a83eafaccf5d57733"`,
    );
    await queryRunner.query(`DROP TABLE "relief_points"`);
    await queryRunner.query(`DROP TYPE "public"."relief_points_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."relief_points_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_99b291684c6d7c0a854c2bc7f1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_04a54eaa848e3f212e63129811"`,
    );
    await queryRunner.query(`DROP TABLE "house_reports"`);
    await queryRunner.query(`DROP TYPE "public"."house_reports_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."house_reports_urgency_enum"`);
  }
}
