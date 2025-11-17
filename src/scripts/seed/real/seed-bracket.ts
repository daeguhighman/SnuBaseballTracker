import { Game } from '@/games/entities/game.entity';
import { Tournament } from '@/tournaments/entities/tournament.entity';
import { BracketPosition, MatchStage } from '@common/enums/match-stage.enum';
import { EntityManager } from 'typeorm';
import { Team } from '@/teams/entities/team.entity';
import { AppDataSource } from 'data-source';
import { GameStatus } from '@/common/enums/game-status.enum';
import { TournamentType } from '@/common/enums/tournament-type.enum';
async function seedBracket(manager: EntityManager) {
  const tournament = await manager.findOne(Tournament, {
    where: { name: TournamentType.JONGHAP, year: 2025 },
  });

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  const quarterfinalistNames = [
    '포톤스A',
    '워리어즈',
    '재료공',
    '소이쏘스',
    '체육교육과',
    '법대',
    '사회대A',
    '몽키스패너즈',
  ];

  // 팀 이름으로 실제 팀 엔티티 조회
  const quarterfinalists = await Promise.all(
    quarterfinalistNames.map((name) =>
      manager.findOne(Team, { where: { name } }),
    ),
  );

  // 팀을 찾지 못한 경우 에러 처리
  if (quarterfinalists.some((team) => !team)) {
    throw new Error('Some teams not found');
  }

  const gameRepo = manager.getRepository(Game);

  const qfGames = [
    gameRepo.create({
      tournament,
      startTime: new Date('2025-08-18T19:30:00+09:00'),
      status: GameStatus.SCHEDULED,
      stage: MatchStage.QF,
      bracketPosition: BracketPosition.QF_1,
      homeTeam: quarterfinalists[0],
      awayTeam: quarterfinalists[1],
    }),
    gameRepo.create({
      tournament,
      startTime: new Date('2025-08-19T18:30:00+09:00'),
      status: GameStatus.SCHEDULED,
      stage: MatchStage.QF,
      bracketPosition: BracketPosition.QF_2,
      homeTeam: quarterfinalists[2],
      awayTeam: quarterfinalists[3],
    }),
    gameRepo.create({
      tournament,
      startTime: new Date('2025-08-20T19:30:00+09:00'),
      status: GameStatus.SCHEDULED,
      stage: MatchStage.QF,
      bracketPosition: BracketPosition.QF_3,
      homeTeam: quarterfinalists[4],
      awayTeam: quarterfinalists[5],
    }),
    gameRepo.create({
      tournament,
      startTime: new Date('2025-08-21T18:30:00+09:00'),
      status: GameStatus.SCHEDULED,
      stage: MatchStage.QF,
      bracketPosition: BracketPosition.QF_4,
      homeTeam: quarterfinalists[6],
      awayTeam: quarterfinalists[7],
    }),
  ];
  await gameRepo.save(qfGames);
  console.log('Quarterfinal games seeded');

  // 4강 게임 2개
  const sfGames = [
    gameRepo.create({
      tournament,
      startTime: new Date('2025-08-25T19:30:00+09:00'),
      status: GameStatus.SCHEDULED,
      stage: MatchStage.SF,
      bracketPosition: BracketPosition.SF_1,
      homeTeam: null,
      awayTeam: null,
    }),
    gameRepo.create({
      tournament,
      startTime: new Date('2025-08-26T18:30:00+09:00'),
      status: GameStatus.SCHEDULED,
      stage: MatchStage.SF,
      bracketPosition: BracketPosition.SF_2,
      homeTeam: null,
      awayTeam: null,
    }),
  ];
  await gameRepo.save(sfGames);
  console.log('Semifinal games seeded');

  // 3,4위 게임 1개
  const thirdPlaceGame = gameRepo.create({
    tournament,
    startTime: new Date('2025-08-28T19:30:00+09:00'),
    status: GameStatus.SCHEDULED,
    stage: MatchStage.THIRD_PLACE,
    bracketPosition: BracketPosition.THIRD_PLACE,
    homeTeam: null,
    awayTeam: null,
  });
  await gameRepo.save(thirdPlaceGame);
  console.log('Third place game seeded');

  // 결승 게임 1개
  const finalGame = gameRepo.create({
    tournament,
    startTime: new Date('2025-08-29T19:30:00+09:00'),
    status: GameStatus.SCHEDULED,
    stage: MatchStage.FINAL,
    bracketPosition: BracketPosition.F,
    homeTeam: null,
    awayTeam: null,
  });
  await gameRepo.save(finalGame);
  console.log('Final game seeded');
}

async function main() {
  await AppDataSource.initialize();
  await AppDataSource.transaction(async (manager) => {
    await seedBracket(manager);
  });
  await AppDataSource.destroy();
}

main();
