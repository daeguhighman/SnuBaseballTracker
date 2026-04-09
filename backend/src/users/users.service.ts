import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@users/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByIdWithRoles(id: number): Promise<User> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }
}
