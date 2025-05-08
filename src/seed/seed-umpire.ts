import { AppDataSource } from '../../data-source';
import {
  seedGame,
  seedGameSchedule,
  seedTeams,
  seedTournament,
  seedUmpiresGames,
  seedUmpires,
  seedUsers,
} from './seedTestData';
async function setupUmpire() {
  await AppDataSource.initialize();
  await AppDataSource.manager.transaction(
    async (transactionalEntityManager) => {
      const users = await seedUsers();
      const umpires = await seedUmpires(users);
      const tournament = await seedTournament(transactionalEntityManager);
      const teams = await seedTeams(transactionalEntityManager);
      const games = await seedGameSchedule(
        transactionalEntityManager,
        teams,
        tournament,
      );
      await seedUmpiresGames(umpires, games);
    },
  );
  await AppDataSource.destroy();
}

setupUmpire();
