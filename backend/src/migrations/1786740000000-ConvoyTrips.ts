import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvoyTrips1786740000000 implements MigrationInterface {
  name = 'ConvoyTrips1786740000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."convoy_trips_status_enum" AS ENUM('scheduled', 'en_route', 'paused', 'arrived', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."convoy_trips_routesource_enum" AS ENUM('road', 'straight_line')`,
    );
    await queryRunner.query(
      `CREATE TABLE "convoy_trips" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "driverName" character varying(80) NOT NULL, "contactPhone" character varying(30) NOT NULL, "vehiclePlate" character varying(12) NOT NULL DEFAULT '', "vehicleDescription" character varying(80) NOT NULL, "cargo" jsonb NOT NULL, "cargoNotes" character varying(300) NOT NULL DEFAULT '', "originDepartment" character varying(80) NOT NULL, "originMunicipality" character varying(80) NOT NULL, "destinationPointId" uuid NOT NULL, "departureAt" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."convoy_trips_status_enum" NOT NULL DEFAULT 'scheduled', "shareLocation" boolean NOT NULL DEFAULT false, "latitude" double precision, "longitude" double precision, "lastPingAt" TIMESTAMP WITH TIME ZONE, "speedKmh" double precision, "remainingKm" double precision, "etaAt" TIMESTAMP WITH TIME ZONE, "routeGeometry" jsonb NOT NULL DEFAULT '[]'::jsonb, "routeSource" "public"."convoy_trips_routesource_enum", "routeUpdatedAt" TIMESTAMP WITH TIME ZONE, "arrivedAt" TIMESTAMP WITH TIME ZONE, "editPinHash" character varying(160) NOT NULL DEFAULT '', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_convoy_trips_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_convoy_trips_status_eta" ON "convoy_trips" ("status", "etaAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "convoy_pings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tripId" uuid NOT NULL, "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, "accuracyMeters" integer, "recordedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_convoy_pings_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_convoy_pings_trip_recorded" ON "convoy_pings" ("tripId", "recordedAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "convoy_trips" ADD CONSTRAINT "FK_convoy_trips_destination" FOREIGN KEY ("destinationPointId") REFERENCES "relief_points"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "convoy_pings" ADD CONSTRAINT "FK_convoy_pings_trip" FOREIGN KEY ("tripId") REFERENCES "convoy_trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "convoy_pings" DROP CONSTRAINT "FK_convoy_pings_trip"`,
    );
    await queryRunner.query(
      `ALTER TABLE "convoy_trips" DROP CONSTRAINT "FK_convoy_trips_destination"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_convoy_pings_trip_recorded"`,
    );
    await queryRunner.query(`DROP TABLE "convoy_pings"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_convoy_trips_status_eta"`,
    );
    await queryRunner.query(`DROP TABLE "convoy_trips"`);
    await queryRunner.query(
      `DROP TYPE "public"."convoy_trips_routesource_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."convoy_trips_status_enum"`);
  }
}
