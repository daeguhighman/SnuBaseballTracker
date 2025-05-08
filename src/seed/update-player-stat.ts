import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { GameStatsService } from '../games/services/game-stats.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const gameStatsService = app.get(GameStatsService);

  const gameId = 6; // 호출하고 싶은 게임 ID로 변경

  await gameStatsService.updatePlayerStats(gameId);

  console.log(`✅ updatePlayerStats(${gameId}) 호출 완료`);
  await app.close();
}

bootstrap();
