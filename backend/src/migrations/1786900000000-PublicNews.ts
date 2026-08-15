import { MigrationInterface, QueryRunner } from 'typeorm';

export class PublicNews1786900000000 implements MigrationInterface {
  name = 'PublicNews1786900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public_news_category_enum" AS ENUM('earthquake', 'flood', 'landslide', 'wildfire', 'storm', 'drought', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public_news_status_enum" AS ENUM('published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "public_news" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(180) NOT NULL, "summary" character varying(700) NOT NULL, "steps" jsonb NOT NULL DEFAULT '[]', "requirements" jsonb NOT NULL DEFAULT '[]', "category" "public"."public_news_category_enum" NOT NULL, "department" character varying(80) NOT NULL DEFAULT '', "municipality" character varying(80) NOT NULL DEFAULT '', "sourceName" character varying(160) NOT NULL, "sourceUrl" character varying(500) NOT NULL, "contactInfo" character varying(300) NOT NULL DEFAULT '', "publishedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "validUntil" TIMESTAMP WITH TIME ZONE, "verifiedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "featured" boolean NOT NULL DEFAULT false, "status" "public"."public_news_status_enum" NOT NULL DEFAULT 'published', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_public_news" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_public_news_region" ON "public_news" ("department", "municipality")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_public_news_status_date" ON "public_news" ("status", "publishedAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_public_news_status_date"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_public_news_region"`);
    await queryRunner.query(`DROP TABLE "public_news"`);
    await queryRunner.query(`DROP TYPE "public"."public_news_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."public_news_category_enum"`);
  }
}
