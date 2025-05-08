// test/utils/dbUtils.ts
import { AppDataSource } from '../../data-source';

export async function truncateAllTables() {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    // 외래키 제약 조건 비활성화 (MySQL 기준)
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

    const tables = [
      'players',
      'player_tournaments',
      'teams',
      'departments',
      'tournaments',
      'team_tournaments',
      'umpire_tournaments',
      'umpire_email_codes',
      'users',
      'umpires',
      'games',
      'game_inning_stats',
      'game_roasters',
      'batter_game_participations',
      'pitcher_game_participations',
      'batter_stats',
      'pitcher_stats',
      'game_stats',
      'batter_game_stats',
      'pitcher_game_stats',
    ];

    for (const table of tables) {
      await queryRunner.query(`TRUNCATE TABLE \`${table}\``);
    }

    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}
