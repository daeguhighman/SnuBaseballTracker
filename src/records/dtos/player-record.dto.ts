export class BatterRecord {
  playerName: string;
  teamName: string;
  AB: number;
  H: number;
  '2B': number;
  '3B': number;
  HR: number;
  BB: number;
  AVG: number;
  OBP: number;
  SLG: number;
  OPS: number;
}

export class BatterRecordsResponse {
  count: number;
  batters: BatterRecord[];
}

export class PitcherRecord {
  playerName: string;
  teamName: string;
  K: number;
}

export class PitcherRecordsResponse {
  count: number;
  pitchers: PitcherRecord[];
}
