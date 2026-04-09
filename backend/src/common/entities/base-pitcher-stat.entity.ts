import { Column } from 'typeorm';

export abstract class BasePitcherStat {
  @Column({ default: 0, name: 'ip_outs' })
  inningPitchedOuts: number;

  @Column({ default: 0, name: 'strikeouts' })
  strikeouts: number;

  @Column({ default: 0, name: 'walks' })
  walks: number;

  @Column({ default: 0, name: 'allowed_hits' })
  allowedHits: number;

  @Column({ default: 0, name: 'allowed_runs' })
  allowedRuns: number;
}
