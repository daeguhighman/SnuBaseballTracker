import { College } from '@/profiles/entities/college.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Player } from '@/players/entities/player.entity';
@Entity('departments')
@Index(['name', 'college'], { unique: true })
export class Department {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 100 }) name!: string; // 예: "화학과"
  @ManyToOne(() => College, (c) => c.departments, { onDelete: 'CASCADE' })
  @JoinColumn()
  college!: Relation<College>;
  @OneToMany(() => Player, (p) => p.department)
  players: Player[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
