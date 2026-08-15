import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Distingue los avisos ciudadanos de los enlaces institucionales y carga una primera
 * selección revisada el 15 de agosto. Las fotos permanecen en la ficha original.
 */
export class VerifiedMissingSources1787400000000 implements MigrationInterface {
  name = 'VerifiedMissingSources1787400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "missing_records" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."missing_records_status_enum" RENAME TO "missing_records_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."missing_records_status_enum" AS ENUM('searching', 'sheltered', 'found', 'closed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "missing_records" ALTER COLUMN "status" TYPE "public"."missing_records_status_enum" USING "status"::text::"public"."missing_records_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missing_records" ALTER COLUMN "status" SET DEFAULT 'searching'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."missing_records_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missing_records" ADD "sourceName" character varying(160)`,
    );
    await queryRunner.query(
      `ALTER TABLE "missing_records" ADD "sourceUrl" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "missing_records" ADD "sourceVerifiedAt" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(`
      INSERT INTO "missing_records" (
        "id", "kind", "name", "ageYears", "description", "department",
        "municipality", "lastSeenPlace", "lastSeenAt", "latitude", "longitude",
        "contactName", "contactPhone", "photos", "status", "foundAt",
        "consentToPublish", "editPinHash", "sourceName", "sourceUrl",
        "sourceVerifiedAt", "createdAt", "updatedAt"
      ) VALUES
      (
        'a1010000-0000-4000-8000-000000000001', 'animal', 'Martina', NULL,
        'Perra yorkie bicolor, identificada con microchip. El portal informa que desapareció el 12 de agosto de 2026 en Santa Sofía, Barrios Unidos. Confirma la vigencia y consulta la foto en la ficha original.',
        'Bogotá D.C.', 'Bogotá D.C.', 'Santa Sofía, Barrios Unidos',
        '2026-08-12T12:00:00-05:00', NULL, NULL,
        'IDPYBA — Animales perdidos', '3058948873', '[]'::jsonb, 'searching', NULL,
        false, '', 'Instituto Distrital de Protección y Bienestar Animal',
        'https://www.animalesbog.gov.co/wpyba/animalesperdidos/index.php/animales-perdidos/martina',
        '2026-08-15T11:20:00-05:00', NOW(), NOW()
      ),
      (
        'a1010000-0000-4000-8000-000000000002', 'animal', 'Niña', NULL,
        'Perra negra, mestiza con labrador. El portal informa que desapareció el 11 de agosto de 2026 en Alquería La Fragua, Kennedy. Confirma la vigencia y consulta la foto en la ficha original.',
        'Bogotá D.C.', 'Bogotá D.C.', 'Alquería La Fragua, Kennedy',
        '2026-08-11T12:00:00-05:00', NULL, NULL,
        'IDPYBA — Animales perdidos', '3058948873', '[]'::jsonb, 'searching', NULL,
        false, '', 'Instituto Distrital de Protección y Bienestar Animal',
        'https://www.animalesbog.gov.co/wpyba/animalesperdidos/index.php/animales-perdidos/nina-6',
        '2026-08-15T11:20:00-05:00', NOW(), NOW()
      ),
      (
        'a1010000-0000-4000-8000-000000000003', 'animal', 'Zoe', NULL,
        'Gata blanca con rayas naranjas y café. El portal informa que desapareció después del temblor del 10 de agosto de 2026, en Portal de Suba. Confirma la vigencia y consulta la foto en la ficha original.',
        'Bogotá D.C.', 'Bogotá D.C.', 'Portal de Suba',
        '2026-08-10T12:00:00-05:00', NULL, NULL,
        'IDPYBA — Animales perdidos', '3058948873', '[]'::jsonb, 'searching', NULL,
        false, '', 'Instituto Distrital de Protección y Bienestar Animal',
        'https://www.animalesbog.gov.co/wpyba/animalesperdidos/index.php/animales-perdidos/zoe-3',
        '2026-08-15T11:20:00-05:00', NOW(), NOW()
      ),
      (
        'a1010000-0000-4000-8000-000000000004', 'animal', 'N.N. Hipotecho', NULL,
        'Perro café claro con una mancha blanca y collar azul, reportado como encontrado el 9 de agosto de 2026. Está bajo cuidado mientras se busca a su familia; consulta la foto en la ficha original.',
        'Bogotá D.C.', 'Bogotá D.C.', 'Hipotecho Occidental, Kennedy',
        '2026-08-09T12:00:00-05:00', NULL, NULL,
        'IDPYBA — Animales perdidos', '3058948873', '[]'::jsonb, 'sheltered', NULL,
        false, '', 'Instituto Distrital de Protección y Bienestar Animal',
        'https://www.animalesbog.gov.co/wpyba/animalesperdidos/index.php/animales-perdidos/n-n-341',
        '2026-08-15T11:20:00-05:00', NOW(), NOW()
      ),
      (
        'a1010000-0000-4000-8000-000000000005', 'animal', 'El Bordo', 18,
        'Equino macho, Mestizo Argentino, retirado del servicio por senilidad y publicado para adopción responsable en el catálogo institucional de la Policía Nacional.',
        'Cundinamarca', 'Tabio', 'Programa Acoge un Héroe de Cuatro Patas',
        '2026-08-15T12:00:00-05:00', NULL, NULL,
        'Policía Nacional — programa de adopción', '3213277595', '[]'::jsonb, 'sheltered', NULL,
        false, '', 'Policía Nacional de Colombia',
        'https://www.policia.gov.co/acoge-un-heroe',
        '2026-08-15T11:20:00-05:00', NOW(), NOW()
      ),
      (
        'a1010000-0000-4000-8000-000000000006', 'animal', 'Mallorca', 18,
        'Equina, Silla Argentino, retirada del servicio y publicada para adopción responsable en el catálogo institucional de la Policía Nacional. El catálogo indica adiestramiento como motivo.',
        'Meta', 'San Martín', 'Programa Acoge un Héroe de Cuatro Patas',
        '2026-08-15T12:00:00-05:00', NULL, NULL,
        'Policía Nacional — programa de adopción', '3148464313', '[]'::jsonb, 'sheltered', NULL,
        false, '', 'Policía Nacional de Colombia',
        'https://www.policia.gov.co/acoge-un-heroe',
        '2026-08-15T11:20:00-05:00', NOW(), NOW()
      ),
      (
        'a1010000-0000-4000-8000-000000000007', 'animal', 'Masaya', 20,
        'Equina, Mestizo Argentino, retirada del servicio por senilidad y publicada para adopción responsable en el catálogo institucional de la Policía Nacional.',
        'Meta', 'San Martín', 'Programa Acoge un Héroe de Cuatro Patas',
        '2026-08-15T12:00:00-05:00', NULL, NULL,
        'Policía Nacional — programa de adopción', '3148464313', '[]'::jsonb, 'sheltered', NULL,
        false, '', 'Policía Nacional de Colombia',
        'https://www.policia.gov.co/acoge-un-heroe',
        '2026-08-15T11:20:00-05:00', NOW(), NOW()
      )
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "missing_records" WHERE "id"::text LIKE 'a1010000-0000-4000-8000-00000000000%'`,
    );
    await queryRunner.query(
      `UPDATE "missing_records" SET "status" = 'closed' WHERE "status" = 'sheltered'`,
    );
    await queryRunner.query(
      `ALTER TABLE "missing_records" DROP COLUMN "sourceVerifiedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missing_records" DROP COLUMN "sourceUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missing_records" DROP COLUMN "sourceName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missing_records" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."missing_records_status_enum" RENAME TO "missing_records_status_enum_new"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."missing_records_status_enum" AS ENUM('searching', 'found', 'closed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "missing_records" ALTER COLUMN "status" TYPE "public"."missing_records_status_enum" USING "status"::text::"public"."missing_records_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missing_records" ALTER COLUMN "status" SET DEFAULT 'searching'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."missing_records_status_enum_new"`,
    );
  }
}
