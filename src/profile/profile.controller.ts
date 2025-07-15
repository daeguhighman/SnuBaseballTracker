import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UpdateProfileDto } from './dtos/profile.dto';
import { ProfileService } from './profile.service';

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

  // @Post('photo/request')
  // async presign(@Req() { user }) {
  //   return this.profSvc.generatePresignedUrl(user.id);
  // }

  // @Post('photo/confirm')
  // async confirm(@Req() { user }, @Body('key') key: string) {
  //   return this.profSvc.savePhoto(user.id, key);
  // }
}
