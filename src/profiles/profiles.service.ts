import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { UserProfile } from './entities/profile.entity';
import { UpdateProfileDto } from './profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(UserProfile) private profiles: Repository<UserProfile>,
  ) {}

  async getByUserId(userId: string) {
    const profile = await this.profiles.findOne({
      where: { user: { id: parseInt(userId) } },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException();

    return {
      id: profile.id,
      email: profile.user.email,
      nickname: profile.nickname,
    };
  }

  async upsert(userId: string, dto: UpdateProfileDto) {
    const user = await this.users.findOneByOrFail({ id: parseInt(userId) });

    let profile = await this.profiles.findOne({
      where: { user: { id: parseInt(userId) } },
    });
    if (!profile) profile = this.profiles.create({ user });

    Object.assign(profile, {
      nickname: dto.nickname,
    });
    return this.profiles.save(profile);
  }
}
