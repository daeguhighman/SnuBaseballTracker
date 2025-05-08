import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { NotFoundException } from '@nestjs/common';

describe('TeamsController', () => {
  let controller: TeamsController;
  let service: TeamsService;

  // 조별 팀 목록 mock 데이터
  const mockGroupedTeams = {
    A: [
      {
        id: 1,
        name: '관악사',
        games: 4,
        wins: 2,
        draws: 0,
        losses: 2,
        rank: 1,
      },
      {
        id: 2,
        name: '포톤스',
        games: 4,
        wins: 3,
        draws: 0,
        losses: 1,
        rank: 2,
      },
    ],
    B: [
      {
        id: 3,
        name: '아갉쥐',
        games: 4,
        wins: 4,
        draws: 0,
        losses: 0,
        rank: 1,
      },
    ],
  };

  // 팀 선수 목록 mock 데이터
  const mockTeamPlayers = {
    id: 1,
    name: '관악사',
    players: [
      {
        id: 1,
        name: '김선수',
        departmentName: '컴퓨터공학부',
        isElite: false,
        isWildcard: false,
      },
      {
        id: 2,
        name: '이선수',
        departmentName: '수학과',
        isElite: true,
        isWildcard: false,
      },
    ],
  };

  // 각 테스트 실행 전 설정
  beforeEach(async () => {
    // 테스트 모듈 설정
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        // TeamsService mock 설정
        {
          provide: TeamsService,
          useValue: {
            getGroupedTeams: jest.fn().mockResolvedValue(mockGroupedTeams),
            getTeamPlayers: jest.fn().mockResolvedValue(mockTeamPlayers),
          },
        },
      ],
    }).compile();

    // 컨트롤러와 서비스 주입
    controller = module.get<TeamsController>(TeamsController);
    service = module.get<TeamsService>(TeamsService);
  });

  // getGroupedTeams 엔드포인트 테스트
  describe('getGroupedTeams', () => {
    it('should return grouped teams', async () => {
      const result = await controller.getGroupedTeams();

      // 결과 검증
      expect(result).toBe(mockGroupedTeams);
      expect(service.getGroupedTeams).toHaveBeenCalled();
    });
  });

  // getTeamPlayers 엔드포인트 테스트
  describe('getTeamPlayers', () => {
    // 정상 케이스 테스트
    it('should return team players', async () => {
      const result = await controller.getTeamPlayers(1);

      // 결과 검증
      expect(result).toBe(mockTeamPlayers);
      expect(service.getTeamPlayers).toHaveBeenCalledWith(1);
    });

    // 에러 케이스 테스트
    it('should throw NotFoundException for non-existent team', async () => {
      // getTeamPlayers가 NotFoundException을 throw하도록 설정
      jest
        .spyOn(service, 'getTeamPlayers')
        .mockRejectedValue(new NotFoundException('Team not found'));

      // NotFoundException이 발생하는지 검증
      await expect(controller.getTeamPlayers(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
