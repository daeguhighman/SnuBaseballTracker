import { PlayerTournament } from '@/players/entities/player-tournament.entity';
import { AppDataSource } from 'data-source';
import { readFileSync } from 'fs';
import { join } from 'path';
import { EntityManager } from 'typeorm';
import { parse as parseCSV } from 'csv-parse/sync';

async function seedPlayerTournament(transactionalEntityManager: EntityManager) {
  const playerTournamentRepo =
    transactionalEntityManager.getRepository(PlayerTournament);
  const csvPath = join(__dirname, 'csv', 'player-tournaments.csv');
  const records = parseCSV(readFileSync(csvPath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<{ player_id: number; tournament_id: number }>;
  for (const { player_id, tournament_id } of records) {
    await playerTournamentRepo.save(
      playerTournamentRepo.create({
        player: { id: player_id },
        tournament: { id: tournament_id },
      }),
    );
  }
}
async function main() {
  await AppDataSource.initialize();
  await AppDataSource.transaction(async (transactionalEntityManager) => {
    await seedPlayerTournament(transactionalEntityManager);
  });
  await AppDataSource.destroy();
}

main();
