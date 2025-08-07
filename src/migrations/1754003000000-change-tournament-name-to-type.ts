import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTournamentNameToType1754003000000
  implements MigrationInterface
{
  name = 'ChangeTournamentNameToType1754003000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 새로운 name 컬럼 추가 (enum 타입)
    await queryRunner.query(`
      ALTER TABLE "tournaments" 
      ADD COLUMN "name_new" character varying(20) NOT NULL DEFAULT '총장배'
    `);

    // 2. 기존 name 컬럼의 데이터를 새로운 name으로 변환
    await queryRunner.query(`
      UPDATE "tournaments" 
      SET "name_new" = CASE 
        WHEN "name" LIKE '%총장배%' THEN '총장배'
        WHEN "name" LIKE '%종합체육대회%' THEN '종합체육대회'
        WHEN "name" LIKE '%스누리그%' THEN '스누리그'
        WHEN "name" LIKE '%스누나래%' THEN '스누나래'
        ELSE '총장배'
      END
    `);

    // 3. 기존 name 컬럼 삭제
    await queryRunner.query(`
      ALTER TABLE "tournaments" DROP COLUMN "name"
    `);

    // 4. 새로운 name 컬럼을 name으로 이름 변경
    await queryRunner.query(`
      ALTER TABLE "tournaments" RENAME COLUMN "name_new" TO "name"
    `);

    // 5. 기존 unique 제약 조건 삭제 후 새로운 제약 조건 추가
    await queryRunner.query(`
      ALTER TABLE "tournaments" DROP CONSTRAINT IF EXISTS "UQ_tournaments_year_name"
    `);

    await queryRunner.query(`
      ALTER TABLE "tournaments" 
      ADD CONSTRAINT "UQ_tournaments_year_name" UNIQUE ("year", "name")
    `);

    // 6. 인덱스 추가
    await queryRunner.query(`
      CREATE INDEX "IDX_tournaments_name" ON "tournaments" ("name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. name 컬럼을 기존 형식으로 변경
    await queryRunner.query(`
      ALTER TABLE "tournaments" 
      ALTER COLUMN "name" TYPE character varying(100)
    `);

    // 2. 제약 조건 및 인덱스 복원
    await queryRunner.query(`
      ALTER TABLE "tournaments" DROP CONSTRAINT IF EXISTS "UQ_tournaments_year_name"
    `);

    await queryRunner.query(`
      ALTER TABLE "tournaments" 
      ADD CONSTRAINT "UQ_tournaments_year_name" UNIQUE ("year", "name")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tournaments_name" ON "tournaments" ("name")
    `);
  }
}
