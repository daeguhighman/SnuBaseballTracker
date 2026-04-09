import { AppDataSource } from '../../../../data-source';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { Tournament } from '../../../tournaments/entities/tournament.entity';
import { PhaseType } from '../../../common/enums/phase-type.enum';
import { TournamentType } from '@common/enums/tournament-type.enum';

interface TournamentData {
  name: string;
  year: number;
}

export class DummyTournamentSeeder {
  private dataSource: DataSource;
  private tournamentRepo: Repository<Tournament>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.tournamentRepo = dataSource.getRepository(Tournament);
  }

  async seedTournament() {
    console.log('대회 시드 데이터 생성 시작...');

    // 새 대회 생성
    const tournament = this.tournamentRepo.create({
      name: TournamentType.SNU_NARAE,
      year: 2025,
    });

    await this.tournamentRepo.save(tournament);
    console.log(
      `✅ 대회 "${tournament.name}" 생성 완료 (ID: ${tournament.id})`,
    );
  }
}

async function main() {
  try {
    await AppDataSource.initialize();
    const seeder = new DummyTournamentSeeder(AppDataSource);
    await seeder.seedTournament();
  } catch (error) {
    console.error('시드 데이터 생성 중 오류 발생:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// 직접 실행될 때만 main() 호출
if (require.main === module) {
  main();
}
