import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { UserProfile } from '@/profile/entities/user-profile.entity';
import { ConfigService } from '@nestjs/config';
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import { UpdateProfileDto } from './dtos/profile.dto';

@Injectable()
export class ProfileService {
  // private s3: S3Client;
  private bucket: string;

  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(UserProfile) private profiles: Repository<UserProfile>,
    cfg: ConfigService,
  ) {
    // this.bucket = cfg.get<string>('s3.profileBucket') ?? 'profile-bucket-dev';
    // this.s3 = new S3Client({ region: cfg.get('aws.region') });
  }

  async getByUserId(userId: string) {
    const profile = await this.profiles.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException();

    return {
      id: profile.id,
      email: profile.user.email,
      nickname: profile.nickname,
      photoUrl: profile.photoUrl,
    };
  }

  async upsert(userId: string, dto: UpdateProfileDto) {
    const user = await this.users.findOneByOrFail({ id: userId });

    let profile = await this.profiles.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) profile = this.profiles.create({ user });

    Object.assign(profile, {
      nickname: dto.nickname,
    });
    return this.profiles.save(profile);
  }

  // /*──────────── S3 Presigned upload ───────────*/
  // async generatePresignedUrl(userId: string) {
  //   const key = `profile/${userId}/${uuid()}.jpg`;
  //   const cmd = new PutObjectCommand({
  //     Bucket: this.bucket,
  //     Key: key,
  //     ContentType: 'image/jpeg',
  //   });
  //   const url = await getSignedUrl(this.s3, cmd, { expiresIn: 60 * 5 });
  //   return { url, key }; // client uploads via PUT url
  // }

  // async savePhoto(userId: string, key: string) {
  //   const profile = await this.profiles.findOne({
  //     where: { user: { id: userId } },
  //   });
  //   if (!profile) throw new NotFoundException();

  //   // Basic security: key must start with prefix
  //   if (!key.startsWith(`profile/${userId}/`))
  //     throw new BadRequestException('Invalid key');

  //   profile.photoUrl = `https://${this.bucket}.s3.amazonaws.com/${key}`;
  //   return this.profiles.save(profile);
  // }
}
