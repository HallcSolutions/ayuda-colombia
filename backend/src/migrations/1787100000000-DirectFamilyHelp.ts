import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Permite registrar una familia sin cédula, fotos ni GPS obligatorios y publicar
 * únicamente el contacto que autorizó hablar directamente con quien ofrece ayuda.
 */
export class DirectFamilyHelp1787100000000 implements MigrationInterface {
  name = 'DirectFamilyHelp1787100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "house_reports" ADD "contactRole" character varying(24) NOT NULL DEFAULT 'local_support'`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_reports" ADD "contactChannel" character varying(16) NOT NULL DEFAULT 'both'`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_reports" ADD "consentToDirectContact" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_reports" ADD "fieldVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_reports" ADD "verifiedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_reports" ALTER COLUMN "latitude" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_reports" ALTER COLUMN "longitude" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_reports" ALTER COLUMN "locationCapturedAt" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // La versión anterior no admite ubicaciones vacías. El cero conserva la fila y
    // hace explícito que no existe un punto real si alguna vez se revierte este cambio.
    await queryRunner.query(
      `UPDATE "house_reports" SET "latitude" = 0 WHERE "latitude" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "house_reports" SET "longitude" = 0 WHERE "longitude" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "house_reports" SET "locationCapturedAt" = "createdAt" WHERE "locationCapturedAt" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_reports" ALTER COLUMN "locationCapturedAt" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_reports" ALTER COLUMN "longitude" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_reports" ALTER COLUMN "latitude" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_reports" DROP COLUMN "verifiedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_reports" DROP COLUMN "fieldVerified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_reports" DROP COLUMN "consentToDirectContact"`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_reports" DROP COLUMN "contactChannel"`,
    );
    await queryRunner.query(
      `ALTER TABLE "house_reports" DROP COLUMN "contactRole"`,
    );
  }
}
