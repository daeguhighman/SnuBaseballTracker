import * as readline from 'readline/promises';
import * as path from 'path';
import { stdin as input, stdout as output } from 'process';
import * as XLSX from 'xlsx';
import { DataSource, Repository } from 'typeorm';

import { AppDataSource } from '../../../../data-source';
import { TournamentType } from '../../../common/enums/tournament-type.enum';

import { Tournament } from '../../../tournaments/entities/tournament.entity';
import { Team } from '../../../teams/entities/team.entity';
import { TeamTournament } from '../../../teams/entities/team-tournament.entity';
import { Player } from '../../../players/entities/player.entity';
import { PlayerTournament } from '../../../players/entities/player-tournament.entity';
import { Department } from '../../../profiles/entities/department.entity';
import { College } from '../../../profiles/entities/college.entity';
import { AdminSeeder } from './seed-admin';

interface BracketTeam {
  name: string;
  groupName: string;
}

interface BracketMatch {
  group: string;
  awayTeam: string; // 선공
  homeTeam: string; // 후공
}

interface PlayerRow {
  college: string;
  department: string;
  studentId: string | number;
  name: string;
  isWildcard: string;
  teamName: string;
}

// 2026-chongjang-team.png 기준 — 선공/후공 = away/home
const BRACKET_MATCHES: BracketMatch[] = [
  { group: 'A', awayTeam: '사회대A', homeTeam: '법대' },
  { group: 'B', awayTeam: '포톤스A', homeTeam: '관악사' },
  { group: 'C', awayTeam: '농생대', homeTeam: '버디스' },
  { group: 'D', awayTeam: '체육교육과', homeTeam: '미라클스' },
  { group: 'E', awayTeam: '룰루', homeTeam: '재료공학부' },
  { group: 'F', awayTeam: '포톤스B', homeTeam: '알파사회대' },
];

const BRACKET_TEAMS: BracketTeam[] = BRACKET_MATCHES.flatMap((m) => [
  { name: m.awayTeam, groupName: m.group },
  { name: m.homeTeam, groupName: m.group },
]);

const TOURNAMENT_NAME_CHOICES: { key: string; value: TournamentType }[] = [
  { key: '1', value: TournamentType.CHONGJANG },
  { key: '2', value: TournamentType.JONGHAP },
  { key: '3', value: TournamentType.SNU_LEAGUE },
  { key: '4', value: TournamentType.SNU_NARAE },
];

async function ask(
  rl: readline.Interface,
  question: string,
  defaultValue: string,
): Promise<string> {
  const answer = (await rl.question(`${question} [${defaultValue}]: `)).trim();
  return answer || defaultValue;
}

async function promptInputs(): Promise<{
  tournamentName: TournamentType;
  year: number;
  excelPath: string;
}> {
  const defaultExcel = path.resolve(
    __dirname,
    '../../../../../2026-chongjang.xlsx',
  );

  // 비대화형 모드: 환경변수가 모두 지정된 경우 프롬프트 스킵
  const envName = process.env.SEED_TOURNAMENT_NAME;
  const envYear = process.env.SEED_YEAR;
  const envExcel = process.env.SEED_EXCEL_PATH;
  if (envName && envYear) {
    const matched =
      TOURNAMENT_NAME_CHOICES.find((c) => c.value === envName) ||
      TOURNAMENT_NAME_CHOICES.find((c) => c.key === envName);
    if (!matched) {
      throw new Error(`SEED_TOURNAMENT_NAME 값이 잘못되었습니다: ${envName}`);
    }
    const year = parseInt(envYear, 10);
    if (isNaN(year)) {
      throw new Error(`SEED_YEAR 값이 잘못되었습니다: ${envYear}`);
    }
    return {
      tournamentName: matched.value,
      year,
      excelPath: envExcel || defaultExcel,
    };
  }

  const rl = readline.createInterface({ input, output });
  try {
    console.log('=== 시드 입력값 선택 ===');
    console.log('대회 종류:');
    for (const c of TOURNAMENT_NAME_CHOICES) {
      console.log(`  ${c.key}) ${c.value}`);
    }
    const nameInput = await ask(rl, '대회 종류 선택', '1');
    const matched = TOURNAMENT_NAME_CHOICES.find((c) => c.key === nameInput);
    if (!matched) {
      throw new Error(`올바른 대회 종류를 선택해주세요 (1-4): ${nameInput}`);
    }

    const yearStr = await ask(rl, '연도', String(new Date().getFullYear()));
    const year = parseInt(yearStr, 10);
    if (isNaN(year)) {
      throw new Error(`올바른 연도를 입력해주세요: ${yearStr}`);
    }

    const excelPath = await ask(rl, '선수 명단 xlsx 경로', defaultExcel);

    return { tournamentName: matched.value, year, excelPath };
  } finally {
    rl.close();
  }
}

class SeedAllRunner {
  private tournamentRepo: Repository<Tournament>;
  private teamRepo: Repository<Team>;
  private teamTournamentRepo: Repository<TeamTournament>;
  private playerRepo: Repository<Player>;
  private playerTournamentRepo: Repository<PlayerTournament>;
  private departmentRepo: Repository<Department>;
  private collegeRepo: Repository<College>;

  constructor(ds: DataSource) {
    this.tournamentRepo = ds.getRepository(Tournament);
    this.teamRepo = ds.getRepository(Team);
    this.teamTournamentRepo = ds.getRepository(TeamTournament);
    this.playerRepo = ds.getRepository(Player);
    this.playerTournamentRepo = ds.getRepository(PlayerTournament);
    this.departmentRepo = ds.getRepository(Department);
    this.collegeRepo = ds.getRepository(College);
  }

  async ensureTournament(
    name: TournamentType,
    year: number,
  ): Promise<Tournament> {
    let tournament = await this.tournamentRepo.findOne({
      where: { name, year },
    });
    if (tournament) {
      console.log(`✓ 대회 이미 존재: ${name} ${year} (ID: ${tournament.id})`);
      return tournament;
    }
    tournament = await this.tournamentRepo.save(
      this.tournamentRepo.create({ name, year }),
    );
    console.log(`+ 대회 생성: ${name} ${year} (ID: ${tournament.id})`);
    return tournament;
  }

  async seedTeams(tournament: Tournament): Promise<Map<string, TeamTournament>> {
    console.log('\n--- 팀 시딩 ---');
    const map = new Map<string, TeamTournament>();
    let created = 0;
    let skipped = 0;

    for (const data of BRACKET_TEAMS) {
      let team = await this.teamRepo.findOne({ where: { name: data.name } });
      if (!team) {
        team = await this.teamRepo.save(
          this.teamRepo.create({ name: data.name }),
        );
        console.log(`  + 팀 생성: ${data.name}`);
      }

      let tt = await this.teamTournamentRepo.findOne({
        where: {
          team: { id: team.id },
          tournament: { id: tournament.id },
        },
      });
      if (!tt) {
        tt = await this.teamTournamentRepo.save(
          this.teamTournamentRepo.create({
            team,
            tournament,
            groupName: data.groupName,
          }),
        );
        console.log(`  + 팀-대회 연결: ${data.name} (조 ${data.groupName})`);
        created++;
      } else {
        skipped++;
      }
      map.set(data.name, tt);
    }

    console.log(`✅ 팀 시딩 완료 (생성 ${created} / 기존 ${skipped})`);
    return map;
  }

  async seedPlayers(
    tournament: Tournament,
    teamMap: Map<string, TeamTournament>,
    excelPath: string,
  ) {
    console.log('\n--- 선수 시딩 ---');
    console.log(`엑셀 파일: ${excelPath}`);

    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: PlayerRow[] = XLSX.utils.sheet_to_json(sheet);
    console.log(`총 ${rows.length}명 처리`);

    let created = 0;
    let skipped = 0;
    let errors = 0;
    const unmatchedTeams = new Set<string>();

    for (const row of rows) {
      try {
        const teamTournament = teamMap.get(row.teamName);
        if (!teamTournament) {
          unmatchedTeams.add(row.teamName);
          errors++;
          continue;
        }

        let college = await this.collegeRepo.findOne({
          where: { name: row.college },
        });
        if (!college) {
          college = await this.collegeRepo.save(
            this.collegeRepo.create({ name: row.college }),
          );
        }

        let department = await this.departmentRepo.findOne({
          where: { name: row.department },
        });
        if (!department) {
          department = await this.departmentRepo.save(
            this.departmentRepo.create({ name: row.department }),
          );
        }

        const studentId = String(row.studentId);

        let player = await this.playerRepo.findOne({
          where: {
            name: row.name,
            studentId,
            department: { id: department.id },
          },
          relations: ['department'],
        });
        if (!player) {
          player = await this.playerRepo.save(
            this.playerRepo.create({
              name: row.name,
              college,
              department,
              studentId,
            }),
          );
        }

        const existingPT = await this.playerTournamentRepo.findOne({
          where: {
            playerId: player.id,
            tournamentId: tournament.id,
          },
        });
        if (existingPT) {
          skipped++;
          continue;
        }

        await this.playerTournamentRepo.save(
          this.playerTournamentRepo.create({
            player,
            teamTournament,
            tournamentId: tournament.id,
            isWildcard: row.isWildcard === 'WC',
          }),
        );
        created++;
      } catch (err) {
        console.error(`  ! 선수 처리 오류: ${row.name}`, err);
        errors++;
      }
    }

    console.log(
      `✅ 선수 시딩 완료 (생성 ${created} / 기존 ${skipped} / 오류 ${errors})`,
    );
    if (unmatchedTeams.size > 0) {
      console.warn(
        `⚠️  PNG 브래킷에 없는 팀의 선수가 스킵되었습니다: ${[
          ...unmatchedTeams,
        ].join(', ')}`,
      );
    }
  }
}

async function main() {
  const inputs = await promptInputs();
  console.log(
    `\n선택값 → 대회: ${inputs.tournamentName}, 연도: ${inputs.year}, 엑셀: ${inputs.excelPath}\n`,
  );

  await AppDataSource.initialize();
  console.log('데이터베이스 연결 성공');

  try {
    const runner = new SeedAllRunner(AppDataSource);
    const tournament = await runner.ensureTournament(
      inputs.tournamentName,
      inputs.year,
    );
    const teamMap = await runner.seedTeams(tournament);
    await runner.seedPlayers(tournament, teamMap, inputs.excelPath);

    console.log('\n--- 관리자 계정 시딩 ---');
    const adminSeeder = new AdminSeeder(AppDataSource);
    await adminSeeder.seedAdmins();

    console.log('\n🎉 시딩 완료 (경기는 어드민 UI에서 등록)');
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('시딩 중 오류:', err);
    process.exit(1);
  });
}
