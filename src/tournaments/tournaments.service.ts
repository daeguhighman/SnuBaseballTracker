import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from './entities/tournament.entity';
import {
  TournamentListResponseDto,
  TournamentDto,
} from './dtos/tournament.dto';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
  ) {}

  async getAllTournaments(): Promise<TournamentListResponseDto> {
    const tournaments = await this.tournamentRepository.find({
      order: {
        year: 'DESC',
        createdAt: 'DESC',
      },
    });

    const tournamentDtos: TournamentDto[] = tournaments.map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      year: tournament.year,
    }));

    return {
      tournaments: tournamentDtos,
      count: tournamentDtos.length,
    };
  }
}
