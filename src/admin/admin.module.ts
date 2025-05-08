import { Module } from '@nestjs/common';
import { AdminController } from '@admin/controllers/admin.controller';
import { GamesModule } from '@games/games.module';

@Module({
  imports: [GamesModule],
  controllers: [AdminController],
})
export class AdminModule {}
