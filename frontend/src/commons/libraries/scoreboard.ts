// 스코어보드 칸 계산. 정규 이닝은 7회, 동점이면 8회부터 승부치기로 이닝이 늘어난다.
export const REGULAR_INNINGS = 7;

/** 표시할 이닝 수: 최소 7회, 승부치기로 진행된 이닝이 있으면 그만큼 */
export const inningCountOf = (innings?: { inning?: number }[] | null) =>
  Math.max(REGULAR_INNINGS, ...(innings ?? []).map((i) => Number(i?.inning) || 0));

/** 이닝 칸 + R, H 칸 */
export const emptyScoreRow = (inningCount: number = REGULAR_INNINGS) =>
  Array(inningCount + 2).fill("");

/** 헤더: ["", "1", …, "n", "R", "H"] */
export const scoreboardHeaders = (inningCount: number) => [
  "",
  ...Array.from({ length: inningCount }, (_, i) => String(i + 1)),
  "R",
  "H",
];

/** 점수 행 길이에서 이닝 수를 거꾸로 구한다 (R, H 두 칸 제외) */
export const inningCountOfRow = (row: unknown[]) =>
  Math.max(REGULAR_INNINGS, row.length - 2);
