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

    const isAssigned = await this.gameRepository
      .createQueryBuilder('g')
      .innerJoin('g.umpireAssignments', 'gu', 'gu.userId = :uid', {
        uid: user.id,
      })
      .where('g.id = :gid', { gid: gameId })
      .getExists(); // ⬅️ TypeORM v0.3: TRUE/FALSE 한 방

    if (!isAssigned) throw new ForbiddenException();
    return true;
  }
}
