import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * La cédula de quien reporta su vivienda. El generador propuso además renombrar
 * índices y claves foráneas de convoys, lodging y missing a nombres con hash:
 * ruido ajeno a este cambio, así que la migración se quedó solo con la columna.
 *
 * Nace con default '' para que los reportes ya publicados sigan siendo válidos.
 */
export class ReportDocumentId1786662208288 implements MigrationInterface {
  name = 'ReportDocumentId1786662208288';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "house_reports" ADD "documentId" character varying(20) NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "house_reports" DROP COLUMN "documentId"`,
    );
  }
}
