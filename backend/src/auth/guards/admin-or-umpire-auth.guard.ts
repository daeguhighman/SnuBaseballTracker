import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppRole } from '@/users/entities/user.entity';
import { Game } from '@/games/entities/game.entity';

@Injectable()
export class AdminOrUmpireAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(AdminOrUmpireAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {
    super();
  }

  async canActivate(context: any) {
    // First ensure JWT authentication
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Admin can access all games
    if (user.role === AppRole.ADMIN) {
      this.logger.debug(
        `AdminOrUmpire Auth Guard - Admin access granted for user: ${user.userId}`,
      );
      return true;
    }

    // For non-admin users, check if they are the assigned umpire for this game
    const gameId = request.params.gameId;
    if (!gameId) {
      this.logger.warn(
        `AdminOrUmpire Auth Guard - No gameId found in request params`,
      );
      throw new ForbiddenException('Game ID is required');
    }

    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['recordUmpire', 'recordUmpire.user'],
    });

    if (!game) {
      this.logger.warn(`AdminOrUmpire Auth Guard - Game not found: ${gameId}`);
      throw new ForbiddenException('Game not found');
    }

    if (!game.recordUmpire || game.recordUmpire.user.id !== user.userId) {
      this.logger.warn(
        `AdminOrUmpire Auth Guard - User ${user.userId} is not authorized for game ${gameId}`,
      );
      throw new ForbiddenException(
        'Access denied. Admin or assigned umpire access required',
      );
    }

    this.logger.debug(
      `AdminOrUmpire Auth Guard - Umpire access granted for user: ${user.userId} on game: ${gameId}`,
    );
    return true;
  }

  handleRequest(err: any, user: any, info: any, context: any) {
    if (err || !user) {
      this.logger.error(
        `AdminOrUmpire Auth Guard - Authentication failed: ${info?.message}`,
      );
      throw err || new ForbiddenException('Authentication required');
    }

    return user;
  }
}
