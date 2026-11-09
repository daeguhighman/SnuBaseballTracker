import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Game } from '../entities/game.entity';
import { GameUndoSnapshot } from '../entities/game-undo-snapshot.entity';
import { GameStatus } from '@common/enums/game-status.enum';
import { BaseException } from '@/common/exceptions/base.exception';
import { ErrorCodes } from '@/common/exceptions/error-codes.enum';
import { Play, PlayStatus } from '@/plays/entities/play.entity';
import { GameStatsService } from './game-stats.service';
import { GameCoreService } from './game-core.service';
import {
  GAME_RECORD_TABLES as TABLES,
  deleteGameRecords,
  withoutForeignKeyChecks,
} from './game-record-tables';

/** 되돌릴 수 있는 최대 횟수 */
const MAX_UNDO = 10;

type Rows = Record<string, any>[];

// JSON으로 저장할 때 Date가 문자열이 되지 않도록 표시해 둔다
const encode = (value: any) =>
  value instanceof Date ? { $date: value.toISOString() } : value;
const decode = (value: any) =>
  value && typeof value === 'object' && '$date' in value
    ? new Date(value.$date)
    : value;

@Injectable()
export class GameUndoService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly gameStatsService: GameStatsService,
    private readonly gameCoreService: GameCoreService,
  ) {}

  /**
   * 기록을 바꾸기 직전에 호출한다. 기록과 같은 트랜잭션 안에서 불러야
   * 기록이 실패했을 때 스냅샷도 함께 취소된다.
   */
  async capture(manager: EntityManager, gameId: number, label: string) {
    const data: Record<string, Rows> = {};
    for (const table of TABLES) {
      const rows: Rows = await manager.query(
        `SELECT * FROM \`${table.name}\` WHERE ${table.where}`,
        [gameId],
      );
      data[table.name] = rows.map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key, encode(value)]),
        ),
      );
    }

    await manager.insert(GameUndoSnapshot, {
      gameId,
      label,
      data: JSON.stringify(data),
    });

    const stale = await manager.find(GameUndoSnapshot, {
      select: ['id'],
      where: { gameId },
      order: { id: 'DESC' },
      skip: MAX_UNDO,
      take: 1000,
    });
    if (stale.length > 0) {
      await manager.delete(
        GameUndoSnapshot,
        stale.map((s) => s.id),
      );
    }
  }

  /** 되돌릴 수 있는 기록 수와 가장 최근 기록 종류 */
  async getStatus(gameId: number) {
    const repo = this.dataSource.getRepository(GameUndoSnapshot);
    const [latest, count] = await Promise.all([
      repo.findOne({
        select: ['id', 'label'],
        where: { gameId },
        order: { id: 'DESC' },
      }),
      repo.count({ where: { gameId } }),
    ]);
    return { count, lastLabel: latest?.label ?? null };
  }

  /** 가장 최근 기록 직전 상태로 되돌린다. */
  async undo(gameId: number) {
    let livePlayId: number | null = null;

    const result = await this.dataSource.transaction(async (manager) => {
      const game = await manager.findOne(Game, {
        where: { id: gameId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!game) {
        throw new BaseException(
          `게임 ID ${gameId}를 찾을 수 없습니다.`,
          ErrorCodes.GAME_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      if (game.status !== GameStatus.IN_PROGRESS) {
        throw new BaseException(
          '진행 중인 경기만 되돌릴 수 있습니다.',
          ErrorCodes.GAME_NOT_IN_PROGRESS,
          HttpStatus.BAD_REQUEST,
        );
      }

      const snapshot = await manager.findOne(GameUndoSnapshot, {
        where: { gameId },
        order: { id: 'DESC' },
      });
      if (!snapshot) {
        throw new BaseException(
          '되돌릴 기록이 없습니다.',
          ErrorCodes.NOTHING_TO_UNDO,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.restore(manager, gameId, JSON.parse(snapshot.data));
      await manager.delete(GameUndoSnapshot, snapshot.id);

      const livePlay = await manager.findOne(Play, {
        where: { gameId, status: PlayStatus.LIVE },
        order: { seq: 'DESC' },
      });
      const latestPlay =
        livePlay ??
        (await manager.findOne(Play, {
          where: { gameId },
          order: { seq: 'DESC' },
        }));
      livePlayId = latestPlay?.id ?? null;

      return {
        success: true,
        message: `직전 기록(${snapshot.label})을 취소했습니다.`,
        snapshot: livePlayId
          ? await this.gameStatsService.makePlaySnapshotUmpire(
              gameId,
              livePlayId,
              manager,
            )
          : null,
      };
    });

    if (livePlayId) {
      await this.gameCoreService.pushSnapshotAudience(gameId, livePlayId);
    }
    return result;
  }

  private async restore(
    manager: EntityManager,
    gameId: number,
    data: Record<string, Rows>,
  ) {
    // 삭제 후 원래 id 그대로 다시 넣는다
    await withoutForeignKeyChecks(manager, async () => {
      await deleteGameRecords(manager, gameId);
      for (const table of TABLES) {
        for (const row of data[table.name] ?? []) {
          const columns = Object.keys(row);
          await manager.query(
            `INSERT INTO \`${table.name}\` (${columns
              .map((c) => `\`${c}\``)
              .join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
            columns.map((c) => decode(row[c])),
          );
        }
      }
    });
  }
}
