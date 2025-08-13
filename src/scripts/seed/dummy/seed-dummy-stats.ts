import { AppDataSource } from '../../../../data-source';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { PlayerTournament } from '../../../players/entities/player-tournament.entity';
import { BatterStat } from '../../../records/entities/batter-stat.entity';
import { PitcherStat } from '../../../records/entities/pitcher-stat.entity';
import { Tournament } from '../../../tournaments/entities/tournament.entity';
import { TournamentType } from '@/common/enums/tournament-type.enum';
import { Team } from '../../../teams/entities/team.entity';
import { TeamTournament } from '../../../teams/entities/team-tournament.entity';
import { Player } from '../../../players/entities/player.entity';
import { User } from '../../../users/entities/user.entity';
import { College } from '../../../profiles/entities/college.entity';
import { Department } from '../../../profiles/entities/department.entity';

interface RealBatterData {
  name: string;
  plateAppearances: number;
  atBats: number;
  runs: number;
  hits: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  runsBattedIn: number;
  walks: number;
  strikeouts: number;
  sacrificeBunts: number;
  sacrificeFlies: number;
  battingAverage: number;
  onBasePercentage: number;
  sluggingPercentage: number;
  ops: number;
}

interface RealPitcherData {
  name: string;
  inningPitchedOuts: number;
  strikeouts: number;
  walks: number;
  allowedHits: number;
  allowedRuns: number;
  earnedRuns: number;
  era: number;
}

interface PlayerData {
  name: string;
  email: string;
  college: string;
  department: string;
  backNumber: number;
  isElite: boolean;
  teamName: string;
}

export class DummyStatsSeeder {
  private dataSource: DataSource;
  private tournamentRepo: Repository<Tournament>;
  private teamRepo: Repository<Team>;
  private teamTournamentRepo: Repository<TeamTournament>;
  private playerRepo: Repository<Player>;
  private playerTournamentRepo: Repository<PlayerTournament>;
  private batterStatRepo: Repository<BatterStat>;
  private pitcherStatRepo: Repository<PitcherStat>;
  private userRepo: Repository<User>;
  private collegeRepo: Repository<College>;
  private departmentRepo: Repository<Department>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.tournamentRepo = dataSource.getRepository(Tournament);
    this.teamRepo = dataSource.getRepository(Team);
    this.teamTournamentRepo = dataSource.getRepository(TeamTournament);
    this.playerRepo = dataSource.getRepository(Player);
    this.playerTournamentRepo = dataSource.getRepository(PlayerTournament);
    this.batterStatRepo = dataSource.getRepository(BatterStat);
    this.pitcherStatRepo = dataSource.getRepository(PitcherStat);
    this.userRepo = dataSource.getRepository(User);
    this.collegeRepo = dataSource.getRepository(College);
    this.departmentRepo = dataSource.getRepository(Department);
  }

  async seedCompleteRealStats() {
    console.log('🎯 실제 통계 기반 완전 시딩 시작');

    // 1단계: 대회 생성
    console.log('\n=== 1단계: 대회 생성 ===');
    const tournament = await this.createTournament();

    // 2단계: 팀 생성
    console.log('\n=== 2단계: 팀 생성 ===');
    const teams = await this.createTeams(tournament.id);

    // 3단계: 선수 생성
    console.log('\n=== 3단계: 선수 생성 ===');
    const players = await this.createPlayers(tournament.id, teams);

    // 4단계: 실제 통계 생성
    console.log('\n=== 4단계: 실제 통계 생성 ===');
    await this.createRealStats(tournament.id, players);

    console.log('\n🎉 완전 시딩 완료!');
  }

  private async createTournament(): Promise<Tournament> {
    const existingTournament = await this.tournamentRepo.findOne({
      where: { name: TournamentType.SNU_NARAE, year: 2025 },
    });

    if (existingTournament) {
      console.log('✅ 기존 대회 발견:', existingTournament.name);
      return existingTournament;
    }

    const tournament = this.tournamentRepo.create({
      name: TournamentType.SNU_NARAE,
      year: 2025,
    });

    const savedTournament = await this.tournamentRepo.save(tournament);
    console.log('✅ 새 대회 생성:', savedTournament.name);
    return savedTournament;
  }

  private async createTeams(tournamentId: number): Promise<TeamTournament[]> {
    const teamNames = [
      '롯데 자이언츠',
      '삼성 라이온즈',
      '두산 베어스',
      'LG 트윈스',
      '키움 히어로즈',
    ];

    const teams: TeamTournament[] = [];

    for (const teamName of teamNames) {
      // 팀 생성 또는 조회
      let team = await this.teamRepo.findOne({
        where: { name: teamName },
      });

      if (!team) {
        team = this.teamRepo.create({
          name: teamName,
        });
        team = await this.teamRepo.save(team);
      }

      // TeamTournament 생성 또는 조회
      let teamTournament = await this.teamTournamentRepo.findOne({
        where: { teamId: team.id, tournamentId },
        relations: ['team'],
      });

      if (!teamTournament) {
        teamTournament = this.teamTournamentRepo.create({
          teamId: team.id,
          tournamentId,
          groupName: 'A조',
        });
        teamTournament = await this.teamTournamentRepo.save(teamTournament);
        console.log(`✅ 팀 등록: ${teamName}`);
      }

      // team relation을 포함하여 다시 조회
      const teamTournamentWithTeam = await this.teamTournamentRepo.findOne({
        where: { id: teamTournament.id },
        relations: ['team'],
      });

      teams.push(teamTournamentWithTeam);
    }

    return teams;
  }

  private async createPlayers(
    tournamentId: number,
    teams: TeamTournament[],
  ): Promise<PlayerTournament[]> {
    // 실제 선수 데이터 (타자 10명 + 투수 10명)
    const realPlayers: PlayerData[] = [
      // 타자 10명
      {
        name: '안현민',
        email: 'ahn.hyunmin@lotte.com',
        college: '공과대학',
        department: '기계공학부',
        backNumber: 1,
        isElite: true,
        teamName: '롯데 자이언츠',
      },
      {
        name: '송성문',
        email: 'song.sungmun@samsung.com',
        college: '자연과학대학',
        department: '물리천문학부',
        backNumber: 2,
        isElite: false,
        teamName: '삼성 라이온즈',
      },
      {
        name: '양의지',
        email: 'yang.euiji@doosan.com',
        college: '공과대학',
        department: '건설환경공학부',
        backNumber: 3,
        isElite: true,
        teamName: '두산 베어스',
      },
      {
        name: '문보경',
        email: 'moon.bokyung@lg.com',
        college: '자연과학대학',
        department: '화학부',
        backNumber: 4,
        isElite: true,
        teamName: 'LG 트윈스',
      },
      {
        name: '김재환',
        email: 'kim.jaehwan@kiwoom.com',
        college: '공과대학',
        department: '전기정보공학부',
        backNumber: 5,
        isElite: true,
        teamName: '키움 히어로즈',
      },
      {
        name: '박병호',
        email: 'park.byungho@lotte.com',
        college: '자연과학대학',
        department: '생명과학부',
        backNumber: 6,
        isElite: true,
        teamName: '롯데 자이언츠',
      },
      {
        name: '이정후',
        email: 'lee.junghoo@samsung.com',
        college: '공과대학',
        department: '건축학부',
        backNumber: 7,
        isElite: true,
        teamName: '삼성 라이온즈',
      },
      {
        name: '구자욱',
        email: 'koo.jawook@doosan.com',
        college: '자연과학대학',
        department: '수리과학부',
        backNumber: 8,
        isElite: false,
        teamName: '두산 베어스',
      },
      {
        name: '최정',
        email: 'choi.jung@lg.com',
        college: '공과대학',
        department: '산업공학과',
        backNumber: 9,
        isElite: true,
        teamName: 'LG 트윈스',
      },
      {
        name: '케이브',
        email: 'cave@kiwoom.com',
        college: '자연과학대학',
        department: '지구환경과학부',
        backNumber: 10,
        isElite: true,
        teamName: '키움 히어로즈',
      },
      // 투수 10명
      {
        name: '류현진',
        email: 'ryu.hyunjin@lotte.com',
        college: '공과대학',
        department: '기계공학부',
        backNumber: 11,
        isElite: true,
        teamName: '롯데 자이언츠',
      },
      {
        name: '김광현',
        email: 'kim.gwanghyun@samsung.com',
        college: '자연과학대학',
        department: '물리천문학부',
        backNumber: 12,
        isElite: true,
        teamName: '삼성 라이온즈',
      },
      {
        name: '오승환',
        email: 'oh.seunghwan@doosan.com',
        college: '공과대학',
        department: '건설환경공학부',
        backNumber: 13,
        isElite: true,
        teamName: '두산 베어스',
      },
      {
        name: '윤성빈',
        email: 'yoon.sungbin@lg.com',
        college: '자연과학대학',
        department: '화학부',
        backNumber: 14,
        isElite: false,
        teamName: 'LG 트윈스',
      },
      {
        name: '박세웅',
        email: 'park.sewoong@kiwoom.com',
        college: '공과대학',
        department: '전기정보공학부',
        backNumber: 15,
        isElite: true,
        teamName: '키움 히어로즈',
      },
      {
        name: '임창용',
        email: 'lim.changyong@lotte.com',
        college: '자연과학대학',
        department: '생명과학부',
        backNumber: 16,
        isElite: true,
        teamName: '롯데 자이언츠',
      },
      {
        name: '정우람',
        email: 'jung.wooram@samsung.com',
        college: '공과대학',
        department: '건축학부',
        backNumber: 17,
        isElite: false,
        teamName: '삼성 라이온즈',
      },
      {
        name: '한현희',
        email: 'han.hyunhee@doosan.com',
        college: '자연과학대학',
        department: '수리과학부',
        backNumber: 18,
        isElite: true,
        teamName: '두산 베어스',
      },
      {
        name: '이재학',
        email: 'lee.jaehak@lg.com',
        college: '공과대학',
        department: '산업공학과',
        backNumber: 19,
        isElite: false,
        teamName: 'LG 트윈스',
      },
      {
        name: '김원중',
        email: 'kim.wonjoong@kiwoom.com',
        college: '자연과학대학',
        department: '지구환경과학부',
        backNumber: 20,
        isElite: true,
        teamName: '키움 히어로즈',
      },
    ];

    const playerTournaments: PlayerTournament[] = [];

    for (const playerData of realPlayers) {
      // College 생성 또는 조회
      let college = await this.collegeRepo.findOne({
        where: { name: playerData.college },
      });

      if (!college) {
        college = this.collegeRepo.create({
          name: playerData.college,
        });
        college = await this.collegeRepo.save(college);
      }

      // Department 생성 또는 조회
      let department = await this.departmentRepo.findOne({
        where: { name: playerData.department },
      });

      if (!department) {
        department = this.departmentRepo.create({
          name: playerData.department,
        });
        department = await this.departmentRepo.save(department);
      }

      // TeamTournament 조회 (team relation 포함)
      const teamTournament = teams.find((tt) => {
        return tt.team?.name === playerData.teamName;
      });

      if (!teamTournament) {
        console.log(`⚠️ 팀을 찾을 수 없음: ${playerData.teamName}`);
        continue;
      }

      // Player 생성 또는 조회
      let player = await this.playerRepo.findOne({
        where: { name: playerData.name },
      });

      if (!player) {
        player = this.playerRepo.create({
          name: playerData.name,
          email: playerData.email,
          studentId: `2024${String(playerData.backNumber).padStart(4, '0')}`,
          birthDate: new Date('2000-01-01'),
          college: college,
          department: department,
        });
        player = await this.playerRepo.save(player);
      }

      // PlayerTournament 생성 또는 조회
      let playerTournament = await this.playerTournamentRepo.findOne({
        where: { playerId: player.id, tournamentId },
      });

      if (!playerTournament) {
        playerTournament = this.playerTournamentRepo.create({
          playerId: player.id,
          tournamentId,
          teamTournamentId: teamTournament.id,
          backNumber: playerData.backNumber,
        });
        playerTournament =
          await this.playerTournamentRepo.save(playerTournament);
        console.log(
          `✅ 선수 등록: ${playerData.name} (${playerData.teamName})`,
        );
      }

      // player relation을 포함하여 다시 조회
      const playerTournamentWithPlayer =
        await this.playerTournamentRepo.findOne({
          where: { id: playerTournament.id },
          relations: ['player'],
        });

      playerTournaments.push(playerTournamentWithPlayer);
    }

    return playerTournaments;
  }

  private async createRealStats(
    tournamentId: number,
    playerTournaments: PlayerTournament[],
  ) {
    // 실제 타자 데이터
    const realBatterData: RealBatterData[] = [
      {
        name: '안현민',
        plateAppearances: 332,
        atBats: 271,
        runs: 52,
        hits: 98,
        singles: 64,
        doubles: 13,
        triples: 3,
        homeRuns: 18,
        runsBattedIn: 62,
        walks: 59,
        strikeouts: 43,
        sacrificeBunts: 0,
        sacrificeFlies: 2,
        battingAverage: 0.362,
        onBasePercentage: 0.473,
        sluggingPercentage: 0.631,
        ops: 1.104,
      },
      {
        name: '송성문',
        plateAppearances: 298,
        atBats: 245,
        runs: 45,
        hits: 78,
        singles: 52,
        doubles: 12,
        triples: 2,
        homeRuns: 12,
        runsBattedIn: 48,
        walks: 48,
        strikeouts: 38,
        sacrificeBunts: 1,
        sacrificeFlies: 4,
        battingAverage: 0.318,
        onBasePercentage: 0.423,
        sluggingPercentage: 0.531,
        ops: 0.954,
      },
      {
        name: '양의지',
        plateAppearances: 412,
        atBats: 345,
        runs: 58,
        hits: 108,
        singles: 68,
        doubles: 18,
        triples: 1,
        homeRuns: 21,
        runsBattedIn: 75,
        walks: 62,
        strikeouts: 52,
        sacrificeBunts: 0,
        sacrificeFlies: 5,
        battingAverage: 0.313,
        onBasePercentage: 0.412,
        sluggingPercentage: 0.549,
        ops: 0.961,
      },
      {
        name: '문보경',
        plateAppearances: 446,
        atBats: 375,
        runs: 72,
        hits: 111,
        singles: 73,
        doubles: 16,
        triples: 1,
        homeRuns: 21,
        runsBattedIn: 86,
        walks: 65,
        strikeouts: 68,
        sacrificeBunts: 0,
        sacrificeFlies: 6,
        battingAverage: 0.296,
        onBasePercentage: 0.395,
        sluggingPercentage: 0.512,
        ops: 0.907,
      },
      {
        name: '김재환',
        plateAppearances: 389,
        atBats: 325,
        runs: 65,
        hits: 95,
        singles: 58,
        doubles: 15,
        triples: 2,
        homeRuns: 20,
        runsBattedIn: 68,
        walks: 58,
        strikeouts: 72,
        sacrificeBunts: 0,
        sacrificeFlies: 6,
        battingAverage: 0.292,
        onBasePercentage: 0.393,
        sluggingPercentage: 0.538,
        ops: 0.931,
      },
      {
        name: '박병호',
        plateAppearances: 378,
        atBats: 312,
        runs: 58,
        hits: 88,
        singles: 52,
        doubles: 14,
        triples: 1,
        homeRuns: 21,
        runsBattedIn: 72,
        walks: 62,
        strikeouts: 78,
        sacrificeBunts: 0,
        sacrificeFlies: 4,
        battingAverage: 0.282,
        onBasePercentage: 0.397,
        sluggingPercentage: 0.554,
        ops: 0.951,
      },
      {
        name: '이정후',
        plateAppearances: 425,
        atBats: 365,
        runs: 78,
        hits: 125,
        singles: 85,
        doubles: 22,
        triples: 4,
        homeRuns: 14,
        runsBattedIn: 62,
        walks: 52,
        strikeouts: 45,
        sacrificeBunts: 2,
        sacrificeFlies: 6,
        battingAverage: 0.342,
        onBasePercentage: 0.417,
        sluggingPercentage: 0.534,
        ops: 0.951,
      },
      {
        name: '구자욱',
        plateAppearances: 356,
        atBats: 298,
        runs: 52,
        hits: 89,
        singles: 62,
        doubles: 12,
        triples: 2,
        homeRuns: 13,
        runsBattedIn: 55,
        walks: 52,
        strikeouts: 58,
        sacrificeBunts: 1,
        sacrificeFlies: 5,
        battingAverage: 0.299,
        onBasePercentage: 0.396,
        sluggingPercentage: 0.483,
        ops: 0.879,
      },
      {
        name: '최정',
        plateAppearances: 398,
        atBats: 332,
        runs: 64,
        hits: 98,
        singles: 62,
        doubles: 16,
        triples: 1,
        homeRuns: 19,
        runsBattedIn: 68,
        walks: 62,
        strikeouts: 65,
        sacrificeBunts: 0,
        sacrificeFlies: 4,
        battingAverage: 0.295,
        onBasePercentage: 0.402,
        sluggingPercentage: 0.518,
        ops: 0.92,
      },
      {
        name: '케이브',
        plateAppearances: 420,
        atBats: 382,
        runs: 49,
        hits: 117,
        singles: 78,
        doubles: 23,
        triples: 4,
        homeRuns: 12,
        runsBattedIn: 59,
        walks: 31,
        strikeouts: 85,
        sacrificeBunts: 0,
        sacrificeFlies: 7,
        battingAverage: 0.306,
        onBasePercentage: 0.352,
        sluggingPercentage: 0.482,
        ops: 0.834,
      },
    ];

    // 실제 투수 데이터
    const realPitcherData: RealPitcherData[] = [
      {
        name: '류현진',
        inningPitchedOuts: 180, // 60이닝
        strikeouts: 72,
        walks: 18,
        allowedHits: 45,
        allowedRuns: 22,
        earnedRuns: 18,
        era: 2.7,
      },
      {
        name: '김광현',
        inningPitchedOuts: 165, // 55이닝
        strikeouts: 58,
        walks: 22,
        allowedHits: 52,
        allowedRuns: 28,
        earnedRuns: 24,
        era: 3.93,
      },
      {
        name: '오승환',
        inningPitchedOuts: 60, // 20이닝
        strikeouts: 25,
        walks: 8,
        allowedHits: 15,
        allowedRuns: 6,
        earnedRuns: 5,
        era: 2.25,
      },
      {
        name: '윤성빈',
        inningPitchedOuts: 150, // 50이닝
        strikeouts: 65,
        walks: 25,
        allowedHits: 48,
        allowedRuns: 26,
        earnedRuns: 22,
        era: 3.96,
      },
      {
        name: '박세웅',
        inningPitchedOuts: 135, // 45이닝
        strikeouts: 52,
        walks: 28,
        allowedHits: 55,
        allowedRuns: 32,
        earnedRuns: 28,
        era: 5.6,
      },
      {
        name: '임창용',
        inningPitchedOuts: 75, // 25이닝
        strikeouts: 32,
        walks: 12,
        allowedHits: 22,
        allowedRuns: 12,
        earnedRuns: 10,
        era: 3.6,
      },
      {
        name: '정우람',
        inningPitchedOuts: 90, // 30이닝
        strikeouts: 38,
        walks: 15,
        allowedHits: 28,
        allowedRuns: 15,
        earnedRuns: 13,
        era: 3.9,
      },
      {
        name: '한현희',
        inningPitchedOuts: 120, // 40이닝
        strikeouts: 45,
        walks: 20,
        allowedHits: 38,
        allowedRuns: 20,
        earnedRuns: 18,
        era: 4.05,
      },
      {
        name: '이재학',
        inningPitchedOuts: 105, // 35이닝
        strikeouts: 42,
        walks: 18,
        allowedHits: 35,
        allowedRuns: 18,
        earnedRuns: 16,
        era: 4.11,
      },
      {
        name: '김원중',
        inningPitchedOuts: 90, // 30이닝
        strikeouts: 35,
        walks: 22,
        allowedHits: 42,
        allowedRuns: 25,
        earnedRuns: 22,
        era: 6.6,
      },
    ];

    let batterStatsCreated = 0;
    let pitcherStatsCreated = 0;

    // 타자 통계 생성
    for (
      let i = 0;
      i < Math.min(realBatterData.length, playerTournaments.length);
      i++
    ) {
      const playerTournament = playerTournaments[i];
      const batterData = realBatterData[i];

      // 이미 통계가 존재하는지 확인
      const existingBatterStat = await this.batterStatRepo.findOne({
        where: { playerTournamentId: playerTournament.id },
      });

      if (!existingBatterStat) {
        const batterStat = this.batterStatRepo.create({
          playerTournamentId: playerTournament.id,
          ...batterData,
        });

        await this.batterStatRepo.save(batterStat);
        batterStatsCreated++;
        console.log(
          `✅ ${playerTournament.player?.name || 'Unknown'}의 타자 통계 생성 (${batterData.name} 데이터 적용)`,
        );
      }
    }

    // 투수 통계 생성 (타자 다음 선수들)
    const pitcherStartIndex = Math.min(
      realBatterData.length,
      playerTournaments.length,
    );
    for (
      let i = 0;
      i <
      Math.min(
        realPitcherData.length,
        playerTournaments.length - pitcherStartIndex,
      );
      i++
    ) {
      const playerTournament = playerTournaments[pitcherStartIndex + i];
      const pitcherData = realPitcherData[i];

      // 이미 통계가 존재하는지 확인
      const existingPitcherStat = await this.pitcherStatRepo.findOne({
        where: { playerTournamentId: playerTournament.id },
      });

      if (!existingPitcherStat) {
        const pitcherStat = this.pitcherStatRepo.create({
          playerTournamentId: playerTournament.id,
          ...pitcherData,
        });

        await this.pitcherStatRepo.save(pitcherStat);
        pitcherStatsCreated++;
        console.log(
          `✅ ${playerTournament.player?.name || 'Unknown'}의 투수 통계 생성 (${pitcherData.name} 데이터 적용)`,
        );
      }
    }

    console.log('\n📊 생성된 통계:');
    console.log(`   - 타자 통계: ${batterStatsCreated}개`);
    console.log(`   - 투수 통계: ${pitcherStatsCreated}개`);
    console.log(`   - 총 선수: ${playerTournaments.length}명`);
  }
}

async function main() {
  try {
    // DataSource 초기화
    await AppDataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공');

    console.log('\n=== 실제 통계 기반 완전 시딩 ===');
    const completeSeeder = new DummyStatsSeeder(AppDataSource);
    await completeSeeder.seedCompleteRealStats();

    console.log('\n🎉 완전 시딩 완료!');
  } catch (error) {
    console.error('❌ 완전 시딩 중 오류 발생:', error);
    process.exit(1);
  } finally {
    // DataSource 연결 종료
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ 데이터베이스 연결 종료');
    }
  }
}

// 스크립트가 직접 실행될 때만 main 함수 실행
if (require.main === module) {
  main();
}
