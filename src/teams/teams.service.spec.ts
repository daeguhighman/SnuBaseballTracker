import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { Player } from '@players/entities/player.entity';
import { TeamTournament } from './entities/team-tournament.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('TeamsService', () => {
  let service: TeamsService;
  let teamRepository: Repository<Team>;
  let playerRepository: Repository<Player>;
  let teamTournamentRepository: Repository<TeamTournament>;

  // 테스트에 사용할 mock 데이터 정의
  // 실제 DB 데이터를 모방한 테스트용 데이터
  const mockTeamTournaments = [
    {
      team: { id: 1, name: '관악사' },
      group: 'A',
      games: 4,
      wins: 2,
      draws: 0,
      losses: 2,
      rank: 1,
    },
    {
      team: { id: 2, name: '포톤스' },
      group: 'A',
      games: 4,
      wins: 3,
      draws: 0,
      losses: 1,
      rank: 2,
    },
    {
      team: { id: 3, name: '아갉쥐' },
      group: 'B',
      games: 4,
      wins: 4,
      draws: 0,
      losses: 0,
      rank: 1,
    },
  ];

  // 단일 팀 정보 mock 데이터
  const mockTeam = {
    id: 1,
    name: '관악사',
  };

  // 선수 목록 mock 데이터
  const mockPlayers = [
    {
      id: 1,
      name: '김선수',
      isElite: false,
      isWildcard: false,
      department: { name: '컴퓨터공학부' },
    },
    {
      id: 2,
      name: '이선수',
      isElite: true,
      isWildcard: false,
      department: { name: '수학과' },
    },
  ];

  // 각 테스트 실행 전에 실행되는 설정
  beforeEach(async () => {
    // 테스트 모듈 설정
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        // Team 리포지토리 mock 설정
        {
          provide: getRepositoryToken(Team),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockTeam),
          },
        },
        // Player 리포지토리 mock 설정
        {
          provide: getRepositoryToken(Player),
          useValue: {
            find: jest.fn().mockResolvedValue(mockPlayers),
          },
        },
        // TeamTournament 리포지토리 mock 설정
        {
          provide: getRepositoryToken(TeamTournament),
          useValue: {
            find: jest.fn().mockResolvedValue(mockTeamTournaments),
          },
        },
      ],
    }).compile();

    // 테스트에 사용할 서비스와 리포지토리 주입
    service = module.get<TeamsService>(TeamsService);
    teamRepository = module.get<Repository<Team>>(getRepositoryToken(Team));
    playerRepository = module.get<Repository<Player>>(
      getRepositoryToken(Player),
    );
    teamTournamentRepository = module.get<Repository<TeamTournament>>(
      getRepositoryToken(TeamTournament),
    );
  });

  // getGroupedTeams 메소드 테스트
  describe('getGroupedTeams', () => {
    it('should return teams grouped by their groups', async () => {
      // getGroupedTeams 메소드 실행
      const result = await service.getGroupedTeams();

      // 결과 검증
      expect(result).toHaveProperty('A'); // A조가 있는지 확인
      expect(result).toHaveProperty('B'); // B조가 있는지 확인
      expect(result.A).toHaveLength(2); // A조에 2팀이 있는지 확인
      expect(result.B).toHaveLength(1); // B조에 1팀이 있는지 확인
      // 첫 번째 팀의 상세 정보 확인
      expect(result.A[0]).toEqual({
        id: 1,
        name: '관악사',
        games: 4,
        wins: 2,
        draws: 0,
        losses: 2,
        rank: 1,
      });
    });
  });

  // getTeamPlayers 메소드 테스트
  describe('getTeamPlayers', () => {
    // 정상 케이스 테스트
    it('should return players of a specific team', async () => {
      const result = await service.getTeamPlayers(1);

      // 결과가 예상한 형식과 일치하는지 검증
      expect(result).toEqual({
        id: 1,
        name: '관악사',
        players: mockPlayers.map((player) => ({
          id: player.id,
          name: player.name,
          departmentName: player.department.name,
          isElite: player.isElite,
          isWildcard: player.isWildcard,
        })),
      });
    });

    // 에러 케이스 테스트: 존재하지 않는 팀
    it('should throw NotFoundException when team does not exist', async () => {
      // findOne이 null을 반환하도록 mock 설정
      jest.spyOn(teamRepository, 'findOne').mockResolvedValue(null);

      // NotFoundException이 발생하는지 검증
      await expect(service.getTeamPlayers(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
