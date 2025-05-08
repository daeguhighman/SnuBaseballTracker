import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  RelationId,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  Column,
  OneToMany,
} from 'typeorm';
import { User } from '@users/entities/user.entity';
import { Game } from '@games/entities/game.entity';
import { UmpireTournament } from './umpire-tournament.entity';
@Entity('umpires')
export class Umpire {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Game, (game) => game.recordUmpire)
  games: Game[];

  @Column({ name: 'user_id' })
  userId: number;

  @OneToMany(() => UmpireTournament, (t) => t.umpire)
  umpireTournaments: UmpireTournament[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
