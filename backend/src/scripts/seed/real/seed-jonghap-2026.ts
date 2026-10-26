import { AppDataSource } from '../../../../data-source';
import { TournamentType } from '../../../common/enums/tournament-type.enum';
import { GameStatus } from '../../../common/enums/game-status.enum';
import { MatchStage } from '../../../common/enums/match-stage.enum';
import { Game } from '../../../games/entities/game.entity';
import { BracketTeam, SeedAllRunner } from './seed-all';

/**
 * 2026 종합체육대회 시딩: 대회, 팀(조 편성), 선수, 조별 리그 경기.
 * 8강 이후 경기는 대진이 정해진 뒤 어드민 UI에서 등록한다.
 *
 * 선수 명단 엑셀은 개인정보(학번)가 있어 저장소에 두지 않는다.
 *   SEED_EXCEL_PATH=/path/to/2026-jonghap.xlsx node dist/src/scripts/seed/real/seed-jonghap-2026.js
 */

// 2026_야구_대표자회의용_일정표 기준. 팀 이름은 화면에서 6자를 넘으면 잘리므로 약칭 사용.
const GROUPS: Record<string, string[]> = {
  A: ['법대', '사회대B', '몽키스패너즈', '포톤스A'],
  B: ['GSM', '룰루', '허니비즈', '미&워'],
  C: ['사회대A', '관악사', '포톤스B', '재료공'],
  D: ['소울즈', '공화공', '로스쿨', '테니스부'],
};

const TEAMS: BracketTeam[] = Object.entries(GROUPS).flatMap(([groupName, names]) =>
  names.map((name) => ({ name, groupName })),
);

// [날짜, 시각(KST), 선공(away), 후공(home)] — 일정표의 'A vs B'에서 앞 팀이 선공
const LEAGUE_GAMES: [string, string, string, string][] = [
  ['2026-10-26', '19:30', '법대', '사회대B'],
  ['2026-10-27', '20:30', '몽키스패너즈', '포톤스A'],
  ['2026-10-28', '19:30', 'GSM', '룰루'],
  ['2026-10-29', '20:30', '허니비즈', '미&워'],
  ['2026-10-30', '19:30', '사회대A', '관악사'],
  ['2026-10-31', '14:00', '포톤스B', '재료공'],
  ['2026-10-31', '19:00', '소울즈', '공화공'],
  ['2026-11-01', '09:00', '로스쿨', '테니스부'],
  ['2026-11-01', '11:30', '법대', '몽키스패너즈'],
  ['2026-11-01', '14:00', '사회대B', '포톤스A'],
  ['2026-11-01', '16:30', 'GSM', '허니비즈'],
  ['2026-11-01', '19:00', '룰루', '미&워'],
  ['2026-11-02', '19:30', '사회대A', '포톤스B'],
  ['2026-11-03', '20:30', '관악사', '재료공'],
  ['2026-11-04', '19:30', '소울즈', '로스쿨'],
  ['2026-11-05', '20:30', '공화공', '테니스부'],
  ['2026-11-06', '19:30', '법대', '포톤스A'],
  ['2026-11-07', '14:00', '사회대B', '몽키스패너즈'],
  ['2026-11-07', '16:30', 'GSM', '미&워'],
  ['2026-11-07', '19:00', '룰루', '허니비즈'],
  ['2026-11-08', '11:30', '사회대A', '재료공'],
  ['2026-11-08', '14:00', '관악사', '포톤스B'],
  ['2026-11-08', '16:30', '소울즈', '테니스부'],
  ['2026-11-08', '19:00', '공화공', '로스쿨'],
];

async function main() {
  const excelPath = process.env.SEED_EXCEL_PATH;
  if (!excelPath) {
    throw new Error('SEED_EXCEL_PATH 환경변수로 선수 명단 엑셀 경로를 지정하세요');
  }

  await AppDataSource.initialize();
  try {
    const runner = new SeedAllRunner(AppDataSource);
    const tournament = await runner.ensureTournament(TournamentType.JONGHAP, 2026);
    const teamMap = await runner.seedTeams(tournament, TEAMS);
    await runner.seedPlayers(tournament, teamMap, excelPath);

    console.log('\n--- 조별 리그 경기 시딩 ---');
    const gameRepo = AppDataSource.getRepository(Game);
    let created = 0;
    let skipped = 0;
    for (const [date, time, away, home] of LEAGUE_GAMES) {
      const awayTeam = teamMap.get(away);
      const homeTeam = teamMap.get(home);
      if (!awayTeam || !homeTeam) {
        throw new Error(`팀을 찾을 수 없음: ${away} vs ${home}`);
      }
      // 실행 환경 타임존과 무관하게 KST로 해석
      const startTime = new Date(`${date}T${time}:00+09:00`);

      const exists = await gameRepo.findOne({
        where: {
          tournament: { id: tournament.id },
          awayTeam: { id: awayTeam.id },
          homeTeam: { id: homeTeam.id },
          startTime,
        },
      });
      if (exists) {
        skipped++;
        continue;
      }

      await gameRepo.save(
        gameRepo.create({
          tournament,
          awayTeam,
          homeTeam,
          startTime,
          status: GameStatus.SCHEDULED,
          stage: MatchStage.LEAGUE,
        }),
      );
      console.log(`  + ${date} ${time} ${away}(선공) vs ${home}(후공)`);
      created++;
    }
    console.log(`✅ 경기 시딩 완료 (생성 ${created} / 기존 ${skipped})`);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('시딩 중 오류:', err);
    process.exit(1);
  });
}
