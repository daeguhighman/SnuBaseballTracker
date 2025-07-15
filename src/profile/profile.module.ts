import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/users/entities/user.entity';
import { UserProfile } from '@/profile/entities/user-profile.entity';
import { College } from '@/profile/entities/college.entity';
import { Department } from '@/profile/entities/department.entity';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([UserProfile, College, Department]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
