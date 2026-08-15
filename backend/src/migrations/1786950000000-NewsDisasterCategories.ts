import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Compatibilidad para instalaciones que alcanzaron a ejecutar la primera
 * versión de PublicNews, cuando el enum todavía describía ayudas generales.
 */
export class NewsDisasterCategories1786950000000 implements MigrationInterface {
  name = 'NewsDisasterCategories1786950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const category of [
      'earthquake',
      'flood',
      'landslide',
      'wildfire',
      'storm',
      'drought',
      'other',
    ]) {
      await queryRunner.query(
        `ALTER TYPE "public_news_category_enum" ADD VALUE IF NOT EXISTS '${category}'`,
      );
    }
  }

  // PostgreSQL no permite retirar valores de un enum de forma segura si una
  // instalación antigua aún conserva filas archivadas con esas categorías.
  public async down(): Promise<void> {}
}
