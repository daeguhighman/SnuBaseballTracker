import { Injectable, ExecutionContext, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Umpire } from '@umpires/entities/umpire.entity';
import { Game } from '@games/entities/game.entity';
import { ErrorCodes } from '@/common/exceptions/error-codes.enum';
import { BaseException } from '@/common/exceptions/base.exception';
@Injectable()
export class UmpireAuthGuard extends AuthGuard('jwt') {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {
    super();
  }

  async canActivate(ctx: ExecutionContext) {
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    const ok = await super.canActivate(ctx);
    if (!ok) return false;

    const req = ctx.switchToHttp().getRequest();
    const { role, umpireId } = req.user; // ← JWT payload
    if (role !== 'UMPIRE')
      throw new BaseException(
        '심판 전용',
        ErrorCodes.FORBIDDEN,
        HttpStatus.FORBIDDEN,
      );

    const gameId = +req.params.gameId;
    const row = await this.gameRepository.findOne({
      where: { id: gameId },
    });
    if (!row || row.recordUmpireId !== umpireId)
      throw new BaseException(
        '이 경기에 배정된 심판이 아닙니다.',
        ErrorCodes.FORBIDDEN,
        HttpStatus.FORBIDDEN,
      );

    return true;
  }
}
