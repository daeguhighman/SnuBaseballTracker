import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { UpdateProfileDto } from './profile.dto';
import { ProfileService } from './profiles.service';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profSvc: ProfileService) {}

  @Get('me')
  me(@Req() { user }) {
    return this.profSvc.getByUserId(user.id);
  }

  @Put('me')
  update(@Req() { user }, @Body() dto: UpdateProfileDto) {
    return this.profSvc.upsert(user.id, dto);
  }
}
