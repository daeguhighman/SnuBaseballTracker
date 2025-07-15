/**
 * ERA Simulator Usage Examples
 *
 * This file demonstrates how to use the ERA simulator functions
 * to calculate earned runs and ERA for pitchers and teams.
 */

import {
  calcEarnedRuns,
  calculatePitcherERA,
  calculateTeamERA,
  EraSimulationResult,
} from './era-simulator';
import { Play, PlayStatus } from '../../plays/entities/play.entity';
import { PlateAppearanceResult } from '../enums/plate-appearance-result.enum';

/**
 * Example 1: Basic ERA calculation for a pitcher
 */
export function examplePitcherERA() {
  // 실제 사용 시에는 데이터베이스에서 가져온 Play 데이터를 사용
  const pitcherPlays: Partial<Play>[] = [
    {
      id: 1,
      gameId: 1,
      seq: 1,
      batterGpId: 1,
      pitcherGpId: 2,
      resultCode: PlateAppearanceResult.SINGLE,
      status: PlayStatus.COMPLETE,
    },
    {
      id: 2,
      gameId: 1,
      seq: 2,
      batterGpId: 3,
      pitcherGpId: 2,
      resultCode: PlateAppearanceResult.DOUBLE,
      status: PlayStatus.COMPLETE,
    },
    {
      id: 3,
      gameId: 1,
      seq: 3,
      batterGpId: 5,
      pitcherGpId: 2,
      resultCode: PlateAppearanceResult.HOMERUN,
      status: PlayStatus.COMPLETE,
    },
  ];

  // ERA 계산 (9이닝 3실점 가정)
  const era = calculatePitcherERA(pitcherPlays as Play[], 2, 9);
  console.log(`Pitcher ERA: ${era.toFixed(2)}`); // 3.00

  return era;
}

/**
 * Example 2: Team ERA calculation
 */
export function exampleTeamERA() {
  const teamPlays: Partial<Play>[] = [
    {
      id: 1,
      gameId: 1,
      seq: 1,
      batterGpId: 1,
      pitcherGpId: 2, // teamId: 1인 투수
      resultCode: PlateAppearanceResult.HOMERUN,
      status: PlayStatus.COMPLETE,
    },
    {
      id: 2,
      gameId: 1,
      seq: 2,
      batterGpId: 3,
      pitcherGpId: 3, // teamId: 1인 다른 투수
      resultCode: PlateAppearanceResult.SINGLE,
      status: PlayStatus.COMPLETE,
    },
  ];

  // 팀 ERA 계산 (18이닝 2실점 가정)
  const teamEra = calculateTeamERA(teamPlays as Play[], 1, 18);
  console.log(`Team ERA: ${teamEra.toFixed(2)}`); // 1.00

  return teamEra;
}

/**
 * Example 3: Detailed earned run analysis
 */
export function exampleDetailedAnalysis() {
  const plays: Partial<Play>[] = [
    // 실책으로 인한 아웃이 안타로 시뮬레이션되는 경우
    {
      id: 1,
      gameId: 1,
      seq: 1,
      batterGpId: 1,
      pitcherGpId: 2,
      resultCode: PlateAppearanceResult.OUT,
      status: PlayStatus.COMPLETE,
    },
    // 그 다음 타석에서 득점
    {
      id: 2,
      gameId: 1,
      seq: 2,
      batterGpId: 3,
      pitcherGpId: 2,
      resultCode: PlateAppearanceResult.SINGLE,
      status: PlayStatus.COMPLETE,
    },
  ];

  const result: EraSimulationResult = calcEarnedRuns(plays as Play[]);

  console.log('=== ERA Simulation Results ===');
  console.log(`Earned Runs: ${result.earnedRuns}`);
  console.log(`Unearned Runs: ${result.unearnedRuns}`);
  console.log(`Total Runs: ${result.totalRuns}`);

  console.log('\n=== Simulation Details ===');
  result.simulationDetails.forEach((detail, index) => {
    console.log(`Play ${index + 1}:`);
    console.log(`  Original: ${detail.originalResult}`);
    console.log(`  Simulated: ${detail.simulatedResult}`);
    console.log(`  Runs Scored: ${detail.runsScored}`);
    console.log(`  Is Earned: ${detail.isEarned}`);
  });

  return result;
}

/**
 * Example 4: Complex scenario with multiple errors
 */
export function exampleComplexScenario() {
  const plays: Partial<Play>[] = [
    // 1루타
    {
      id: 1,
      gameId: 1,
      seq: 1,
      batterGpId: 1,
      pitcherGpId: 2,
      resultCode: PlateAppearanceResult.SINGLE,
      status: PlayStatus.COMPLETE,
    },
    // 실책으로 인한 아웃 (실제로는 2루타)
    {
      id: 2,
      gameId: 1,
      seq: 2,
      batterGpId: 3,
      pitcherGpId: 2,
      resultCode: PlateAppearanceResult.OUT,
      status: PlayStatus.COMPLETE,
    },
    // 홈런
    {
      id: 3,
      gameId: 1,
      seq: 3,
      batterGpId: 5,
      pitcherGpId: 2,
      resultCode: PlateAppearanceResult.HOMERUN,
      status: PlayStatus.COMPLETE,
    },
  ];

  const result = calcEarnedRuns(plays as Play[]);

  console.log('=== Complex Scenario Results ===');
  console.log(`Earned Runs: ${result.earnedRuns}`); // 3 (1루타 + 2루타 시뮬레이션 + 홈런)
  console.log(`Unearned Runs: ${result.unearnedRuns}`); // 0
  console.log(`Total Runs: ${result.totalRuns}`); // 2 (실제 기록된 득점)

  return result;
}

/**
 * Example 5: Inning reset after errors
 */
export function exampleInningReset() {
  const plays: Partial<Play>[] = [
    // 실책으로 인한 아웃
    {
      id: 1,
      gameId: 1,
      seq: 1,
      batterGpId: 1,
      pitcherGpId: 2,
      resultCode: PlateAppearanceResult.OUT,
      status: PlayStatus.COMPLETE,
    },
    // 정상 아웃
    {
      id: 2,
      gameId: 1,
      seq: 2,
      batterGpId: 2,
      pitcherGpId: 2,
      resultCode: PlateAppearanceResult.OUT,
      status: PlayStatus.COMPLETE,
    },
    // 정상 아웃 (이닝 종료)
    {
      id: 3,
      gameId: 1,
      seq: 3,
      batterGpId: 3,
      pitcherGpId: 2,
      resultCode: PlateAppearanceResult.OUT,
      status: PlayStatus.COMPLETE,
    },
    // 새 이닝에서 홈런
    {
      id: 4,
      gameId: 1,
      seq: 4,
      batterGpId: 4,
      pitcherGpId: 2,
      resultCode: PlateAppearanceResult.HOMERUN,
      status: PlayStatus.COMPLETE,
    },
  ];

  const result = calcEarnedRuns(plays as Play[]);

  console.log('=== Inning Reset Results ===');
  console.log(`Earned Runs: ${result.earnedRuns}`); // 1 (새 이닝의 홈런만)
  console.log(`Unearned Runs: ${result.unearnedRuns}`); // 0
  console.log(`Total Runs: ${result.totalRuns}`); // 1

  return result;
}

// 사용 예시
if (require.main === module) {
  console.log('Running ERA Simulator Examples...\n');

  examplePitcherERA();
  console.log();

  exampleTeamERA();
  console.log();

  exampleDetailedAnalysis();
  console.log();

  exampleComplexScenario();
  console.log();

  exampleInningReset();
}
