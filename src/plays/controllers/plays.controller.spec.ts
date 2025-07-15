import { Test, TestingModule } from '@nestjs/testing';
import { PlaysController } from '../plays.controller';

describe('PlaysController', () => {
  let controller: PlaysController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaysController],
    }).compile();

    controller = module.get<PlaysController>(PlaysController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
