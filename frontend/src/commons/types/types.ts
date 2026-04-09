export interface SelectedPlayer {
  name: string;
  playerId: number;
  wc?: string;
  originalIndex?: number; // ← 새로 들어간 필드
}
