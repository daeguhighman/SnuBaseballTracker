import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GameStatus } from '@/common/enums/game-status.enum';

@Injectable()
export class SubmitLineupGuard implements CanActivate {
  constructor(private readonly db: DataSource) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const gameId = +req.params.gameId; // /games/:gameId/lineup
    const teamType = (req.query.teamType as string)?.toLowerCase(); // home | away
    const userId = req.user.userId;

    /* 0) teamType 유효성 */
    if (!['home', 'away'].includes(teamType)) {
      throw new ForbiddenException('teamType은 home 또는 away여야 합니다.');
    }

    /* 1) 경기 기본 정보 조회 */
    const row = await this.db
      .createQueryBuilder()
      .select([
        'g.status               AS status',
        'g.homeTeamTournamentId AS homeTtId',
        'g.awayTeamTournamentId AS awayTtId',
        'g.recordUmpireId       AS umpireId',
      ])
      .from('games', 'g')
      .where('g.id = :gid', { gid: gameId })
      .getRawOne<{
        status: GameStatus | null;
        homeTtId: number | null;
        awayTtId: number | null;
        umpireId: number | null;
      }>();

    if (!row) throw new NotFoundException('경기를 찾을 수 없습니다.');
    if (row.status !== GameStatus.SCHEDULED) {
      throw new ForbiddenException(
        '경기 시작 후에는 라인업을 수정할 수 없습니다.',
      );
    }

    /* 2) 라인업 제출하려는 쪽(teamType)에 맞는 팀토너먼트 FK 고르기 */
    const targetTtId = teamType === 'home' ? row.homeTtId : row.awayTtId;

    /* 3) 권한 확인: 팀 대표자이거나 배정된 심판인지 확인 */

    // 3-1) 팀 대표자인지 확인
    const isRepresentative = await this.db
      .createQueryBuilder()
      .select('1')
      .from('team_tournaments', 'tt')
      .where('tt.id = :ttId', { ttId: targetTtId })
      .andWhere('tt.representative_user_id = :uid', { uid: userId })
      .getExists();

    // 3-2) 배정된 심판인지 확인
    let isAssignedUmpire = false;
    if (row.umpireId) {
      isAssignedUmpire = await this.db
        .createQueryBuilder()
        .select('1')
        .from('umpires', 'u')
        .where('u.id = :umpireId', { umpireId: row.umpireId })
        .andWhere('u.user_id = :uid', { uid: userId })
        .getExists();
    }

    // 3-3) 둘 다 아닌 경우 접근 거부
    if (!isRepresentative && !isAssignedUmpire) {
      throw new ForbiddenException(
        `해당 팀(${teamType})의 대표자이거나 배정된 심판이 아닙니다.`,
      );
    }

    return true; // ✅ 권한 통과
  }
}
