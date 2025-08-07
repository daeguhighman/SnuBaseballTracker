import { AppDataSource } from '../../data-source';
import { TournamentSeeder } from './seed-tournament';
import { TeamSeeder } from './seed-teams';
import { PlayerSeeder } from './seed-players';
import { GameSeeder } from './seed-games';
import { UserSeeder } from './seed-users';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { TournamentType } from '@/common/enums/tournament-type.enum';

async function main() {
  try {
    // DataSource 초기화
    await AppDataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공');

    // 1단계: Users 생성
    console.log('\n=== 1단계: 사용자 생성 ===');
    const userSeeder = new UserSeeder(AppDataSource);
    await userSeeder.seedUsers();

    // 2단계: Tournament 생성
    console.log('\n=== 2단계: 대회 생성 ===');
    const tournamentSeeder = new TournamentSeeder(AppDataSource);
    await tournamentSeeder.seedTournament();

    // 3단계: 생성된 대회 ID 조회
    console.log('\n=== 3단계: 대회 ID 조회 ===');
    const tournamentRepo = AppDataSource.getRepository(Tournament);
    const tournament = await tournamentRepo.findOne({
      where: { name: TournamentType.SNU_NARAE, year: 2025 },
      order: { id: 'DESC' },
    });

    if (!tournament) {
      throw new Error('생성된 대회를 찾을 수 없습니다.');
    }

    const tournamentId = tournament.id;
    console.log(`✅ 대회 ID ${tournamentId} 확인됨`);

    // 4단계: Team & TeamTournament 생성
    console.log('\n=== 4단계: 팀 및 팀-대회 생성 ===');
    const teamSeeder = new TeamSeeder(AppDataSource);
    await teamSeeder.seedTeams(tournamentId);

    // 5단계: Player & PlayerTournament 생성
    console.log('\n=== 5단계: 선수 및 선수-대회 생성 ===');
    const playerSeeder = new PlayerSeeder(AppDataSource);
    await playerSeeder.seedPlayers(tournamentId);

    // 6단계: Games 생성
    console.log('\n=== 6단계: 게임 생성 ===');
    const gameSeeder = new GameSeeder(AppDataSource);
    await gameSeeder.seedGames(tournamentId);

    console.log('\n🎉 모든 시드 데이터 생성 완료!');
    console.log(`📊 생성된 데이터:`);
    console.log(`   - 대회: 1개 (ID: ${tournamentId})`);
    console.log(`   - 팀: 10개`);
    console.log(`   - 선수: 56명`);
    console.log(`   - 게임: 5개`);
    console.log(`   - 사용자: 5명`);
  } catch (error) {
    console.error('❌ 시드 데이터 생성 중 오류 발생:', error);
    process.exit(1);
  } finally {
    // DataSource 연결 종료
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ 데이터베이스 연결 종료');
    }
  }
}

main();
