import { EntityManager } from 'typeorm';

/**
 * 경기 중 기록 상태를 담는 테이블과, 해당 경기 행을 고르는 조건.
 * 삭제는 이 순서대로 한다 (자식 테이블의 조건이 부모 테이블을 참조하므로).
 */
export const GAME_RECORD_TABLES: { name: string; where: string }[] = [
  {
    name: 'runner',
    where:
      'game_inning_stat_id IN (SELECT id FROM game_inning_stats WHERE game_id = ?)',
  },
  { name: 'runner_events', where: 'game_id = ?' },
  { name: 'plays', where: 'game_id = ?' },
  {
    name: 'batter_game_stats',
    where:
      'batter_game_participation_id IN (SELECT id FROM batter_game_participations WHERE game_id = ?)',
  },
  {
    name: 'pitcher_game_stats',
    where:
      'pitcher_game_participation_id IN (SELECT id FROM pitcher_game_participations WHERE game_id = ?)',
  },
  { name: 'game_inning_stats', where: 'game_id = ?' },
  { name: 'batter_game_participations', where: 'game_id = ?' },
  { name: 'pitcher_game_participations', where: 'game_id = ?' },
  { name: 'game_roasters', where: 'game_id = ?' },
  { name: 'game_stats', where: 'game_id = ?' },
];

/** 테이블끼리 서로 참조하므로 지우고 다시 넣는 동안만 FK 검사를 끈다 */
export async function withoutForeignKeyChecks<T>(
  manager: EntityManager,
  work: () => Promise<T>,
): Promise<T> {
  await manager.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    return await work();
  } finally {
    await manager.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}

/** 경기의 기록(라인업·플레이·스탯 등)을 모두 지운다. withoutForeignKeyChecks 안에서 부른다. */
export async function deleteGameRecords(
  manager: EntityManager,
  gameId: number,
) {
  for (const table of GAME_RECORD_TABLES) {
    await manager.query(`DELETE FROM \`${table.name}\` WHERE ${table.where}`, [
      gameId,
    ]);
  }
}
