import { MailerOptions } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export const mailerConfig = (cfg: ConfigService): MailerOptions => ({
  transport: {
    service: 'gmail', // Nodemailer가 내부에서 smtp.gmail.com:465 사용
    auth: {
      user: cfg.get('MAIL_USER'),
      pass: cfg.get('MAIL_APP_PASSWORD'),
    },
  },
  defaults: {
    from: `"SNU 야구 심판봇" <${cfg.get('MAIL_USER')}>`,
  },
});
