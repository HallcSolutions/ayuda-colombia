import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * El módulo de dormidas pasa a agrupar también salud y veterinarias, así que:
 *
 * - los puntos de ayuda admiten el tipo `veterinary` (las mascotas también salen
 *   desplazadas y hoy no había dónde anotarlas);
 * - puntos y alojamientos guardan quién verificó el sitio y cuándo. Sin sello, la
 *   interfaz avisa de que el lugar está sin confirmar: a un sitio del que nadie
 *   responde no se manda a una familia de noche.
 *
 * Las columnas nacen con default para que lo ya publicado siga siendo válido; un
 * valor de enum no se puede quitar en PostgreSQL, así que la vuelta atrás sólo
 * retira las columnas y lo deja anotado.
 */
export class PlacesDirectory1786820000000 implements MigrationInterface {
  name = 'PlacesDirectory1786820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "relief_points_type_enum" ADD VALUE IF NOT EXISTS 'veterinary'`,
    );
    await queryRunner.query(
      `ALTER TABLE "relief_points" ADD "verifiedBy" character varying(120) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "relief_points" ADD "verifiedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_offers" ADD "verifiedBy" character varying(120) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_offers" ADD "verifiedAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lodging_offers" DROP COLUMN "verifiedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_offers" DROP COLUMN "verifiedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "relief_points" DROP COLUMN "verifiedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "relief_points" DROP COLUMN "verifiedBy"`,
    );
  }
}
