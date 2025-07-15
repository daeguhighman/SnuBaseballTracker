import { DataSource } from 'typeorm';
import { Game } from '../entities/game.entity';

export const GameRepository = (dataSource: DataSource) =>
  dataSource.getRepository(Game).extend({
    /**
     * startDate, endDate를 "YYYY-MM-DD" 형태로 받아
     * 내부에서 KST 기준 Date 객체로 변환한 뒤 조회합니다.
     */
    async getGamesBetweenDates(
      startDate: string,
      endDate: string,
    ): Promise<Game[]> {
      const start = new Date(`${startDate}T00:00:00+09:00`);
      const end = new Date(`${endDate}T23:59:59+09:00`);

      return this.createQueryBuilder('g')
        .leftJoinAndSelect('g.homeTeam', 'home')
        .leftJoinAndSelect('g.awayTeam', 'away')
        .leftJoinAndSelect('g.gameStat', 'stat')
        .where('g.start_time BETWEEN :s AND :e', { s: start, e: end })
        .orderBy('g.start_time', 'ASC')
        .getMany();
    },
  });
