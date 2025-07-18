import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToOne,
  Relation,
} from 'typeorm';
import { PlayerTournament } from './player-tournament.entity';
import { TeamTournament } from '@/teams/entities/team-tournament.entity';
import { User } from '@/users/entities/user.entity';
import { College } from '@/profiles/entities/college.entity';
import { Department } from '@/profiles/entities/department.entity';
@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ name: 'email', length: 100 })
  email: string;

  @Column({ name: 'student_id', length: 50 })
  studentId: string;

  @Column({ name: 'birth_date' })
  birthDate: Date;

  @Column({ name: 'phone_number', length: 20 })
  phoneNumber: string;

  @OneToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(
    () => PlayerTournament,
    (playerTournament) => playerTournament.player,
    {
      cascade: ['insert', 'update', 'soft-remove'],
      eager: false,
    },
  )
  playerTournaments: PlayerTournament[];

  /* ───────── 학적/프로필 ───────── */
  @ManyToOne(() => College, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'college_id' })
  college: Relation<College>;

  @ManyToOne(() => Department, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'department_id' })
  department: Relation<Department>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
