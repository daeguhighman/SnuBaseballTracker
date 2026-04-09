import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '@/sessions/entities/session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session])],
  exports: [TypeOrmModule],
})
export class SessionsModule {}
