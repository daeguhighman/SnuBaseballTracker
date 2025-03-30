import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users/users.controller';
import { TeamsController } from './teams/teams.controller';
import { TeamsService } from './teams/teams.service';
import { TeamsModule } from './teams/teams.module';
import { AppDataSource } from '../data-source';

@Module({
  imports: [TypeOrmModule.forRoot(AppDataSource.options), TeamsModule],
  controllers: [AppController, UsersController, TeamsController],
  providers: [AppService, TeamsService],
})
export class AppModule {}
