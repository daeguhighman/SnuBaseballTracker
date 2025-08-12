import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../entities/game.entity';
import { Umpire } from '@/umpires/entities/umpire.entity';

@Injectable()
export class GameAuthService {
  private readonly logger = new Logger(GameAuthService.name);

  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(Umpire)
    private readonly umpireRepository: Repository<Umpire>,
  ) {}

  async checkUserCanRecord(gameId: number, userId?: string): Promise<boolean> {
    if (!userId) return false;

    try {
      // 해당 경기의 심판인지 확인
      const umpire = await this.umpireRepository.findOne({
        where: { userId: parseInt(userId) },
        relations: ['umpireTournaments'],
      });

      if (!umpire) return false;

      // 해당 경기가 속한 대회의 심판인지 확인
      const game = await this.gameRepository.findOne({
        where: { id: gameId },
        relations: ['tournament'],
      });

      if (!game) return false;

      const isUmpireForGame = umpire.umpireTournaments.some(
        (ut) => ut.tournamentId === game.tournamentId,
      );

      return isUmpireForGame;
    } catch (error) {
      this.logger.error(`Error checking user can record: ${error.message}`);
      return false;
    }
  }

  async checkUserCanSubmitLineup(
    gameId: number,
    userId?: string,
  ): Promise<{ home: boolean; away: boolean }> {
    if (!userId) return { home: false, away: false };

    try {
      // 해당 경기의 팀 대표자인지 확인
      const game = await this.gameRepository.findOne({
        where: { id: gameId },
        relations: ['homeTeam', 'awayTeam', 'homeTeam.team', 'awayTeam.team'],
      });

      if (!game) return { home: false, away: false };

      // 홈팀과 원정팀의 대표자 확인
      const homeTeamTournament = await this.gameRepository.manager
        .getRepository('TeamTournament')
        .findOne({
          where: {
            teamId: game.homeTeam.team.id,
            tournamentId: game.tournamentId,
          },
        });

      const awayTeamTournament = await this.gameRepository.manager
        .getRepository('TeamTournament')
        .findOne({
          where: {
            teamId: game.awayTeam.team.id,
            tournamentId: game.tournamentId,
          },
        });

      const isHomeTeamRep = homeTeamTournament?.representativeUserId === userId;
      const isAwayTeamRep = awayTeamTournament?.representativeUserId === userId;

      return {
        home: isHomeTeamRep,
        away: isAwayTeamRep,
      };
    } catch (error) {
      this.logger.error(
        `Error checking user can submit lineup: ${error.message}`,
      );
      return { home: false, away: false };
    }
  }
}
