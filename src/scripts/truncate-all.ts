import { AppDataSource } from '../../data-source';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';

// 모든 엔티티들을 import
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../profiles/entities/profile.entity';
import { College } from '../profiles/entities/college.entity';
import { Department } from '../profiles/entities/department.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamTournament } from '../teams/entities/team-tournament.entity';
import { Player } from '../players/entities/player.entity';
import { PlayerTournament } from '../players/entities/player-tournament.entity';
import { Game } from '../games/entities/game.entity';
import { GameStat } from '../games/entities/game-stat.entity';
import { GameInningStat } from '../games/entities/game-inning-stat.entity';
import { VirtualInningStat } from '../games/entities/virtual-inning-stat.entity';
import { BatterGameParticipation } from '../games/entities/batter-game-participation.entity';
import { PitcherGameParticipation } from '../games/entities/pitcher-game-participation.entity';
import { BatterGameStat } from '../games/entities/batter-game-stat.entity';
import { PitcherGameStat } from '../games/entities/pitcher-game-stat.entity';
import { GameRoaster } from '../games/entities/game-roaster.entity';
import { Play } from '../plays/entities/play.entity';
import { Runner } from '../plays/entities/runner.entity';
import { RunnerEvent } from '../plays/entities/runner-event.entity';
import { Umpire } from '../umpires/entities/umpire.entity';
import { UmpireTournament } from '../umpires/entities/umpire-tournament.entity';
import { EmailCode } from '../mail/entities/email-code.entity';
import { PasswordResetToken } from '../mail/entities/password-reset-token.entity';
import { Session } from '../sessions/entities/session.entity';
import { BatterStat } from '../records/entities/batter-stat.entity';
import { PitcherStat } from '../records/entities/pitcher-stat.entity';
import { VirtualRunner } from '../plays/entities/virtual-runner.entity';

export class TruncateService {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async truncateAllTables() {
    console.log('🗑️  모든 테이블 데이터 삭제 시작...\n');

    // 외래키 제약조건을 무시하고 모든 테이블을 한번에 삭제
    const tables = [
      { name: 'RunnerEvent', entity: RunnerEvent },
      { name: 'Runner', entity: Runner },
      { name: 'VirtualRunner', entity: VirtualRunner },
      { name: 'Play', entity: Play },
      { name: 'BatterGameStat', entity: BatterGameStat },
      { name: 'PitcherGameStat', entity: PitcherGameStat },
      { name: 'BatterGameParticipation', entity: BatterGameParticipation },
      { name: 'PitcherGameParticipation', entity: PitcherGameParticipation },
      { name: 'GameRoaster', entity: GameRoaster },
      { name: 'VirtualInningStat', entity: VirtualInningStat },
      { name: 'GameInningStat', entity: GameInningStat },
      { name: 'GameStat', entity: GameStat },
      { name: 'Game', entity: Game },
      { name: 'PlayerTournament', entity: PlayerTournament },
      { name: 'TeamTournament', entity: TeamTournament },
      { name: 'UmpireTournament', entity: UmpireTournament },
      { name: 'EmailCode', entity: EmailCode },
      { name: 'PasswordResetToken', entity: PasswordResetToken },
      { name: 'Session', entity: Session },
      { name: 'BatterStat', entity: BatterStat },
      { name: 'PitcherStat', entity: PitcherStat },
      { name: 'Player', entity: Player },
      { name: 'Team', entity: Team },
      { name: 'Tournament', entity: Tournament },
      { name: 'Umpire', entity: Umpire },
      { name: 'UserProfile', entity: UserProfile },
      { name: 'User', entity: User },
      { name: 'Department', entity: Department },
      { name: 'College', entity: College },
    ];

    let deletedCount = 0;
    let errorCount = 0;

    try {
      // 외래키 제약조건 일시적으로 비활성화
      console.log('🔓 외래키 제약조건 비활성화 중...');
      await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 0;');
      console.log('✅ 외래키 제약조건 비활성화 완료\n');

      for (const table of tables) {
        try {
          const repository = this.dataSource.getRepository(table.entity);
          const count = await repository.count();

          if (count > 0) {
            await repository.clear();
            console.log(`✅ ${table.name} 테이블 ${count}개 레코드 삭제 완료`);
            deletedCount += count;
          } else {
            console.log(`⏭️  ${table.name} 테이블은 이미 비어있음`);
          }
        } catch (error) {
          console.error(`❌ ${table.name} 테이블 삭제 실패:`, error.message);
          errorCount++;
        }
      }

      // 외래키 제약조건 다시 활성화
      console.log('\n🔒 외래키 제약조건 다시 활성화 중...');
      await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 1;');
      console.log('✅ 외래키 제약조건 활성화 완료');
    } catch (error) {
      console.error('❌ 외래키 제약조건 처리 중 오류 발생:', error.message);

      // 오류 발생 시에도 외래키 제약조건을 다시 활성화
      try {
        await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 1;');
        console.log('✅ 외래키 제약조건 복구 완료');
      } catch (restoreError) {
        console.error('❌ 외래키 제약조건 복구 실패:', restoreError.message);
      }
    }

    console.log('\n=== 테이블 삭제 결과 ===');
    console.log(`삭제된 레코드: ${deletedCount}개`);
    console.log(`오류 발생: ${errorCount}개 테이블`);

    if (errorCount === 0) {
      console.log('🎉 모든 테이블 데이터 삭제 완료!');
    } else {
      console.log('⚠️  일부 테이블에서 오류가 발생했습니다.');
    }
  }
}

async function main() {
  try {
    console.log('🚀 데이터베이스 초기화 시작...\n');

    // DataSource 초기화
    await AppDataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    const truncateService = new TruncateService(AppDataSource);
    await truncateService.truncateAllTables();
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 중 오류 발생:', error);
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
