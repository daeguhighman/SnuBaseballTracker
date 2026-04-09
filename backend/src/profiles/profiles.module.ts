import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profiles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/users/entities/user.entity';
import { UserProfile } from './entities/profile.entity';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([UserProfile])],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
