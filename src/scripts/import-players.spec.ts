import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { PlayerImporter } from './import-players';
import { Player } from '../players/entities/player.entity';
import { User } from '../users/entities/user.entity';
import { College } from '../profiles/entities/college.entity';
import { Department } from '../profiles/entities/department.entity';
import { PlayerTournament } from '../players/entities/player-tournament.entity';
import { TeamTournament } from '../teams/entities/team-tournament.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';

describe('PlayerImporter', () => {
  let importer: PlayerImporter;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockPlayerRepo: jest.Mocked<Repository<Player>>;
  let mockUserRepo: jest.Mocked<Repository<User>>;
  let mockCollegeRepo: jest.Mocked<Repository<College>>;
  let mockDepartmentRepo: jest.Mocked<Repository<Department>>;
  let mockPlayerTournamentRepo: jest.Mocked<Repository<PlayerTournament>>;
  let mockTeamTournamentRepo: jest.Mocked<Repository<TeamTournament>>;
  let mockTournamentRepo: jest.Mocked<Repository<Tournament>>;

  beforeEach(async () => {
    // Mock repositories
    mockPlayerRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    mockUserRepo = {
      findOne: jest.fn(),
    } as any;

    mockCollegeRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    mockDepartmentRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    mockPlayerTournamentRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    mockTeamTournamentRepo = {
      findOne: jest.fn(),
    } as any;

    mockTournamentRepo = {
      findOne: jest.fn(),
    } as any;

    // Mock DataSource
    mockDataSource = {
      getRepository: jest.fn((entity) => {
        switch (entity) {
          case Player:
            return mockPlayerRepo;
          case User:
            return mockUserRepo;
          case College:
            return mockCollegeRepo;
          case Department:
            return mockDepartmentRepo;
          case PlayerTournament:
            return mockPlayerTournamentRepo;
          case TeamTournament:
            return mockTeamTournamentRepo;
          case Tournament:
            return mockTournamentRepo;
          default:
            throw new Error(`Unknown entity: ${entity.name}`);
        }
      }),
    } as any;

    importer = new PlayerImporter(mockDataSource);
  });

  describe('processPlayer', () => {
    it('should create new player when player does not exist', async () => {
      // Arrange
      const playerData = {
        name: 'Test Player',
        email: 'test@example.com',
        college: 'Test College',
        department: 'Test Department',
        backNumber: '12345',
        birthDate: '1990-01-01',
      };

      const mockCollege = { id: 1, name: 'Test College' };
      const mockDepartment = { id: 1, name: 'Test Department' };
      const mockPlayer = { id: 1, name: 'Test Player', studentId: '12345' };

      mockUserRepo.findOne.mockResolvedValue(null);
      mockCollegeRepo.findOne.mockResolvedValue(mockCollege as any);
      mockDepartmentRepo.findOne.mockResolvedValue(mockDepartment as any);
      mockPlayerRepo.findOne.mockResolvedValue(null);
      mockPlayerRepo.create.mockReturnValue(mockPlayer as any);
      mockPlayerRepo.save.mockResolvedValue(mockPlayer as any);
      mockPlayerTournamentRepo.findOne.mockResolvedValue(null);
      mockPlayerTournamentRepo.create.mockReturnValue({} as any);
      mockPlayerTournamentRepo.save.mockResolvedValue({} as any);

      // Mock console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await (importer as any).processPlayer(playerData, 1, 1);

      // Assert
      expect(mockPlayerRepo.create).toHaveBeenCalledWith({
        name: 'Test Player',
        studentId: '12345',
        college: mockCollege,
        department: mockDepartment,
        user: undefined,
        email: 'test@example.com',
        birthDate: new Date('1990-01-01'),
      });

      consoleSpy.mockRestore();
    });

    it('should skip player tournament creation if already exists', async () => {
      // Arrange
      const playerData = {
        name: 'Test Player',
        email: 'test@example.com',
        college: 'Test College',
        department: 'Test Department',
        backNumber: '12345',
        birthDate: '1990-01-01',
      };

      const mockCollege = { id: 1, name: 'Test College' };
      const mockDepartment = { id: 1, name: 'Test Department' };
      const mockPlayer = { id: 1, name: 'Test Player', studentId: '12345' };
      const mockPlayerTournament = { id: 1, player: mockPlayer };

      mockUserRepo.findOne.mockResolvedValue(null);
      mockCollegeRepo.findOne.mockResolvedValue(mockCollege as any);
      mockDepartmentRepo.findOne.mockResolvedValue(mockDepartment as any);
      mockPlayerRepo.findOne.mockResolvedValue(mockPlayer as any);
      mockPlayerTournamentRepo.findOne.mockResolvedValue(
        mockPlayerTournament as any,
      );

      // Mock console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await (importer as any).processPlayer(playerData, 1, 1);

      // Assert
      expect(mockPlayerTournamentRepo.create).not.toHaveBeenCalled();
      expect(mockPlayerTournamentRepo.save).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
