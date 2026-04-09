import { Column } from 'typeorm';

export abstract class BaseBatterStat {
  @Column({ name: 'plate_appearances', default: 0 })
  plateAppearances: number;

  @Column({ name: 'at_bats', default: 0 })
  atBats: number;

  @Column({ default: 0 })
  hits: number;

  @Column({ default: 0 })
  singles: number;

  @Column({ default: 0 })
  doubles: number;

  @Column({ default: 0 })
  triples: number;

  @Column({ name: 'home_runs', default: 0 })
  homeRuns: number;

  @Column({ default: 0 })
  walks: number;

  @Column({ name: 'sacrifice_flies', default: 0 })
  sacrificeFlies: number;

  @Column({ name: 'sacrifice_bunts', default: 0 })
  sacrificeBunts: number;

  @Column({ name: 'strikeouts', default: 0 })
  strikeouts: number;

  @Column({ name: 'runs_batted_in', default: 0 })
  runsBattedIn: number;

  @Column({ name: 'runs', default: 0 })
  runs: number;
}
