import { AppDataSource } from '../../data-source';
import {
  seedDepartments,
  seedGameSchedule,
  seedUmpire,
  seedUmpireGame,
  seedUser,
} from './seedTestData';
import { seedTeams } from './seedTestData';
import { seedTournament } from './seedTestData';
import { seedPlayers } from './seedTestData';
import { seedPlayerTournaments } from './seedTestData';
import { seedBatterStats } from './seedTestData';
import { seedPitcherStats } from './seedTestData';
import { seedTeamTournaments } from './seedTestData';

export async function seedInit() {
  await AppDataSource.initialize();

  await AppDataSource.manager.transaction(
    async (transactionalEntityManager) => {
      const user = await seedUser(transactionalEntityManager);
      const umpire = await seedUmpire(transactionalEntityManager, user);
      const departments = await seedDepartments(transactionalEntityManager);
      const teams = await seedTeams(transactionalEntityManager);
      const tournament = await seedTournament(transactionalEntityManager);

      const { team1Players, team2Players } = await seedPlayers(
        [teams[0], teams[1]],
        departments,
        transactionalEntityManager,
      );

      await seedTeamTournaments(transactionalEntityManager, teams, tournament);

      const playerTournaments = await seedPlayerTournaments(
        [...team1Players, ...team2Players],
        tournament,
        transactionalEntityManager,
      );
      await seedPitcherStats(transactionalEntityManager, playerTournaments);
      await seedBatterStats(transactionalEntityManager, playerTournaments);

      const games = await seedGameSchedule(
        transactionalEntityManager,
        teams,
        tournament,
      );
      await seedUmpireGame(transactionalEntityManager, umpire, games[0]);
    },
  );

  await AppDataSource.destroy();
}

seedInit();
