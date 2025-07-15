import { Play, PlayStatus } from '@/plays/entities/play.entity';
import { BasePos } from '@/plays/entities/runner-event-entity';
import { PlateAppearanceResult } from '@/common/enums/plate-appearance-result.enum';

export interface EraSimulationResult {
  earnedRuns: number; // 자책점
  unearnedRuns: number; // 비자책점
  totalRuns: number; // 총 실점
  simulationDetails: SimulationDetail[];
}

export interface SimulationDetail {
  playId: number;
  originalResult: PlateAppearanceResult | null; // 원래 결과
  simulatedResult: PlateAppearanceResult | null; // 시뮬레이션 결과
  runnersBefore: BasePos[]; // 시뮬레이션 전 베이스 상황
  runnersAfter: BasePos[]; // 시뮬레이션 후 베이스 상황
  runsScored: number; // 시뮬레이션 결과 자책점
  isEarned: boolean; // 자책점 여부
}

export function calcEarnedRuns(plays: Play[]): EraSimulationResult {
  const simulationDetails: SimulationDetail[] = [];
  let earnedRuns = 0;
  let unearnedRuns = 0;
  let totalRuns = 0;

  // 현재 베이스 상황을 추적
  let currentBases: BasePos[] = ['O', 'O', 'O']; // 1루, 2루, 3루
  let outs = 0;
  let inning = 1;
  let isErrorInning = false;

  for (const play of plays) {
    if (play.status !== PlayStatus.COMPLETE) continue;

    const playRunnerEvents = play.runnerEvents || [];
    const originalRuns = playRunnerEvents.filter(
      (re) => re.isActual && re.endBase === 'H',
    ).length;

    // 실책이 있는 타석인지 확인
    const hasError = playRunnerEvents.some((re) => re.isActual);

    if (hasError) {
      isErrorInning = true;
    }

    // 실책이 없는 상황에서의 시뮬레이션
    const simulatedResult = simulatePlayWithoutError(play, currentBases, outs);

    // 시뮬레이션된 주자 이동 계산
    const simulatedRunners = simulateRunnerMovement(
      simulatedResult,
      currentBases,
      outs,
    );

    const simulatedRuns = simulatedRunners.runsScored;
    const isEarned = !isErrorInning || simulatedRuns > 0;

    // 결과 기록
    simulationDetails.push({
      playId: play.id,
      originalResult: play.resultCode,
      simulatedResult: simulatedResult,
      runnersBefore: [...currentBases],
      runnersAfter: simulatedRunners.bases,
      runsScored: simulatedRuns,
      isEarned: isEarned,
    });

    // 베이스 상황 업데이트
    currentBases = simulatedRunners.bases;
    outs = simulatedRunners.outs;

    // 이닝 종료 체크
    if (outs >= 3) {
      currentBases = ['O', 'O', 'O'];
      outs = 0;
      inning++;
      isErrorInning = false; // 새 이닝에서는 실책 이닝 아님
    }

    // 득점 카운트
    if (isEarned) {
      earnedRuns += simulatedRuns;
    } else {
      unearnedRuns += simulatedRuns;
    }
    totalRuns += originalRuns;
  }

  return {
    earnedRuns,
    unearnedRuns,
    totalRuns,
    simulationDetails,
  };
}

function simulatePlayWithoutError(
  play: Play,
  currentBases: BasePos[],
  outs: number,
): PlateAppearanceResult | null {
  const result = play.resultCode;

  if (!result) return null;

  // 실책으로 인한 결과를 정상적인 결과로 변환
  switch (result) {
    case PlateAppearanceResult.OUT:
      // 실책으로 인한 아웃이었다면 안타나 볼넷으로 처리
      return PlateAppearanceResult.SINGLE;

    case PlateAppearanceResult.FIELDERS_CHOICE:
      // 야수선택은 보통 안타로 처리
      return PlateAppearanceResult.SINGLE;

    case PlateAppearanceResult.STRIKEOUT_DROP:
      // 낫아웃은 볼넷으로 처리
      return PlateAppearanceResult.WALK;

    default:
      // 다른 결과들은 그대로 유지
      return result;
  }
}

function simulateRunnerMovement(
  result: PlateAppearanceResult | null,
  currentBases: BasePos[],
  outs: number,
): { bases: BasePos[]; runsScored: number; outs: number } {
  if (!result) {
    return { bases: [...currentBases], runsScored: 0, outs };
  }

  let newBases: BasePos[] = [...currentBases];
  let runsScored = 0;
  let newOuts = outs;

  switch (result) {
    case PlateAppearanceResult.SINGLE:
      // 3루 주자가 홈으로
      if (newBases[2] !== 'O') {
        runsScored++;
        newBases[2] = 'O';
      }
      // 2루 주자가 3루로
      if (newBases[1] !== 'O') {
        newBases[2] = newBases[1];
        newBases[1] = 'O';
      }
      // 1루 주자가 2루로
      if (newBases[0] !== 'O') {
        newBases[1] = newBases[0];
        newBases[0] = 'O';
      }
      // 타자가 1루로
      newBases[0] = '1';
      break;

    case PlateAppearanceResult.DOUBLE:
      // 3루, 2루 주자가 홈으로
      if (newBases[2] !== 'O') {
        runsScored++;
        newBases[2] = 'O';
      }
      if (newBases[1] !== 'O') {
        runsScored++;
        newBases[1] = 'O';
      }
      // 1루 주자가 3루로
      if (newBases[0] !== 'O') {
        newBases[2] = newBases[0];
        newBases[0] = 'O';
      }
      // 타자가 2루로
      newBases[1] = '2';
      break;

    case PlateAppearanceResult.TRIPLE:
      // 모든 주자가 홈으로
      for (let i = 0; i < 3; i++) {
        if (newBases[i] !== 'O') {
          runsScored++;
          newBases[i] = 'O';
        }
      }
      // 타자가 3루로
      newBases[2] = '3';
      break;

    case PlateAppearanceResult.HOMERUN:
      // 모든 주자 + 타자가 홈으로
      for (let i = 0; i < 3; i++) {
        if (newBases[i] !== 'O') {
          runsScored++;
          newBases[i] = 'O';
        }
      }
      runsScored++; // 타자 득점
      break;

    case PlateAppearanceResult.WALK:
      // 볼넷 - 주자들이 한 베이스씩 진루
      if (newBases[0] !== 'O' && newBases[1] !== 'O' && newBases[2] !== 'O') {
        // 만루 상황에서는 3루 주자가 홈으로
        runsScored++;
        newBases[2] = 'O';
      }
      if (newBases[0] !== 'O' && newBases[1] !== 'O') {
        newBases[2] = newBases[1];
        newBases[1] = newBases[0];
        newBases[0] = '1';
      } else if (newBases[0] !== 'O') {
        newBases[1] = newBases[0];
        newBases[0] = '1';
      } else {
        newBases[0] = '1';
      }
      break;

    case PlateAppearanceResult.SACRIFICE_FLY:
      // 희생플라이 - 3루 주자가 홈으로
      if (newBases[2] !== 'O') {
        runsScored++;
        newBases[2] = 'O';
      }
      newOuts++;
      break;

    case PlateAppearanceResult.STRIKEOUT:
    case PlateAppearanceResult.OUT:
      newOuts++;
      break;

    default:
      // 기타 결과는 아웃으로 처리
      newOuts++;
      break;
  }

  return { bases: newBases, runsScored, outs: newOuts };
}

// 특정 투수의 ERA 계산
export function calculatePitcherERA(
  plays: Play[],
  pitcherGpId: number,
  inningsPitched: number,
): number {
  const pitcherPlays = plays.filter(
    (play) =>
      play.pitcherGpId === pitcherGpId && play.status === PlayStatus.COMPLETE,
  );

  const result = calcEarnedRuns(pitcherPlays);

  if (inningsPitched === 0) return 0;

  // ERA = (자책점 × 9) ÷ 이닝수
  return (result.earnedRuns * 9) / inningsPitched;
}

// 팀 ERA 계산
export function calculateTeamERA(
  plays: Play[],
  teamId: number,
  totalInnings: number,
): number {
  // 팀의 모든 투수 플레이 필터링
  const teamPlays = plays.filter(
    (play) =>
      play.status === PlayStatus.COMPLETE && play.pitcher?.teamId === teamId,
  );

  const result = calcEarnedRuns(teamPlays);

  if (totalInnings === 0) return 0;

  return (result.earnedRuns * 9) / totalInnings;
}
