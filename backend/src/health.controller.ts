import { Controller, Get } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';

/* Railway 등 배포 플랫폼의 헬스체크용 */
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok' };
  }
}
