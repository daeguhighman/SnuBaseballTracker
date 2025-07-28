import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { PhaseType } from '../common/enums/phase-type.enum';

interface TournamentData {
  name: string;
  year: number;
}

export class TournamentSeeder {
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
      name: '스누나래',
      year: 2025,
    });

    await this.tournamentRepo.save(tournament);
    console.log(
      `✅ 대회 "${tournament.name}" 생성 완료 (ID: ${tournament.id})`,
    );
  }
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const seeder = new TournamentSeeder(dataSource);
    await seeder.seedTournament();
  } catch (error) {
    console.error('시드 데이터 생성 중 오류 발생:', error);
  } finally {
    await app.close();
  }
}

main();
