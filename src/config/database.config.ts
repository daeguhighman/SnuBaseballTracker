import { registerAs } from '@nestjs/config';
import { Department } from '../players/entities/department.entity';
import { Player } from '@/players/entities/player.entity';
import { PlayerTournament } from '@/players/entities/player-tournament.entity';
import { Team } from '@/teams/entities/team.entity';
import { TeamTournament } from '@/teams/entities/team-tournament.entity';
import { Tournament } from '@/tournaments/entities/tournament.entity';
import { BatterGameStat } from '@/games/entities/batter-game-stat.entity';
import { PitcherGameStat } from '@/games/entities/pitcher-game-stat.entity';
import { BatterGameParticipation } from '@/games/entities/batter-game-participation.entity';
import { PitcherGameParticipation } from '@/games/entities/pitcher-game-participation.entity';
import { GameInningStat } from '@/games/entities/game-inning-stat.entity';
import { Game } from '@/games/entities/game.entity';
import { GameRoaster } from '@/games/entities/game-roaster.entity';
import { Umpire } from '@/umpires/entities/umpire.entity';
import { UmpireTournament } from '@/umpires/entities/umpire-tournament.entity';
import { UmpireEmailCode } from '@/umpires/entities/umpire-email-code.entity';
import { User } from '@/users/entities/user.entity';
import { GameStat } from '@/games/entities/game-stat.entity';
import { BatterStat } from '@/records/entities/batter-stat.entity';
import { PitcherStat } from '@/records/entities/pitcher-stat.entity';

export default registerAs('database', () => {
  const env = process.env.NODE_ENV ?? 'development';

  const flags = {
    isDev: env === 'development',
    isTest: env === 'test',
    isProd: env === 'production',
  };
  return {
    type: 'mysql' as const,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: flags.isTest,
    // dropSchema: flags.isTest,
    logging: flags.isDev || flags.isTest || process.env.LOG_SQL === 'true',

    entities: [
      Department,
      Player,
      PlayerTournament,
      Team,
      TeamTournament,
      Tournament,
      BatterGameStat,
      PitcherGameStat,
      BatterGameParticipation,
      PitcherGameParticipation,
      GameInningStat,
      Game,
      GameStat,
      GameRoaster,
      Umpire,
      UmpireTournament,
      UmpireEmailCode,
      User,
      BatterStat,
      PitcherStat,
    ],
    charset: 'utf8mb4',
  };
});
