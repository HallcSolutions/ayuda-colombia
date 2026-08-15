import { MigrationInterface, QueryRunner } from 'typeorm';

/** Enlaza las imágenes originales; no las descarga ni las guarda en RedAyuda. */
export class VerifiedMissingPhotos1787500000000 implements MigrationInterface {
  name = 'VerifiedMissingPhotos1787500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const photos: Array<[string, string]> = [
      [
        'a1010000-0000-4000-8000-000000000001',
        'https://www.animalesbog.gov.co/wpyba/animalesperdidos/images/animales/perros/20260813-IDPYBA-MARTINA.jpg',
      ],
      [
        'a1010000-0000-4000-8000-000000000002',
        'https://www.animalesbog.gov.co/wpyba/animalesperdidos/images/animales/perros/20260812-IDPYBA-NIA.jpg',
      ],
      [
        'a1010000-0000-4000-8000-000000000003',
        'https://www.animalesbog.gov.co/wpyba/animalesperdidos/images/animales/gatos/20260811-IDPYBA-ZOE.jpg',
      ],
      [
        'a1010000-0000-4000-8000-000000000004',
        'https://www.animalesbog.gov.co/wpyba/animalesperdidos/images/animales/perros/20260811-IDPYBA-NN3.jpg',
      ],
      [
        'a1010000-0000-4000-8000-000000000005',
        'https://www.policia.gov.co/sites/default/files/2025-08/El%20Bordo_Frontal.jpg',
      ],
      [
        'a1010000-0000-4000-8000-000000000006',
        'https://www.policia.gov.co/sites/default/files/2025-08/Mallorca_Frontal.jpg',
      ],
      [
        'a1010000-0000-4000-8000-000000000007',
        'https://www.policia.gov.co/sites/default/files/2025-08/Masaya_Frontal.jpg',
      ],
    ];

    for (const [id, photo] of photos) {
      await queryRunner.query(
        `UPDATE "missing_records" SET "photos" = jsonb_build_array($1::text), "updatedAt" = NOW() WHERE "id" = $2::uuid`,
        [photo, id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "missing_records" SET "photos" = '[]'::jsonb, "updatedAt" = NOW() WHERE "id"::text LIKE 'a1010000-0000-4000-8000-00000000000%'`,
    );
  }
}
