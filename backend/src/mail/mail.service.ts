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

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    resetUrl: string,
  ) {
    await this.mailer.sendMail({
      to,
      subject: '[SNU BASEBALL] 비밀번호 재설정',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">SNU BASEBALL 비밀번호 재설정</h2>
          <p style="color: #666; line-height: 1.6;">
            안녕하세요,<br>
            SNU BASEBALL에서 비밀번호 재설정 요청을 받았습니다.
          </p>
          <p style="color: #666; line-height: 1.6;">
            아래 버튼을 클릭하여 비밀번호를 재설정하세요:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              비밀번호 재설정
            </a>
          </div>
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
            <a href="${resetUrl}" style="color: #007bff; word-break: break-all;">${resetUrl}</a>
          </p>
          <p style="color: #999; line-height: 1.6; font-size: 12px;">
            이 링크는 1시간 후에 만료됩니다.<br>
            비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2024 SNU BASEBALL. All rights reserved.
          </p>
        </div>
      `,
      text: `
SNU BASEBALL 비밀번호 재설정

안녕하세요,
SNU BASEBALL에서 비밀번호 재설정 요청을 받았습니다.

아래 링크를 클릭하여 비밀번호를 재설정하세요:
${resetUrl}

이 링크는 1시간 후에 만료됩니다.
비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.

© 2024 SNU BASEBALL. All rights reserved.
      `,
    });
  }
}
