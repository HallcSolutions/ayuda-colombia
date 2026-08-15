import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecoveryNetwork1787000000000 implements MigrationInterface {
  name = 'RecoveryNetwork1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."recovery_projects_kind_enum" AS ENUM('home', 'business', 'restaurant', 'artisan', 'community')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recovery_projects_status_enum" AS ENUM('pending_review', 'open', 'in_progress', 'paused', 'completed', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recovery_tasks_category_enum" AS ENUM('general', 'cleaning', 'construction', 'structural', 'electrical', 'gas', 'plumbing', 'carpentry', 'welding', 'equipment_repair', 'transport', 'food', 'materials', 'business_support', 'digital', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recovery_tasks_riskLevel_enum" AS ENUM('green', 'amber', 'red')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recovery_tasks_status_enum" AS ENUM('pending_review', 'open', 'blocked', 'in_progress', 'completed', 'cancelled')`,
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
      `CREATE TYPE "public"."recovery_applications_status_enum" AS ENUM('pending', 'accepted', 'declined', 'withdrawn', 'completed')`,
    );

    await queryRunner.query(
      `CREATE TABLE "recovery_projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "kind" "public"."recovery_projects_kind_enum" NOT NULL, "name" character varying(140) NOT NULL, "story" character varying(1200) NOT NULL, "organizerName" character varying(100) NOT NULL, "contactPhone" character varying(30) NOT NULL, "department" character varying(80) NOT NULL, "municipality" character varying(80) NOT NULL, "areaReference" character varying(180) NOT NULL, "productsOrServices" character varying(700) NOT NULL DEFAULT '', "priceReference" character varying(180) NOT NULL DEFAULT '', "salesModes" jsonb NOT NULL DEFAULT '[]'::jsonb, "schedule" character varying(180) NOT NULL DEFAULT '', "shareContactPublicly" boolean NOT NULL DEFAULT false, "status" "public"."recovery_projects_status_enum" NOT NULL DEFAULT 'pending_review', "verifiedBy" character varying(120) NOT NULL DEFAULT '', "verifiedAt" TIMESTAMP WITH TIME ZONE, "editPinHash" character varying(160) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_recovery_projects_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "recovery_tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "title" character varying(160) NOT NULL, "description" character varying(900) NOT NULL, "category" "public"."recovery_tasks_category_enum" NOT NULL, "riskLevel" "public"."recovery_tasks_riskLevel_enum" NOT NULL, "status" "public"."recovery_tasks_status_enum" NOT NULL DEFAULT 'pending_review', "peopleNeeded" smallint NOT NULL DEFAULT 1, "scheduledFor" TIMESTAMP WITH TIME ZONE, "durationHours" smallint, "skillsRequired" character varying(400) NOT NULL DEFAULT '', "materialsNeeded" character varying(500) NOT NULL DEFAULT '', "professionalRequired" boolean NOT NULL DEFAULT false, "reviewedBy" character varying(120) NOT NULL DEFAULT '', "reviewedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_recovery_tasks_id" PRIMARY KEY ("id"), CONSTRAINT "FK_recovery_tasks_project" FOREIGN KEY ("projectId") REFERENCES "recovery_projects"("id") ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `CREATE TABLE "recovery_helpers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" character varying(100) NOT NULL, "displayName" character varying(80) NOT NULL, "documentType" character varying(20) NOT NULL, "documentNumber" character varying(40) NOT NULL, "contactPhone" character varying(30) NOT NULL, "department" character varying(80) NOT NULL, "municipality" character varying(80) NOT NULL, "skills" jsonb NOT NULL, "verifiedSkills" jsonb NOT NULL DEFAULT '[]'::jsonb, "bio" character varying(600) NOT NULL DEFAULT '', "yearsExperience" smallint NOT NULL DEFAULT 0, "credentialType" "public"."recovery_helpers_credentialType_enum" NOT NULL, "credentialNumber" character varying(80) NOT NULL DEFAULT '', "credentialIssuer" character varying(160) NOT NULL DEFAULT '', "referenceName" character varying(100) NOT NULL DEFAULT '', "referencePhone" character varying(30) NOT NULL DEFAULT '', "verificationLevel" "public"."recovery_helpers_verificationLevel_enum" NOT NULL DEFAULT 'pending', "verificationMethod" "public"."recovery_helpers_verificationMethod_enum", "verifiedBy" character varying(120) NOT NULL DEFAULT '', "verifiedAt" TIMESTAMP WITH TIME ZONE, "verificationNotes" character varying(600) NOT NULL DEFAULT '', "verificationSourceName" character varying(160) NOT NULL DEFAULT '', "verificationSourceUrl" character varying(500) NOT NULL DEFAULT '', "editPinHash" character varying(160) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_recovery_helpers_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "recovery_applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "taskId" uuid NOT NULL, "helperId" uuid NOT NULL, "message" character varying(500) NOT NULL DEFAULT '', "availability" character varying(180) NOT NULL DEFAULT '', "status" "public"."recovery_applications_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_recovery_application_task_helper" UNIQUE ("taskId", "helperId"), CONSTRAINT "PK_recovery_applications_id" PRIMARY KEY ("id"), CONSTRAINT "FK_recovery_applications_task" FOREIGN KEY ("taskId") REFERENCES "recovery_tasks"("id") ON DELETE CASCADE, CONSTRAINT "FK_recovery_applications_helper" FOREIGN KEY ("helperId") REFERENCES "recovery_helpers"("id") ON DELETE CASCADE)`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_recovery_projects_region" ON "recovery_projects" ("department", "municipality")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_recovery_projects_status_kind" ON "recovery_projects" ("status", "kind")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_recovery_tasks_project_status" ON "recovery_tasks" ("projectId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_recovery_tasks_category_status" ON "recovery_tasks" ("category", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_recovery_helpers_verification_region" ON "recovery_helpers" ("verificationLevel", "department", "municipality")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_recovery_applications_task_status" ON "recovery_applications" ("taskId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_recovery_applications_helper_status" ON "recovery_applications" ("helperId", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "recovery_applications"`);
    await queryRunner.query(`DROP TABLE "recovery_helpers"`);
    await queryRunner.query(`DROP TABLE "recovery_tasks"`);
    await queryRunner.query(`DROP TABLE "recovery_projects"`);
    await queryRunner.query(
      `DROP TYPE "public"."recovery_applications_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."recovery_helpers_verificationMethod_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."recovery_helpers_verificationLevel_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."recovery_helpers_credentialType_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."recovery_tasks_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."recovery_tasks_riskLevel_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."recovery_tasks_category_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."recovery_projects_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."recovery_projects_kind_enum"`);
  }
}
