import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { addMinutes, addHours } from 'date-fns';
import { Umpire } from '@/umpires/entities/umpire.entity';
import { EmailCode } from '@/mail/entities/email-code.entity';
import { PasswordResetToken } from '@/mail/entities/password-reset-token.entity';
import { MailService } from '@/mail/mail.service';
import * as crypto from 'crypto';
import { MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestCodeDto, VerifyCodeDto } from '@/auth/dtos/code.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from '@/auth/dtos/password-reset.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '@/common/exceptions/error-codes.enum';
import { BaseException } from '@/common/exceptions/base.exception';
import { Game } from '@/games/entities/game.entity';
import { LoginDto, SignupDto } from '@/auth/dtos/signup.dto';
import { User } from '@/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Session } from '@/sessions/entities/session.entity';
import { sha256 } from 'js-sha256';
import * as ms from 'ms';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
@Injectable()
export class AuthService {
  private readonly codeExpireMinutes: number;
  private readonly codeMaxAttempts: number;
  private readonly jwtExpiresIn: string;
  private readonly passwordResetExpireHours: number;
  private readonly frontendUrl: string;
  constructor(
    @InjectRepository(Umpire)
    private readonly umpireRepository: Repository<Umpire>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(EmailCode)
    private readonly codeRepository: Repository<EmailCode>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Session)
    private readonly sessions: Repository<Session>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {
    this.codeMaxAttempts = this.configService.get('auth.codeMaxAttempts');
    this.codeExpireMinutes = this.configService.get('auth.codeExpireMinutes');
    this.passwordResetExpireHours = this.configService.get(
      'auth.passwordResetExpireHours',
      1,
    );
    this.frontendUrl = this.configService.get(
      'app.frontendUrl',
      'http://localhost:3001',
    );
  }

  /* ------------------------------------------------------------------ */
  /*  1) 가입                                                             */
  /* ------------------------------------------------------------------ */
  async signup({ email, password, verificationToken, nickname }: SignupDto) {
    return this.dataSource.transaction(async (manager) => {
      const payload = this.jwt.verify(verificationToken, {
        secret: this.configService.get('auth.jwtEmailVerificationSecret'),
      });
      if (payload.sub !== email) {
        throw new BadRequestException('인증 토큰이 일치하지 않습니다.');
      }

      const userExists = await manager.exists(User, { where: { email } });
      if (userExists) {
        throw new BaseException(
          '이미 존재하는 이메일입니다.',
          ErrorCodes.EMAIL_ALREADY_EXISTS,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (nickname.length < 2 || nickname.length > 8) {
        throw new BaseException(
          '닉네임은 2자 이상 8자 이하여야 합니다.',
          ErrorCodes.INVALID_NICKNAME,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (nickname.includes(' ')) {
        throw new BaseException(
          '닉네임에 공백을 포함할 수 없습니다.',
          ErrorCodes.INVALID_NICKNAME,
          HttpStatus.BAD_REQUEST,
        );
      }

      const nicknameExists = await manager.exists(User, {
        where: { nickname },
      });
      if (nicknameExists) {
        throw new BaseException(
          '이미 존재하는 닉네임입니다.',
          ErrorCodes.NICKNAME_ALREADY_EXISTS,
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = manager.create(User, {
        email,
        passwordHash: await bcrypt.hash(password, 12),
        nickname,
      });
      console.log(user);
      await manager.save(user);

      return this.issueTokenPairWithManager(user, manager);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  2) 로그인                                                           */
  /* ------------------------------------------------------------------ */
  async login({ email, password }: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'passwordHash', 'email'],
    });
    console.log(user);
    if (!user) {
      throw new UnauthorizedException('존재하지 않는 이메일입니다.');
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }
    return this.issueTokenPair(user);
  }

  /* ------------------------------------------------------------------ */
  /*  3) 리프레시 & 세션 회전                                             */
  /* ------------------------------------------------------------------ */
  async refresh(oldToken: string) {
    console.log('[POST] auth/refresh -> oldToken:', oldToken);
    return this.dataSource.transaction(async (manager) => {
      const payload = await this.verifyRefresh(oldToken);

      const session = await manager.findOne(Session, {
        where: {
          id: payload.jid,
          revoked: false,
          expiresAt: MoreThan(new Date()),
        },
        relations: ['user'],
      });
      console.log('[POST] auth/refresh -> session:', session);
      if (
        !session ||
        session.revoked ||
        session.expiresAt < new Date() ||
        session.tokenHash !== sha256(oldToken)
      ) {
        throw new UnauthorizedException('Session dead');
      }

      session.revoked = true; // rotate
      await manager.save(session);

      return this.issueTokenPairWithManager(session.user, manager);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  4) 토큰 발급 + 세션 생성 (단일 진입점)                               */
  /* ------------------------------------------------------------------ */
  private async issueTokenPair(user: User) {
    const basePayload = { sub: user.id, email: user.email };

    // access·refresh 병렬 발급
    const [accessToken, { token: refreshToken }] = await Promise.all([
      this.signAccessToken(basePayload),
      this.signRefreshToken(basePayload, user),
    ]);

    return { accessToken, refreshToken };
  }

  /* ------------------------------------------------------------------ */
  /*  4-1) 트랜잭션 내에서 토큰 발급 + 세션 생성                           */
  /* ------------------------------------------------------------------ */
  private async issueTokenPairWithManager(user: User, manager: any) {
    const basePayload = { sub: user.id, email: user.email, role: user.role };

    // access·refresh 병렬 발급
    const [accessToken, { token: refreshToken }] = await Promise.all([
      this.signAccessToken(basePayload),
      this.signRefreshTokenWithManager(basePayload, user, manager),
    ]);

    return { accessToken, refreshToken };
  }

  /* ------------------------------------------------------------------ */
  /*  5) access token                                                    */
  /* ------------------------------------------------------------------ */
  private signAccessToken(payload: Record<string, any>) {
    return this.jwt.signAsync(payload, {
      secret: this.configService.get('auth.jwtAccessSecret'),
      expiresIn: this.configService.get('auth.jwtAccessExpiresIn'),
      issuer: this.configService.get('auth.jwtIssuer'),
    });
  }

  /* ------------------------------------------------------------------ */
  /*  6) refresh token + session                                         */
  /* ------------------------------------------------------------------ */
  private async signRefreshToken(payload: Record<string, any>, user: User) {
    return this.dataSource.transaction(async (manager) => {
      return this.signRefreshTokenWithManager(payload, user, manager);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  6-1) 트랜잭션 내에서 refresh token + session 생성                   */
  /* ------------------------------------------------------------------ */
  private async signRefreshTokenWithManager(
    payload: Record<string, any>,
    user: User,
    manager: any,
  ) {
    // ② JID를 포함해 토큰 서명 (세션 ID는 자동 생성)
    const token = await this.jwt.signAsync(
      { ...payload },
      {
        secret: this.configService.get('auth.jwtRefreshSecret'),
        expiresIn: this.configService.get('auth.jwtRefreshExpiresIn'),
        issuer: this.configService.get('auth.jwtIssuer'),
      },
    );

    // ③ 해시를 포함해 세션을 한 번에 저장
    const session = manager.create(Session, {
      user: { id: user.id },
      expiresAt: new Date(
        Date.now() + ms(this.configService.get('auth.jwtRefreshExpiresIn')),
      ),
      tokenHash: '', // 임시값, 나중에 업데이트
    });
    const savedSession = await manager.save(session);

    // ④ 저장된 세션의 ID를 토큰에 포함
    const tokenWithJid = await this.jwt.signAsync(
      { ...payload, jid: savedSession.id },
      {
        secret: this.configService.get('auth.jwtRefreshSecret'),
        expiresIn: this.configService.get('auth.jwtRefreshExpiresIn'),
        issuer: this.configService.get('auth.jwtIssuer'),
      },
    );

    // ⑤ 최종 토큰(JID 포함)의 해시를 계산하여 세션 업데이트
    const tokenHash = sha256(tokenWithJid);
    savedSession.tokenHash = tokenHash;
    await manager.save(savedSession);

    return { token: tokenWithJid, session: savedSession };
  }

  /* ------------------------------------------------------------------ */
  /*  7) refresh 토큰 검증                                               */
  /* ------------------------------------------------------------------ */
  private verifyRefresh(token: string) {
    return this.jwt.verifyAsync(token, {
      secret: this.configService.get('auth.jwtRefreshSecret'),
    });
  }

  /* 1) 인증 코드 요청 */
  async requestCode(
    requestCodeDto: RequestCodeDto,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: requestCodeDto.email },
    });
    if (user) {
      throw new BaseException(
        '이미 존재하는 이메일입니다.',
        ErrorCodes.EMAIL_ALREADY_EXISTS,
        HttpStatus.BAD_REQUEST,
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
  async verifyCode(dto: VerifyCodeDto): Promise<{ verificationToken: string }> {
    let record: EmailCode;
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

    const payload = {
      sub: dto.email,
    };
    const verificationToken = this.jwt.sign(payload, {
      expiresIn: this.configService.get('auth.jwtEmailVerificationExpiresIn'),
      secret: this.configService.get('auth.jwtEmailVerificationSecret'),
      issuer: this.configService.get('auth.jwtIssuer'),
    });

    // 3) 성공 시 레코드 제거, JWT 발급
    await this.codeRepository.delete({ id: record.id });

    return { verificationToken };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: parseInt(userId) },
        select: ['id', 'passwordHash', 'email'],
      });
      if (!user) throw new NotFoundException('User not found');

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid)
        throw new BadRequestException('Current password is incorrect');

      // 비밀번호 업데이트
      user.passwordHash = await bcrypt.hash(newPassword, 12);
      await manager.save(user);

      // 기존 세션 무효화
      await manager.update(
        Session,
        { user: { id: userId } },
        { revoked: true },
      );

      // 새로운 리프레시 토큰 발급
      const { token: refreshToken } = await this.signRefreshTokenWithManager(
        { sub: user.id, email: user.email },
        user,
        manager,
      );

      return {
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다.',
        refreshToken,
      };
    });
  }

  async deleteAccount(userId: string) {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Session, { user: { id: parseInt(userId) } });
      await manager.delete(User, { id: parseInt(userId) });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  비밀번호 재설정 요청                                                */
  /* ------------------------------------------------------------------ */
  async requestPasswordReset(
    dto: RequestPasswordResetDto,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      // 보안상 사용자가 존재하지 않아도 성공 메시지를 반환
      return {
        success: true,
        message: '비밀번호 재설정 이메일이 전송되었습니다.',
      };
    }

    // 기존 토큰이 있다면 삭제
    await this.passwordResetTokenRepository.delete({ email: dto.email });

    // 새로운 토큰 생성
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const expiresAt = addHours(new Date(), this.passwordResetExpireHours);

    // 토큰 저장
    const resetTokenEntity = this.passwordResetTokenRepository.create({
      email: dto.email,
      tokenHash,
      expiresAt,
    });
    await this.passwordResetTokenRepository.save(resetTokenEntity);

    // 재설정 URL 생성
    const resetUrl = `${this.frontendUrl}//login/findPassword/resetPassword?token=${resetToken}`;

    // 이메일 발송
    await this.mail.sendPasswordResetEmail(dto.email, resetToken, resetUrl);

    return {
      success: true,
      message: '비밀번호 재설정 이메일이 전송되었습니다.',
    };
  }

  /* ------------------------------------------------------------------ */
  /*  비밀번호 재설정 실행                                                */
  /* ------------------------------------------------------------------ */
  async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.dataSource.transaction(async (manager) => {
      // 토큰 해시 생성
      const tokenHash = crypto
        .createHash('sha256')
        .update(dto.token)
        .digest('hex');

      // 토큰 조회
      const resetToken = await manager.findOne(PasswordResetToken, {
        where: { tokenHash },
      });

      if (!resetToken) {
        throw new BaseException(
          '유효하지 않은 재설정 토큰입니다.',
          ErrorCodes.INVALID_RESET_TOKEN,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 토큰 만료 확인
      if (resetToken.expiresAt < new Date()) {
        await manager.delete(PasswordResetToken, { id: resetToken.id });
        throw new BaseException(
          '재설정 토큰이 만료되었습니다.',
          ErrorCodes.RESET_TOKEN_EXPIRED,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 토큰 사용 여부 확인
      if (resetToken.usedAt) {
        throw new BaseException(
          '이미 사용된 재설정 토큰입니다.',
          ErrorCodes.RESET_TOKEN_ALREADY_USED,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 사용자 조회
      const user = await manager.findOne(User, {
        where: { email: resetToken.email },
      });

      if (!user) {
        throw new BaseException(
          '사용자를 찾을 수 없습니다.',
          ErrorCodes.USER_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // 비밀번호 업데이트
      user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
      await manager.save(user);

      // 토큰 사용 처리
      resetToken.usedAt = new Date();
      await manager.save(resetToken);

      // 사용자의 모든 세션 무효화 (보안상)
      await manager.update(
        Session,
        { user: { id: user.id } },
        { revoked: true },
      );

      return {
        success: true,
        message: '비밀번호가 성공적으로 재설정되었습니다.',
      };
    });
  }

  async logout(userId: string) {
    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        Session,
        { user: { id: parseInt(userId) } },
        { revoked: true },
      );
    });
  }
}
