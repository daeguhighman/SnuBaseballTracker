import { AppDataSource } from '../../../../data-source';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { PlayerTournament } from '../../../players/entities/player-tournament.entity';
import { BatterStat } from '../../../records/entities/batter-stat.entity';
import { PitcherStat } from '../../../records/entities/pitcher-stat.entity';
import { Tournament } from '../../../tournaments/entities/tournament.entity';
import { TournamentType } from '@/common/enums/tournament-type.enum';

async function testRealStatsSeeding() {
  try {
    // DataSource 초기화
    await AppDataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공');

    const tournamentRepo = AppDataSource.getRepository(Tournament);
    const playerTournamentRepo = AppDataSource.getRepository(PlayerTournament);
    const batterStatRepo = AppDataSource.getRepository(BatterStat);
    const pitcherStatRepo = AppDataSource.getRepository(PitcherStat);

    // 대회 조회
    const tournament = await tournamentRepo.findOne({
      where: { name: TournamentType.SNU_NARAE, year: 2025 },
      order: { id: 'DESC' },
    });

    if (!tournament) {
      console.log(
        '❌ 대회를 찾을 수 없습니다. 먼저 seed-all.ts를 실행해주세요.',
      );
      return;
    }

    console.log(`📊 대회: ${tournament.name} (${tournament.year})`);

    // PlayerTournament 개수 확인
    const playerTournaments = await playerTournamentRepo.find({
      where: { tournamentId: tournament.id },
    });
    console.log(`👥 PlayerTournament: ${playerTournaments.length}개`);

    // BatterStat 개수 확인
    const batterStats = await batterStatRepo.find({
      relations: ['playerTournament', 'playerTournament.player'],
    });
    console.log(`🏏 BatterStat: ${batterStats.length}개`);

    // PitcherStat 개수 확인
    const pitcherStats = await pitcherStatRepo.find({
      relations: ['playerTournament', 'playerTournament.player'],
    });
    console.log(`⚾ PitcherStat: ${pitcherStats.length}개`);

    // 실제 타자 통계 출력
    if (batterStats.length > 0) {
      console.log('\n📋 실제 타자 통계:');
      batterStats.forEach((stat, index) => {
        console.log(`   ${index + 1}. ${stat.playerTournament.player.name}`);
        console.log(
          `      타석: ${stat.plateAppearances}, 타수: ${stat.atBats}, 안타: ${stat.hits}`,
        );
        console.log(
          `      홈런: ${stat.homeRuns}, 타점: ${stat.runsBattedIn}, 볼넷: ${stat.walks}`,
        );
        console.log(
          `      타율: ${stat.battingAverage}, 출루율: ${stat.onBasePercentage}, 장타율: ${stat.sluggingPercentage}, OPS: ${stat.ops}`,
        );
        console.log('');
      });
    }

    // 실제 투수 통계 출력
    if (pitcherStats.length > 0) {
      console.log('\n📋 실제 투수 통계:');
      pitcherStats.forEach((stat, index) => {
        console.log(`   ${index + 1}. ${stat.playerTournament.player.name}`);
        console.log(
          `      이닝: ${(stat.inningPitchedOuts / 3).toFixed(1)}, 삼진: ${stat.strikeouts}, 볼넷: ${stat.walks}`,
        );
        console.log(
          `      피안타: ${stat.allowedHits}, 실점: ${stat.allowedRuns}, 자책점: ${stat.earnedRuns}`,
        );
        console.log(`      ERA: ${stat.era}`);
        console.log('');
      });
    }

    // 타율 상위 3명
    if (batterStats.length > 0) {
      console.log('\n🏆 타율 상위 3명:');
      const topBatters = batterStats
        .filter((stat) => stat.atBats > 0)
        .sort((a, b) => b.battingAverage - a.battingAverage)
        .slice(0, 3);

      topBatters.forEach((stat, index) => {
        console.log(
          `   ${index + 1}. ${stat.playerTournament.player.name} - 타율: ${stat.battingAverage} (${stat.hits}/${stat.atBats})`,
        );
      });
    }

    // 홈런 상위 3명
    if (batterStats.length > 0) {
      console.log('\n🏆 홈런 상위 3명:');
      const topHomeRunHitters = batterStats
        .sort((a, b) => b.homeRuns - a.homeRuns)
        .slice(0, 3);

      topHomeRunHitters.forEach((stat, index) => {
        console.log(
          `   ${index + 1}. ${stat.playerTournament.player.name} - 홈런: ${stat.homeRuns}개`,
        );
      });
    }

    // OPS 상위 3명
    if (batterStats.length > 0) {
      console.log('\n🏆 OPS 상위 3명:');
      const topOPS = batterStats.sort((a, b) => b.ops - a.ops).slice(0, 3);

      topOPS.forEach((stat, index) => {
        console.log(
          `   ${index + 1}. ${stat.playerTournament.player.name} - OPS: ${stat.ops}`,
        );
      });
    }

    // ERA 상위 3명 (낮을수록 좋음)
    if (pitcherStats.length > 0) {
      console.log('\n🏆 평균자책점 상위 3명 (낮을수록 좋음):');
      const topPitchers = pitcherStats
        .filter((stat) => stat.inningPitchedOuts > 0)
        .sort((a, b) => a.era - b.era)
        .slice(0, 3);

      topPitchers.forEach((stat, index) => {
        console.log(
          `   ${index + 1}. ${stat.playerTournament.player.name} - ERA: ${stat.era} (${stat.earnedRuns}ER/${(stat.inningPitchedOuts / 3).toFixed(1)}IP)`,
        );
      });
    }

    // 삼진 상위 3명
    if (pitcherStats.length > 0) {
      console.log('\n🏆 삼진 상위 3명:');
      const topStrikeouts = pitcherStats
        .sort((a, b) => b.strikeouts - a.strikeouts)
        .slice(0, 3);

      topStrikeouts.forEach((stat, index) => {
        console.log(
          `   ${index + 1}. ${stat.playerTournament.player.name} - 삼진: ${stat.strikeouts}개`,
        );
      });
    }

    console.log('\n✅ 실제 통계 데이터 검증 완료!');
  } catch (error) {
    console.error('❌ 통계 데이터 검증 중 오류 발생:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ 데이터베이스 연결 종료');
    }
  }
}

testRealStatsSeeding();
