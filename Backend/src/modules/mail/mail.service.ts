import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

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
      this.logger.log(`Email successfully sent to ${to} with template ${template}`);
      return true;
    } catch (error: any) {
      this.logger.warn(`Template send failed, falling back to direct html: ${error?.message || error}`);
      try {
        await this.mailerService.sendMail({
          to,
          subject,
          html: context?.html || `<p>${subject}</p>`,
        });
        this.logger.log(`Fallback email successfully sent to ${to}`);
        return true;
      } catch (fallbackErr: any) {
        this.logger.error(`Mail sending error to ${to}: ${fallbackErr?.message || fallbackErr}`);
        return false;
      }
    }
  }

  async sendPasswordResetMail(to: string, token: string) {
    const appUrl = this.configService.get('FRONTEND_URL') || this.configService.get('APP_URL') || 'http://localhost:5173';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    return this.sendMail(
      to,
      'SmartDiet - Şifre Sıfırlama',
      'password-reset',
      {
        resetUrl,
        html: `<div style="font-family:Arial,sans-serif;padding:20px;"><h2>Şifre Sıfırlama</h2><p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p><p><a href="${resetUrl}" style="background:#10b981;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Şifremi Sıfırla</a></p></div>`,
      },
    );
  }

  async sendWelcomeMail(to: string, username: string) {
    return this.sendMail(
      to,
      'SmartDiet - Hoş Geldiniz',
      'welcome',
      {
        username,
        html: `<div style="font-family:Arial,sans-serif;padding:20px;"><h2>Hoş Geldiniz, ${username}!</h2><p>SmartDiet sağlıklı yaşam ekosistemine başarıyla katıldınız.</p></div>`,
      },
    );
  }

  async sendOtpMail(to: string, code: string) {
    return this.sendMail(
      to,
      'SmartDiet - Doğrulama Kodunuz',
      'otp',
      { 
        code,
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;"><h2 style="color:#10b981;margin-bottom:8px;">SmartDiet Doğrulama Kodu</h2><p style="color:#475569;font-size:14px;">Güvenliğiniz için tek kullanımlık giriş kodunuz:</p><div style="font-size:32px;font-weight:900;letter-spacing:6px;color:#0f172a;margin:20px 0;padding:16px;background:#f8fafc;border:1px dashed #cbd5e1;text-align:center;border-radius:12px;">${code}</div><p style="color:#94a3b8;font-size:12px;">Bu kod 5 dakika boyunca geçerlidir.</p></div>`,
      },
    );
  }
} 
