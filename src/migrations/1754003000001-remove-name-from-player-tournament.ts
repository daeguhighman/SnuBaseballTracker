import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveNameFromPlayerTournament1754003000001
  implements MigrationInterface
{
  name = 'RemoveNameFromPlayerTournament1754003000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`player_tournaments\` DROP COLUMN \`name\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`player_tournaments\` ADD \`name\` varchar(150) NOT NULL`,
    );
  }
}
