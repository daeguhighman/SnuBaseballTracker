import { Game } from '@/games/entities/game.entity';
import {
  ForbiddenException,
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UmpireAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const gameId = +req.params.gameId;
    const user = req.user;

    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['recordUmpire', 'recordUmpire.user'],
    });

    if (!game || !game.recordUmpire || game.recordUmpire.user.id !== user.id) {
      throw new ForbiddenException();
    }

    return true;
  }
}
