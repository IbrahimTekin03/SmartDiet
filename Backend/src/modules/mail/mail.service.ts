import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendMail(to: string, subject: string, template: string, context: any) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
      return true;
    } catch (error) {
      console.error('Mail gönderme hatası:', error);
      return false;
    }
  }

  async sendPasswordResetMail(to: string, token: string) {
    const appUrl = this.configService.get('APP_URL');
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    return this.sendMail(
      to,
      'Şifre Sıfırlama',
      'password-reset',
      {
        resetUrl,
      },
    );
  }

  async sendWelcomeMail(to: string, username: string) {
    return this.sendMail(
      to,
      'Hoş Geldiniz',
      'welcome',
      {
        username,
      },
    );
  }

  async sendOtpMail(to: string, code: string) {
    return this.sendMail(
      to,
      'Doğrulama Kodunuz',
      'otp',
      { code },
    );
  }
} 