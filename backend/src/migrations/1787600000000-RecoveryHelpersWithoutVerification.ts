import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Nadie comprueba a quien ofrece su oficio: solo deja su contacto para que
 * quien pide ayuda pueda escribirle. Se retiran el documento, la credencial y
 * todo el rastro de verificación, que era información privada que ya no
 * cumple ninguna función.
 */
export class RecoveryHelpersWithoutVerification1787600000000
  implements MigrationInterface
{
  name = 'RecoveryHelpersWithoutVerification1787600000000';

  private readonly droppedColumns = [
    'fullName',
    'documentType',
    'documentNumber',
    'verifiedSkills',
    'bio',
    'yearsExperience',
    'credentialType',
    'credentialNumber',
    'credentialIssuer',
    'referenceName',
    'referencePhone',
    'verificationLevel',
    'verificationMethod',
    'verifiedBy',
    'verifiedAt',
    'verificationNotes',
    'verificationSourceName',
    'verificationSourceUrl',
  ];

  private readonly droppedTypes = [
    'recovery_helpers_credentialType_enum',
    'recovery_helpers_verificationLevel_enum',
    'recovery_helpers_verificationMethod_enum',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_recovery_helpers_verification_region"`,
    );
    for (const column of this.droppedColumns) {
      await queryRunner.query(
        `ALTER TABLE "recovery_helpers" DROP COLUMN IF EXISTS "${column}"`,
      );
    }
    for (const type of this.droppedTypes) {
      await queryRunner.query(`DROP TYPE IF EXISTS "public"."${type}"`);
    }
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_recovery_helpers_region" ON "recovery_helpers" ("department", "municipality")`,
    );
  }

  // La vuelta atrás restituye la forma de la tabla, no los datos borrados:
  // el documento y la credencial de quien se registró no se pueden recuperar.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_recovery_helpers_region"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recovery_helpers_credentialType_enum" AS ENUM('none', 'professional_license', 'trade_certificate', 'employer_reference', 'community_reference')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recovery_helpers_verificationLevel_enum" AS ENUM('pending', 'identity', 'trade', 'professional', 'rejected', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recovery_helpers_verificationMethod_enum" AS ENUM('identity_and_phone', 'official_registry', 'training_certificate', 'employer_reference', 'community_reference', 'practical_assessment')`,
    );
    await queryRunner.query(
      `ALTER TABLE "recovery_helpers"
        ADD COLUMN "fullName" character varying(100) NOT NULL DEFAULT '',
        ADD COLUMN "documentType" character varying(20) NOT NULL DEFAULT '',
        ADD COLUMN "documentNumber" character varying(40) NOT NULL DEFAULT '',
        ADD COLUMN "verifiedSkills" jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN "bio" character varying(600) NOT NULL DEFAULT '',
        ADD COLUMN "yearsExperience" smallint NOT NULL DEFAULT 0,
        ADD COLUMN "credentialType" "public"."recovery_helpers_credentialType_enum" NOT NULL DEFAULT 'none',
        ADD COLUMN "credentialNumber" character varying(80) NOT NULL DEFAULT '',
        ADD COLUMN "credentialIssuer" character varying(160) NOT NULL DEFAULT '',
        ADD COLUMN "referenceName" character varying(100) NOT NULL DEFAULT '',
        ADD COLUMN "referencePhone" character varying(30) NOT NULL DEFAULT '',
        ADD COLUMN "verificationLevel" "public"."recovery_helpers_verificationLevel_enum" NOT NULL DEFAULT 'pending',
        ADD COLUMN "verificationMethod" "public"."recovery_helpers_verificationMethod_enum",
        ADD COLUMN "verifiedBy" character varying(120) NOT NULL DEFAULT '',
        ADD COLUMN "verifiedAt" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN "verificationNotes" character varying(600) NOT NULL DEFAULT '',
        ADD COLUMN "verificationSourceName" character varying(160) NOT NULL DEFAULT '',
        ADD COLUMN "verificationSourceUrl" character varying(500) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_recovery_helpers_verification_region" ON "recovery_helpers" ("verificationLevel", "department", "municipality")`,
    );
  }
}
