import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AppRole } from '@/users/entities/user.entity';

@Injectable()
export class AdminAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(AdminAuthGuard.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: any) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: any) {
    if (err || !user) {
      this.logger.error(
        `Admin Auth Guard - Authentication failed: ${info?.message}`,
      );
      throw err || new ForbiddenException('Admin access required');
    }

    // Admin 권한 확인
    if (user.role !== AppRole.ADMIN) {
      console.log(user);
      this.logger.warn(
        `Admin Auth Guard - Non-admin user attempted access: ${user.userId}`,
      );
      throw new ForbiddenException('Admin access required');
    }

    this.logger.debug(
      `Admin Auth Guard - Admin access granted for user: ${user.userId}`,
    );
    return user;
  }
}
