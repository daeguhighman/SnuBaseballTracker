// __tests__/game-core.service.spec.ts
import { GameCoreService } from './game-core.service';
import { GameRepository } from '@games/repositories/game.repository'; // 실제 타입
import { DateUtils } from '@common/utils/date.utils';
import { mapGameToDto } from '@games/mappers/game.mapper';
import { Game } from '@games/entities/game.entity';

describe('GameCoreService.getSchedules (classic-core / mock-boundary)', () => {
  let sut: GameCoreService; // System Under Test
  const repoMock = { getGamesBetweenDates: jest.fn() };

  // ──────────────────────────────────────────────────────────
  // 1️⃣ 공통 준비
  // ──────────────────────────────────────────────────────────
  beforeEach(() => {
    jest.resetAllMocks();
    sut = new GameCoreService(
      {} as any, // dataSource (미사용)
      {} as any, // gameStatsService (미사용)
      repoMock as any, // 게임 저장소만 격리
      {} as any,
      {} as any,
    );
  });

  // ──────────────────────────────────────────────────────────
  // 2️⃣ “행복 경로” 시나리오
  // ──────────────────────────────────────────────────────────
  it('returns DTOs grouped by KST date', async () => {
    // given
    const start = '2025-06-09';
    const end = '2025-06-10';

    const gameA = {
      id: 101,
      startTime: new Date('2025-06-09T12:00:00+09:00'),
      tournamentId: 1,
      homeTeamId: 1,
      awayTeamId: 2,
      status: 'SCHEDULED',
      stage: 'LEAGUE',
      isForfeit: false,
      gameStat: null,
      homeTeam: { id: 1, name: 'Team A' },
      awayTeam: { id: 2, name: 'Team B' },
    } as Game;

    const gameB = {
      ...gameA,
      id: 102,
      startTime: new Date('2025-06-10T15:30:00+09:00'),
    } as Game;
    repoMock.getGamesBetweenDates.mockResolvedValue([gameA, gameB]);

    // when
    const result = await sut.getSchedules(start, end);

    // then – “무엇”이 나왔는지만 검증
    expect(result).toEqual({
      range: {
        from: DateUtils.formatKst(new Date('2025-06-09T00:00:00+09:00')),
        to: DateUtils.formatKst(new Date('2025-06-10T23:59:59+09:00')),
      },
      days: [
        {
          date: '2025-06-09',
          dayOfWeek: DateUtils.getKstDayOfWeek(new Date('2025-06-09')),
          games: [mapGameToDto(gameA)],
        },
        {
          date: '2025-06-10',
          dayOfWeek: DateUtils.getKstDayOfWeek(new Date('2025-06-10')),
          games: [mapGameToDto(gameB)],
        },
      ],
    });

    // 경계 호출만 **명세**한다
    expect(repoMock.getGamesBetweenDates).toHaveBeenCalledWith(start, end);
  });

  // ──────────────────────────────────────────────────────────
  // 3️⃣ 빈 결과 시나리오
  // ──────────────────────────────────────────────────────────
  it('returns empty days when no games exist', async () => {
    repoMock.getGamesBetweenDates.mockResolvedValue([]);

    const result = await sut.getSchedules('2025-06-09', '2025-06-10');

    expect(result.days).toHaveLength(0);
  });
});
