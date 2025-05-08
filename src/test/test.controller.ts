import { Controller, Post } from '@nestjs/common';
import { TestService } from './test.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Test')
@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Post('reset')
  @ApiOperation({ summary: '모든 데이터 초기화' })
  @ApiResponse({
    status: 200,
    description: '모든 데이터 초기화 성공',
    example: { success: true, message: '모든 데이터 초기화 성공' },
  })
  async reset() {
    await this.testService.clearAll();
  }

  @Post('seed/umpire')
  @ApiOperation({ summary: '심판 데이터 시드' })
  @ApiResponse({
    status: 200,
    description: '심판 데이터 시드 성공',
    example: { success: true, message: '심판 데이터 시드 성공' },
  })
  async seedUmpire() {
    await this.testService.seedForUmpire();
  }
}
