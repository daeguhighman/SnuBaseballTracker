import { registerAs } from '@nestjs/config';
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
import { EmailCode } from '@/mail/entities/email-code.entity';
import { User } from '@/users/entities/user.entity';
import { GameStat } from '@/games/entities/game-stat.entity';
import { BatterStat } from '@/records/entities/batter-stat.entity';
import { PitcherStat } from '@/records/entities/pitcher-stat.entity';
import { Department } from '@/profiles/entities/department.entity';
import { College } from '@/profiles/entities/college.entity';
import { UserProfile } from '@/profiles/entities/profile.entity';
// import { PlayerEntry } from '@/tournaments/entities/player-entry.entity';
// import { UmpireEntry } from '@/tournaments/entities/umpire-entry.entity';
import { Session } from '@/sessions/entities/session.entity';
import { PasswordResetToken } from '@/mail/entities/password-reset-token.entity';
import { Play } from '@/plays/entities/play.entity';
import { RunnerEvent } from '@/plays/entities/runner-event.entity';
import { Runner } from '@/plays/entities/runner.entity';
import { VirtualInningStat } from '@/games/entities/virtual-inning-stat.entity';
import { VirtualRunner } from '@/plays/entities/virtual-runner.entity';

export default registerAs('database', () => {
  const env = process.env.NODE_ENV ?? 'development';

  const flags = {
    isDev: env === 'development',
    isTest: env === 'test',
    isProd: env === 'production',
  };
  console.log('DB_USERNAME:', process.env.DB_USERNAME);
  console.log('DB_DATABASE:', process.env.DB_DATABASE);
  return {
    type: 'mysql' as const,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: true, // 개발/테스트 환경에서만 동기화
    dropSchema: false,

    entities: [
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
      VirtualInningStat,
      Game,
      GameStat,
      GameRoaster,
      Umpire,
      UmpireTournament,
      EmailCode,
      User,
      BatterStat,
      PitcherStat,
      Department,
      College,
      UserProfile,
      Session,
      PasswordResetToken,
      Play,
      RunnerEvent,
      Runner,
      VirtualRunner,
    ],
    charset: 'utf8mb4',
  };
});
