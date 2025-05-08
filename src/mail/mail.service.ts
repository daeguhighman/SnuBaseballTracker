import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendCode(to: string, code: string) {
    await this.mailer.sendMail({
      to,
      subject: '[SNU BASEBALL] 이메일 인증 코드',
      text: `인증 코드는 ${code}입니다.`,
    });
  }
}
