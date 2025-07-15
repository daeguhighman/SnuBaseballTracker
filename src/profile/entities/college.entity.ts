import { Player } from '@/players/entities/player.entity';
import { Department } from './department.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

@Entity('colleges')
export class College {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 100 }) name!: string; // 예: "사회과학대학"
  @OneToMany(() => Department, (d) => d.college) departments!: Relation<
    Department[]
  >;
  @OneToMany(() => Player, (p) => p.college) players!: Relation<Player[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
