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

  async sendMail(to: string, subject: string, template: string, context: any): Promise<boolean> {
    const resendApiKey =
      this.configService.get('RESEND_API_KEY') ||
      (this.configService.get('MAIL_PASSWORD')?.startsWith('re_') ? this.configService.get('MAIL_PASSWORD') : null);

    const fromAddress = this.configService.get('MAIL_FROM') || 'SmartDiet <onboarding@resend.dev>';
    const htmlContent =
      context?.html ||
      `<div style="font-family:Arial,sans-serif;padding:20px;color:#1e293b;"><h2 style="color:#10b981;">${subject}</h2><p>SmartDiet Bildirimi</p></div>`;

    // 1. Resend HTTPS REST API (Bypasses Render SMTP port blocking instantly)
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [to],
            subject: subject,
            html: htmlContent,
          }),
        });

        const resData: any = await response.json();
        if (response.ok) {
          this.logger.log(`Email successfully sent via Resend HTTPS API to ${to} (ID: ${resData?.id})`);
          return true;
        } else {
          this.logger.error(`Resend HTTPS API error for ${to}: ${JSON.stringify(resData)}`);
        }
      } catch (httpErr: any) {
        this.logger.error(`Resend HTTPS fetch failed for ${to}: ${httpErr?.message || httpErr}`);
      }
    }

    // 2. Fallback to Nodemailer SMTP
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html: htmlContent,
      });
      this.logger.log(`Email successfully sent via SMTP to ${to}`);
      return true;
    } catch (error: any) {
      this.logger.error(`SMTP sending error to ${to}: ${error?.message || error}`);
      return false;
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
        html: `<div style="font-family:Arial,sans-serif;max-width:550px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;"><h2 style="color:#10b981;margin-bottom:12px;">SmartDiet Şifre Sıfırlama</h2><p style="color:#475569;font-size:14px;line-height:1.6;">Hesabınızın şifresini yenilemek için aşağıdaki bağlantıya tıklayın:</p><div style="margin:24px 0;"><a href="${resetUrl}" style="background:#10b981;color:#ffffff;font-weight:bold;padding:12px 24px;text-decoration:none;border-radius:10px;display:inline-block;">Şifremi Sıfırla</a></div><p style="color:#94a3b8;font-size:12px;">Bu link 1 saat boyunca geçerlidir. İşlemi siz yapmadıysanız lütfen bu e-postayı dikkate almayınız.</p></div>`,
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
        html: `<div style="font-family:Arial,sans-serif;max-width:550px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;"><h2 style="color:#10b981;margin-bottom:12px;">Hoş Geldiniz, ${username}!</h2><p style="color:#475569;font-size:14px;line-height:1.6;">SmartDiet sağlıklı yaşam ve klinik beslenme ekosistemine katıldığınız için teşekkür ederiz.</p></div>`,
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
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;"><h2 style="color:#10b981;margin-bottom:8px;">SmartDiet Doğrulama Kodu</h2><p style="color:#475569;font-size:14px;">Güvenliğiniz için tek kullanımlık giriş kodunuz:</p><div style="font-size:32px;font-weight:900;letter-spacing:6px;color:#0f172a;margin:20px 0;padding:16px;background:#f8fafc;border:1px dashed #cbd5e1;text-align:center;border-radius:12px;">${code}</div><p style="color:#94a3b8;font-size:12px;">Bu kod 5 dakika boyunca geçerlidir. İşlemi siz başlatmadıysanız bu e-postayı dikkate almayınız.</p></div>`,
      },
    );
  }
}
