import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { TournamentSeeder } from './seed-tournament';
import { TeamSeeder } from './seed-teams';
import { PlayerSeeder } from './seed-players';
import { GameSeeder } from './seed-games';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('🚀 시드 데이터 생성 시작...\n');

    // 1단계: Tournament 생성
    console.log('=== 1단계: 대회 생성 ===');
    const tournamentSeeder = new TournamentSeeder(dataSource);
    await tournamentSeeder.seedTournament();

    // 2단계: Team & TeamTournament 생성
    console.log('\n=== 2단계: 팀 및 팀-대회 생성 ===');
    const teamSeeder = new TeamSeeder(dataSource);
    const tournamentId = 1; // 실제 대회 ID로 변경
    await teamSeeder.seedTeams(tournamentId);

    // 3단계: Player & PlayerTournament 생성
    console.log('\n=== 3단계: 선수 및 선수-대회 생성 ===');
    const playerSeeder = new PlayerSeeder(dataSource);
    await playerSeeder.seedPlayers(tournamentId);

    // 4단계: Games 생성
    console.log('\n=== 4단계: 게임 생성 ===');
    const gameSeeder = new GameSeeder(dataSource);
    await gameSeeder.seedGames(tournamentId);

    console.log('\n🎉 모든 시드 데이터 생성 완료!');
  } catch (error) {
    console.error('❌ 시드 데이터 생성 중 오류 발생:', error);
  } finally {
    await app.close();
  }
}

main();
