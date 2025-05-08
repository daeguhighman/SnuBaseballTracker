// test/utils/seedTestData.ts
import { AppDataSource } from '../../data-source';
import { Team } from '@teams/entities/team.entity';
import { Player } from '@players/entities/player.entity';
import { Department } from '../players/entities/department.entity';
import { Tournament } from '@tournaments/entities/tournament.entity';
import { TeamTournament } from '@teams/entities/team-tournament.entity';
import { PlayerTournament } from '@players/entities/player-tournament.entity';
import { BatterStat } from '@records/entities/batter-stat.entity';
import { PitcherStat } from '@records/entities/pitcher-stat.entity';
import { Game } from '@games/entities/game.entity';
import { INestApplication } from '@nestjs/common';
// import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { SubmitLineupRequestDto } from '@games/dtos/lineup.dto';
import { GameStat } from '@games/entities/game-stat.entity';
import { InningHalf } from '@common/enums/inning-half.enum';
import { GameInningStat } from '@games/entities/game-inning-stat.entity';
import { User } from '@users/entities/user.entity';
import { Umpire } from '@umpires/entities/umpire.entity';
import { GameStatus } from '@common/enums/game-status.enum';
import { TournamentSeason } from '@common/enums/tournament-season.enum';
import { JwtService } from '@nestjs/jwt';
import { response } from 'express';
import { EntityManager } from 'typeorm';
export async function seedUser(manager: EntityManager): Promise<User> {
  const userRepo = manager.getRepository(User);
  const user = userRepo.create({
    name: 'Test User',
    email: 'testuser@snu.ac.kr',
  });
  return await userRepo.save(user);
}
export async function seedUmpire(
  manager: EntityManager,
  user: User,
): Promise<Umpire> {
  const umpireRepo = manager.getRepository(Umpire);
  const umpire = umpireRepo.create({
    user,
  });
  return await umpireRepo.save(umpire);
}

export async function seedUmpireGame(
  manager: EntityManager,
  umpire: Umpire,
  game: Game,
) {
  const gameRepo = manager.getRepository(Game);
  return await gameRepo.save({
    ...game,
    recordUmpire: umpire,
  });
}
export async function seedUsers(): Promise<User[]> {
  const userRepo = AppDataSource.getRepository(User);
  const users = Array.from({ length: 10 }).map((_, i) =>
    userRepo.create({
      name: `Test User ${i + 1}`,
      email: `testuser${i + 1}@snu.ac.kr`,
    }),
  );
  return await userRepo.save(users);
}

export async function seedUmpires(users: User[]): Promise<Umpire[]> {
  const umpireRepo = AppDataSource.getRepository(Umpire);
  const umpires = users.map((user) =>
    umpireRepo.create({
      user,
    }),
  );
  return await umpireRepo.save(umpires);
}

export async function seedUmpiresGames(umpire: Umpire[], game: Game[]) {
  const gameRepo = AppDataSource.getRepository(Game);
  const updated = game.map((g, i) => ({
    ...g,
    recordUmpire: umpire[i],
  }));
  return await gameRepo.save(updated);
}

export async function seedDepartments(manager: EntityManager) {
  const departmentRepo = manager.getRepository(Department);
  return await departmentRepo.save([
    { name: 'department1' }, // 1
    { name: 'department2' }, // 2
    { name: 'department3' }, // 3
    { name: 'department4' }, // 4
    { name: 'department5' }, // 5
    { name: 'department6' }, // 6
    { name: 'department7' }, // 7
    { name: 'department8' }, // 8
    { name: 'department9' }, // 9
  ]);
}

export async function seedTeams(manager: EntityManager): Promise<Team[]> {
  const teamRepo = manager.getRepository(Team);
  const savedTeams = await teamRepo.save([
    { name: 'team1' },
    { name: 'team2' },
    { name: 'team3' },
    { name: 'team4' },
    { name: 'team5' },
    { name: 'team6' },
    { name: 'team7' },
    { name: 'team8' },
    { name: 'team9' },
    { name: 'team10' },
    { name: 'team11' },
    { name: 'team12' },
    { name: 'team13' },
    { name: 'team14' },
    { name: 'team15' },
    { name: 'team16' },
  ]);
  return savedTeams;
}

export async function seedTournament(manager: EntityManager) {
  const tournamentRepo = manager.getRepository(Tournament);
  const tournament = tournamentRepo.create({
    id: 1,
    name: 'tournament1',
    year: 2025,
    season: TournamentSeason.SPRING,
  });
  return await tournamentRepo.save(tournament);
}

export async function seedPlayers(
  teams: [Team, Team],
  departments: Department[],
  manager: EntityManager,
): Promise<{ team1Players: Player[]; team2Players: Player[] }> {
  const playerRepo = manager.getRepository(Player);

  const allPlayers: Player[] = [];

  for (let id = 1; id <= 30; id++) {
    const team = id <= 15 ? teams[0] : teams[1];
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const p = playerRepo.create({
      // id를 수동 할당하는 경우, Entity 옵션에서 generated: false 로 설정해야 합니다.
      // id,
      name: `Player ${id}`,
      team,
      department: dept,
      isWc: Math.random() < 0.7, // 랜덤 boolean
      isElite: Math.random() < 0.9, // 랜덤 boolean
    });
    allPlayers.push(p);
  }
  const savedPlayers = await playerRepo.save(allPlayers);
  return {
    team1Players: savedPlayers.filter((p) => p.team.id === teams[0].id),
    team2Players: savedPlayers.filter((p) => p.team.id === teams[1].id),
  };
}

export async function seedTeamTournaments(
  manager: EntityManager,
  teams: Team[],
  tournament: Tournament,
) {
  const teamTournamentRepo = manager.getRepository(TeamTournament);
  return await teamTournamentRepo.save([
    {
      team: teams[0], // 정호아카데미
      tournament,
      groupName: 'A',
      games: 4,
      wins: 4,
      draws: 0,
      losses: 0,
    },
    {
      team: teams[1], // 재료공
      tournament,
      groupName: 'A',
      games: 3,
      wins: 2,
      draws: 0,
      losses: 1,
    },
    {
      team: teams[2], // 몽키스패너스
      tournament,
      groupName: 'A',
      games: 3,
      wins: 1,
      draws: 0,
      losses: 2,
    },
    {
      team: teams[3], // 포톤스
      tournament,
      groupName: 'A',
      games: 4,
      wins: 0,
      draws: 0,
      losses: 4,
    },
    {
      team: teams[4], // 삼성
      tournament,
      groupName: 'B',
      games: 4,
      wins: 2,
      draws: 0,
      losses: 2,
    },
    {
      team: teams[5], // 두산
      tournament,
      groupName: 'B',
      games: 4,
      wins: 2,
      draws: 0,
      losses: 2,
    },
    {
      team: teams[6], // 두산
      tournament,
      groupName: 'B',
      games: 3,
      wins: 1,
      draws: 0,
      losses: 2,
    },
    {
      team: teams[7], // 두산
      tournament,
      groupName: 'B',
      games: 3,
      wins: 2,
      draws: 0,
      losses: 1,
    },
    {
      team: teams[8], // 두산
      tournament,
      groupName: 'C',
      games: 3,
      wins: 0,
      draws: 0,
      losses: 3,
    },
    {
      team: teams[9], // 두산
      tournament,
      groupName: 'C',
      games: 3,
      wins: 1,
      draws: 1,
      losses: 1,
    },
    {
      team: teams[10], // 두산
      tournament,
      groupName: 'C',
      games: 3,
      wins: 2,
      draws: 1,
      losses: 0,
    },
    {
      team: teams[11], // 두산
      tournament,
      groupName: 'C',
      games: 3,
      wins: 2,
      draws: 0,
      losses: 1,
    },
  ]);
}

export async function seedPlayerTournaments(
  players: Player[],
  tournament: Tournament,
  manager: EntityManager,
) {
  const playerTournamentRepo = manager.getRepository(PlayerTournament);
  return await playerTournamentRepo.save(
    players.map((player) => ({
      player,
      tournament,
    })),
  );
}

export async function seedBatterStats(
  manager: EntityManager,
  playerTournaments: PlayerTournament[],
) {
  const repo = manager.getRepository(BatterStat);
  // 배포할 plateAppearance 분포 생성
  const paCounts = [
    ...Array(15).fill(10),
    ...Array(5).fill(7),
    ...Array(5).fill(5),
  ];
  // 랜덤 섞기
  const shuffledPa = paCounts.sort(() => Math.random() - 0.5);

  const stats = playerTournaments.slice(0, shuffledPa.length).map((pt, idx) => {
    const plateAppearances = shuffledPa[idx];
    // atBats: plateAppearances 중 60~90% 랜덤
    const atBats = Math.floor(plateAppearances * (0.6 + Math.random() * 0.3));
    // hits: atBats 중 30~70% 랜덤
    const hits = Math.floor(atBats * (0.3 + Math.random() * 0.4));
    // walks: 남은 PA 중 0~50% 랜덤
    const walks = Math.floor((plateAppearances - atBats) * Math.random() * 0.5);
    // doubles, triples, homeRuns 분배
    let remHits = hits;
    const doubles = Math.floor(remHits * Math.random() * 0.5);
    remHits -= doubles;
    const triples = Math.floor(remHits * Math.random() * 0.2);
    remHits -= triples;
    const homeRuns = Math.floor(remHits * Math.random() * 0.3);
    remHits -= homeRuns;

    // 계산
    const battingAverage = atBats > 0 ? hits / atBats : 0;
    const onBasePercentage =
      plateAppearances > 0 ? (hits + walks) / plateAppearances : 0;
    const totalBases = hits + doubles + triples * 2 + homeRuns * 3;
    const sluggingPercentage = atBats > 0 ? totalBases / atBats : 0;
    const ops = onBasePercentage + sluggingPercentage;

    return repo.create({
      playerTournament: pt,
      plateAppearances,
      atBats,
      hits,
      doubles,
      triples,
      homeRuns,
      walks,
      battingAverage: parseFloat(battingAverage.toFixed(3)),
      onBasePercentage: parseFloat(onBasePercentage.toFixed(3)),
      sluggingPercentage: parseFloat(sluggingPercentage.toFixed(3)),
      ops: parseFloat(ops.toFixed(3)),
    });
  });

  return repo.save(stats);
}
export async function seedPitcherStats(
  manager: EntityManager,
  playerTournaments: PlayerTournament[],
) {
  const pitcherStatRepo = manager.getRepository(PitcherStat);
  return await pitcherStatRepo.save([
    {
      playerTournament: playerTournaments[0],
      strikeouts: 5,
    },
    {
      playerTournament: playerTournaments[11],
      strikeouts: 4,
    },
  ]);
}

export async function seedGame(
  tournament: Tournament,
  homeTeam: Team,
  awayTeam: Team,
): Promise<Game> {
  const gameRepo = AppDataSource.getRepository(Game);
  return await gameRepo.save({
    homeTeam,
    awayTeam,
    tournament,
    status: GameStatus.SCHEDULED,
    startTime: new Date('2025-04-23T10:00:00'),
  });
}

// export async function seedGameWithLineupsAndStart(app: INestApplication) {
//   const departments = await seedDepartments();
//   const teams = await seedTeams();
//   const tournament = await seedTournament();
//   const teamTournaments = await seedTeamTournaments(teams, tournament);
//   const { team1Players, team2Players } = await seedPlayers(teams, departments);
//   const user = await seedUser();
//   const umpire = await seedUmpire(user);
//   const game = await seedGame(tournament, teams[0], teams[1]);
//   await seedUmpireGame(umpire, game);
//   const jwt = app.get(JwtService);
//   const accessToken = jwt.sign(
//     {
//       sub: umpire.userId,
//       umpireId: umpire.id,
//       role: 'UMPIRE',
//     },
//     { expiresIn: '1h', secret: process.env.JWT_SECRET || 'secret' },
//   );
//   const homeLineupData: SubmitLineupRequestDto = {
//     batters: team1Players.slice(0, 9).map((player, i) => ({
//       playerId: player.id,
//       battingOrder: i + 1,
//       position: ['CF', 'SS', 'C', '1B', '2B', '3B', 'LF', 'RF', 'DH'][i],
//     })),
//     pitcher: {
//       playerId: team1Players[9].id,
//     },
//   };

//   const awayLineupData: SubmitLineupRequestDto = {
//     batters: team2Players.slice(0, 9).map((player, i) => ({
//       playerId: player.id,
//       battingOrder: i + 1,
//       position: ['1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'C', 'DH'][i],
//     })),
//     pitcher: { playerId: team2Players[9].id },
//   };

//   const lineupResponse = await request(app.getHttpServer())
//     .post(`/games/${game.id}/lineup`)
//     .query({ teamType: 'home' })
//     .set('Cookie', `accessToken=${accessToken}`)
//     .send(homeLineupData)
//     .expect(HttpStatus.CREATED);
//   console.log('응답: ', lineupResponse.body);

//   await request(app.getHttpServer())
//     .post(`/games/${game.id}/lineup`)
//     .query({ teamType: 'away' })
//     .set('Cookie', `accessToken=${accessToken}`)
//     .send(awayLineupData)
//     .expect(HttpStatus.CREATED);

//   const startResponse = await request(app.getHttpServer())
//     .post(`/games/${game.id}/start`)
//     .set('Cookie', `accessToken=${accessToken}`)
//     .expect(HttpStatus.CREATED);
//   console.log('응답: ', startResponse.body);
//   return {
//     game,
//     homeTeam: teams[0],
//     awayTeam: teams[1],
//     homeLineupData,
//     awayLineupData,
//     accessToken,
//   };
// }

export async function seedScoreBoard(game: Game) {
  const gameInningStatRepo = AppDataSource.getRepository(GameInningStat);

  // 각 이닝별 점수 설정
  const inningScores = [
    { inning: 1, top: 2, bottom: 0 }, // 1회: 원정팀 2점
    { inning: 2, top: 0, bottom: 3 }, // 2회: 홈팀 3점
    { inning: 3, top: 1, bottom: 2 }, // 3회: 원정 1점, 홈 2점
  ];

  const inningStats = inningScores.flatMap(({ inning, top, bottom }) => [
    // 초기
    gameInningStatRepo.create({
      game,
      inning,
      inningHalf: InningHalf.TOP,
      runs: top,
    }),
    // 말기
    gameInningStatRepo.create({
      game,
      inning,
      inningHalf: InningHalf.BOT,
      runs: bottom,
    }),
  ]);

  await gameInningStatRepo.save(inningStats);
  const gameStatRepo = AppDataSource.getRepository(GameStat);
  const newStat = gameStatRepo.create({
    gameId: game.id,
    homeScore: 5,
    awayScore: 3,
    inning: 4,
    inningHalf: InningHalf.TOP,
    homeHits: 1,
    awayHits: 2,
    // homeBatterParticipationId: 1,
    // awayBatterParticipationId: 1,
    // homePitcherParticipationId: 1,
    // awayPitcherParticipationId: 1,
  });
  return await gameStatRepo.save(newStat);
}

export async function seedGameSchedule(
  manager: EntityManager,
  teams: Team[],
  tournament: Tournament,
) {
  const gameRepo = manager.getRepository(Game);
  const totalGames = 20;
  const startDate = new Date('2025-05-01T00:00:00');
  const endDate = new Date('2025-05-30T00:00:00');
  const today = new Date('2025-05-15T00:00:00');
  let finalizedToggle = false;
  let inProgressAssigned = false;

  // 가능한 모든 시청각 슬롯 생성 (5월 1일~30일, 10:00/12:00/14:00/16:00)
  const slots: Date[] = [];
  const msPerDay = 24 * 60 * 60 * 1000;
  const days =
    Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * msPerDay);
    [10, 12, 14, 16].forEach((hour) => {
      slots.push(
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour),
      );
    });
  }

  // 슬롯 섞기
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  // 랜덤으로 20개 슬롯 선택
  const selectedSlots = slots.slice(0, totalGames);

  // 게임 엔티티 생성
  const games = selectedSlots.map((slot, idx) => {
    const homeTeam = teams[idx % teams.length];
    const awayTeam = teams[(idx + 1) % teams.length];
    let status: GameStatus;

    if (slot < today) {
      status = finalizedToggle ? GameStatus.FINALIZED : GameStatus.EDITING;
      finalizedToggle = !finalizedToggle;
    } else if (
      slot.toDateString() === today.toDateString() &&
      !inProgressAssigned
    ) {
      status = GameStatus.IN_PROGRESS;
      inProgressAssigned = true;
    } else {
      status = GameStatus.SCHEDULED;
    }

    return gameRepo.create({
      homeTeam,
      awayTeam,
      tournament,
      status: GameStatus.SCHEDULED,
      startTime: slot,
    });
  });

  return await gameRepo.save(games);
}
