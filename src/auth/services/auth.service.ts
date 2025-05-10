import { Injectable } from '@nestjs/common';
import { addMinutes } from 'date-fns';
import { Umpire } from '@/umpires/entities/umpire.entity';
import { UmpireEmailCode } from '@/umpires/entities/umpire-email-code.entity';
import { MailService } from '@/mail/mail.service';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestCodeDto, VerifyCodeDto } from '@/auth/dtos/code.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '@/common/exceptions/error-codes.enum';
import { BaseException } from '@/common/exceptions/base.exception';
import { Game } from '@/games/entities/game.entity';
@Injectable()
export class AuthService {
  private readonly codeExpireMinutes: number;
  private readonly codeMaxAttempts: number;
  private readonly jwtExpiresIn: string;
  constructor(
    @InjectRepository(Umpire)
    private readonly umpireRepository: Repository<Umpire>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(UmpireEmailCode)
    private readonly codeRepository: Repository<UmpireEmailCode>,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.codeMaxAttempts = this.configService.get('auth.codeMaxAttempts');
    this.codeExpireMinutes = this.configService.get('auth.codeExpireMinutes');
    this.jwtExpiresIn = this.configService.get('auth.jwtExpiresIn');
  }

  async me(token: string | undefined) {
    if (!token) {
      return {
        role: 'USER',
        umpireId: null,
        gameIds: [],
      };
    }
    let payload: any;
    try {
      payload = this.jwt.verify(token);
    } catch {
      return {
        role: 'USER',
        umpireId: null,
        gameIds: [],
      };
    }
    if (payload.role !== 'UMPIRE') {
      return {
        role: 'USER',
        umpireId: null,
        gameIds: [],
      };
    }
    const games = await this.gameRepository.find({
      where: { recordUmpireId: payload.umpireId },
      select: ['id'],
    });
    return {
      role: payload.role,
      umpireId: payload.umpireId,
      gameIds: games.map((game) => game.id),
    };
  }
  /* 1) 인증 코드 요청 */
  async requestCode(
    requestCodeDto: RequestCodeDto,
  ): Promise<{ success: boolean; message: string }> {
    const umpire = await this.umpireRepository.findOne({
      where: { user: { email: requestCodeDto.email } },
    });

    if (!umpire) {
      throw new BaseException(
        '심판을 찾을 수 없습니다',
        ErrorCodes.UMPIRE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = addMinutes(new Date(), this.codeExpireMinutes);

    try {
      await this.codeRepository.upsert(
        {
          email: requestCodeDto.email,
          codeHash: hash,
          expiresAt,
          tryCount: 0,
        },
        { conflictPaths: ['email'] }, // 같은 이메일이 이미 있으면 업데이트
      );
    } catch (error) {
      throw new InternalServerErrorException('인증 코드 전송 실패');
    }
    await this.mail.sendCode(requestCodeDto.email, code);
    return { success: true, message: '이메일 인증 코드 전송 성공' };
  }

  /** 2) 인증 코드 검증 & JWT 발급 */
  async verifyCode(dto: VerifyCodeDto): Promise<{ accessToken: string }> {
    let record: UmpireEmailCode;
    try {
      record = await this.codeRepository.findOneOrFail({
        where: { email: dto.email },
      });
    } catch {
      throw new BaseException(
        '인증 코드가 존재하지 않습니다.',
        ErrorCodes.CODE_NOT_FOUND,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 1) 만료/횟수 초과 확인
    if (record.expiresAt < new Date()) {
      await this.codeRepository.delete({ id: record.id });
      throw new BaseException(
        '인증 코드가 만료되었습니다.',
        ErrorCodes.CODE_EXPIRED,
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (record.tryCount >= this.codeMaxAttempts) {
      await this.codeRepository.delete({ id: record.id });
      throw new BaseException(
        '인증 코드 사용 횟수를 초과했습니다.',
        ErrorCodes.CODE_MAX_ATTEMPTS_EXCEEDED,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 2) 코드 일치 여부
    const incomingHash = crypto
      .createHash('sha256')
      .update(dto.code)
      .digest('hex');
    if (incomingHash !== record.codeHash) {
      await this.codeRepository.increment({ id: record.id }, 'tryCount', 1);
      throw new BaseException(
        '인증 코드가 일치하지 않습니다.',
        ErrorCodes.INVALID_CODE,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 3) 성공 시 레코드 제거, JWT 발급
    await this.codeRepository.delete({ id: record.id });

    const umpire = await this.umpireRepository.findOneOrFail({
      where: { user: { email: dto.email } },
    });

    const payload = {
      sub: umpire.userId,
      umpireId: umpire.id,
      role: 'UMPIRE',
    };
    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.jwtExpiresIn,
    });

    return { accessToken };
  }
}
