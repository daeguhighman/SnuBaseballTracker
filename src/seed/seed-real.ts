import { Tournament } from '../tournaments/entities/tournament.entity';
import { AppDataSource } from 'data-source';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse as parseCSV } from 'csv-parse/sync';
import { TournamentSeason } from '../common/enums/tournament-season.enum';
import { Team } from '../teams/entities/team.entity';
import { User } from '../users/entities/user.entity';
import { Umpire } from '../umpires/entities/umpire.entity';
import { TeamTournament } from '@/teams/entities/team-tournament.entity';
import { EntityManager } from 'typeorm';
import { Game } from '@/games/entities/game.entity';
import { Player } from '@/players/entities/player.entity';
import { Department } from '@/players/entities/department.entity';
import { PlayerTournament } from '@/players/entities/player-tournament.entity';
async function seedRealUsers(transactionalEntityManager: EntityManager) {
  const userRepo = transactionalEntityManager.getRepository(User);
  const umpireRepo = transactionalEntityManager.getRepository(Umpire);
  const csvPath = join(__dirname, 'csv', 'users.csv');

  const records = parseCSV(readFileSync(csvPath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<{ name: string; email: string }>;

  for (const { name, email } of records) {
    // 중복 확인
    const exists = await userRepo.exists({ where: { name } });
    if (exists) continue;

    const user = await userRepo.save(userRepo.create({ name, email }));
    await umpireRepo.save(umpireRepo.create({ user }));
    console.log(`✅ Seeded user: ${name} (${email})`);
  }
}
async function seedRealTournaments(transactionalEntityManager: EntityManager) {
  const repo = transactionalEntityManager.getRepository(Tournament);
  const csvPath = join(__dirname, 'csv', 'tournaments.csv');

  // CSV 파일을 동기적으로 읽고 파싱 (열 이름 기준으로 객체 배열 생성)
  const records = parseCSV(readFileSync(csvPath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<{ name: string; year: string; season: string }>;

  for (const record of records) {
    const { name, year, season } = record;
    const yearNum = parseInt(year, 10);

    // 이미 존재하는 토너먼트는 건너뛴다
    const isDuplicate = await repo.exists({
      where: { name, year: yearNum, season: season as TournamentSeason },
    });
    if (isDuplicate) continue;

    // 신규 토너먼트 저장
    await repo.save(
      repo.create({ name, year: yearNum, season: season as TournamentSeason }),
    );
    console.log(`✅ Seeded tournament: ${name} (${year} - ${season})`);
  }
}

async function seedRealTeams(transactionalEntityManager: EntityManager) {
  const repo = transactionalEntityManager.getRepository(Team);
  const csvPath = join(__dirname, 'csv', 'teams.csv');

  const records = parseCSV(readFileSync(csvPath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<{ name: string }>;

  for (const { name } of records) {
    // 중복 확인
    const exists = await repo.exists({ where: { name } });
    if (exists) continue;

    // 새 Team 엔티티 저장
    await repo.save(repo.create({ name }));
    console.log(`✅ Seeded team: ${name}`);
  }
}

async function seedRealTeamTournament(
  transactionalEntityManager: EntityManager,
) {
  const teamRepo = transactionalEntityManager.getRepository(Team);
  const tournamentRepo = transactionalEntityManager.getRepository(Tournament);
  const teamTournamentRepo =
    transactionalEntityManager.getRepository(TeamTournament);
  const csvPath = join(__dirname, 'csv', 'team-tournaments.csv');

  const records = parseCSV(readFileSync(csvPath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<{ name: string; group: string }>;

  const tournament = await tournamentRepo.findOne({
    where: { name: '총장배', year: 2025, season: TournamentSeason.SPRING },
  });
  if (!tournament) return;

  for (const { name, group } of records) {
    const team = await teamRepo.findOne({ where: { name } });
    if (!team) continue;
    await teamTournamentRepo.save(
      teamTournamentRepo.create({
        team,
        tournament,
        groupName: group,
      }),
    );
    console.log(
      `✅ Seeded team-tournament: ${team.name} - ${tournament.name} (${group})`,
    );
  }
}

async function seedRealGames(transactionalEntityManager: EntityManager) {
  const gameRepo = transactionalEntityManager.getRepository(Game);
  const teamRepo = transactionalEntityManager.getRepository(Team);
  const umpireRepo = transactionalEntityManager.getRepository(Umpire);
  const tournamentRepo = transactionalEntityManager.getRepository(Tournament);
  const csvPath = join(__dirname, 'csv', 'games.csv');

  const records = parseCSV(readFileSync(csvPath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<{
    home_team_name: string;
    away_team_name: string;
    start_time: string;
    umpire_name: string;
  }>;
  const tournament = await tournamentRepo.findOne({
    where: { name: '총장배', year: 2025, season: TournamentSeason.SPRING },
  });
  if (!tournament) return;

  for (const {
    home_team_name,
    away_team_name,
    start_time,
    umpire_name,
  } of records) {
    const homeTeam = await teamRepo.findOne({
      where: { name: home_team_name },
    });
    const awayTeam = await teamRepo.findOne({
      where: { name: away_team_name },
    });
    if (!homeTeam || !awayTeam)
      throw new Error(`Team not found: ${home_team_name} or ${away_team_name}`);

    const recordUmpire = await umpireRepo.findOne({
      where: { user: { name: umpire_name } },
    });
    if (!recordUmpire) throw new Error(`Umpire not found: ${umpire_name}`);

    await gameRepo.save(
      gameRepo.create({
        homeTeam,
        awayTeam,
        recordUmpire,
        startTime: new Date(start_time),
        tournament,
      }),
    );
    console.log(`✅ Seeded game: ${homeTeam.name} vs ${awayTeam.name}`);
  }
}

async function seedRealPlayer(transactionalEntityManager: EntityManager) {
  const departmentRepo = transactionalEntityManager.getRepository(Department);
  const playerRepo = transactionalEntityManager.getRepository(Player);
  const teamRepo = transactionalEntityManager.getRepository(Team);
  const tournamentRepo = transactionalEntityManager.getRepository(Tournament);
  const playerTournamentRepo =
    transactionalEntityManager.getRepository(PlayerTournament);
  const csvPath = join(__dirname, 'csv', 'players.csv');

  const records = parseCSV(readFileSync(csvPath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<{
    department_name: string;
    player_name: string;
    is_wildcard: number;
    is_elite: number;
    team_name: string;
  }>;
  const tournament = await tournamentRepo.findOne({
    where: { name: '총장배', year: 2025, season: TournamentSeason.SPRING },
  });
  if (!tournament) return;

  for (const {
    department_name,
    player_name,
    is_wildcard,
    is_elite,
    team_name,
  } of records) {
    let department = await departmentRepo.findOne({
      where: { name: department_name },
    });
    if (!department)
      department = await departmentRepo.save(
        departmentRepo.create({ name: department_name }),
      );
    const team = await teamRepo.findOne({ where: { name: team_name } });
    if (!team) throw new Error(`Team not found: ${team_name}`);
    let player = await playerRepo.findOne({
      where: { name: player_name, department, team },
    });
    if (player) throw new Error(`Player already exists: ${player_name}`);
    player = await playerRepo.save(
      playerRepo.create({
        name: player_name,
        department,
        team,
        isWc: Number(is_wildcard) === 1,
        isElite: Number(is_elite) === 1,
      }),
    );
    await playerTournamentRepo.save(
      playerTournamentRepo.create({
        player,
        tournament,
      }),
    );
    console.log(
      `✅ Seeded player: ${player_name} (${department.name}) (${team.name})`,
    );
  }
}
async function main() {
  await AppDataSource.initialize();
  await AppDataSource.transaction(async (transactionalEntityManager) => {
    await seedRealUsers(transactionalEntityManager);
    await seedRealTournaments(transactionalEntityManager);
    await seedRealTeams(transactionalEntityManager);
    await seedRealTeamTournament(transactionalEntityManager);
    await seedRealGames(transactionalEntityManager);
    await seedRealPlayer(transactionalEntityManager);
  });
  await AppDataSource.destroy();
}

main();
