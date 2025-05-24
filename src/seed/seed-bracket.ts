import { Game } from '@/games/entities/game.entity';
import { Tournament } from '@/tournaments/entities/tournament.entity';
import { BracketPosition, MatchStage } from '@common/enums/match-stage.enum';
import { EntityManager } from 'typeorm';
import { PhaseType } from '@common/enums/phase-type.enum';
import { join } from 'path';
import { readFileSync } from 'fs';
import { parse as parseCSV } from 'csv-parse/sync';
import { Team } from '@/teams/entities/team.entity';
import { AppDataSource } from 'data-source';
import { GameStatus } from '@/common/enums/game-status.enum';
import { User } from '@/users/entities/user.entity';
import { Umpire } from '@/umpires/entities/umpire.entity';
async function seedBracket(manager: EntityManager) {
  const tournament = await manager.findOne(Tournament, {
    where: { name: '총장배', year: 2025 },
  });

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  const quarterfinalistNames = [
    '몽키스패너즈',
    '체육교육과',
    '알파사회대',
    '정호아카데미',
    '관악사',
    '법대',
    '포톤스A',
    '사회대A',
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
  const userRepo = manager.getRepository(User);
  const umpireRepo = manager.getRepository(Umpire);

  // 8강 1경기
  const ump1 = await umpireRepo.findOne({
    where: { user: { name: '금경원' } },
  });
  const ump2 = await umpireRepo.findOne({
    where: { user: { name: '김성민' } },
  });
  const ump3 = await umpireRepo.findOne({
    where: { user: { name: '권재현' } },
  });
  const ump4 = await umpireRepo.findOne({
    where: { user: { name: '오주영' } },
  });
  const ump5 = await umpireRepo.findOne({
    where: { user: { name: '고영준' } },
  });
  const ump6 = await umpireRepo.findOne({
    where: { user: { name: '유호성' } },
  });

  const qfGames = [
    gameRepo.create({
      tournament,
      startTime: new Date('2025-05-25T19:00:00+09:00'),
      status: GameStatus.SCHEDULED,
      stage: MatchStage.QF,
      bracketPosition: BracketPosition.QF_1,
      homeTeam: quarterfinalists[0],
      awayTeam: quarterfinalists[1],
      recordUmpire: ump1,
    }),
    gameRepo.create({
      tournament,
      startTime: new Date('2025-05-27T20:30:00+09:00'),
      status: GameStatus.SCHEDULED,
      stage: MatchStage.QF,
      bracketPosition: BracketPosition.QF_2,
      homeTeam: quarterfinalists[2],
      awayTeam: quarterfinalists[3],
      recordUmpire: ump2,
    }),
    gameRepo.create({
      tournament,
      startTime: new Date('2025-05-28T20:30:00+09:00'),
      status: GameStatus.SCHEDULED,
      stage: MatchStage.QF,
      bracketPosition: BracketPosition.QF_3,
      homeTeam: quarterfinalists[4],
      awayTeam: quarterfinalists[5],
      recordUmpire: ump1,
    }),
    gameRepo.create({
      tournament,
      startTime: new Date('2025-05-29T20:30:00+09:00'),
      status: GameStatus.SCHEDULED,
      stage: MatchStage.QF,
      bracketPosition: BracketPosition.QF_4,
      homeTeam: quarterfinalists[6],
      awayTeam: quarterfinalists[7],
      recordUmpire: ump3,
    }),
  ];
  await gameRepo.save(qfGames);
  console.log('Quarterfinal games seeded');

  // 4강 게임 2개
  const sfGames = [
    gameRepo.create({
      tournament,
      startTime: new Date('2025-06-01T16:00:00+09:00'),
      status: GameStatus.SCHEDULED,
      stage: MatchStage.SF,
      bracketPosition: BracketPosition.SF_1,
      homeTeam: null,
      awayTeam: null,
      recordUmpire: ump4,
    }),
    gameRepo.create({
      tournament,
      startTime: new Date('2025-06-01T21:30:00+09:00'),
      status: GameStatus.SCHEDULED,
      stage: MatchStage.SF,
      bracketPosition: BracketPosition.SF_2,
      homeTeam: null,
      awayTeam: null,
      recordUmpire: ump5,
    }),
  ];
  await gameRepo.save(sfGames);
  console.log('Semifinal games seeded');

  // 3,4위 게임 1개
  const thirdPlaceGame = gameRepo.create({
    tournament,
    startTime: new Date('2025-06-04T19:30:00+09:00'),
    status: GameStatus.SCHEDULED,
    stage: MatchStage.THIRD_PLACE,
    bracketPosition: BracketPosition.THIRD_PLACE,
    homeTeam: null,
    awayTeam: null,
    recordUmpire: ump5,
  });
  await gameRepo.save(thirdPlaceGame);
  console.log('Third place game seeded');

  // 결승 게임 1개
  const finalGame = gameRepo.create({
    tournament,
    startTime: new Date('2025-06-05T19:30:00+09:00'),
    status: GameStatus.SCHEDULED,
    stage: MatchStage.FINAL,
    bracketPosition: BracketPosition.F,
    homeTeam: null,
    awayTeam: null,
    recordUmpire: ump6,
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
