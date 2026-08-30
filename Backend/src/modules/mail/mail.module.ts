import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as path from 'path';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const port = Number(configService.get('MAIL_PORT')) || 587;
        const host = configService.get('MAIL_HOST') || 'smtp.resend.com';
        const user = configService.get('MAIL_USER') || 'resend';
        const pass = configService.get('MAIL_PASSWORD');
        const from = configService.get('MAIL_FROM') || 'SmartDiet <onboarding@resend.dev>';
        const isSecure = configService.get('MAIL_SECURE') === 'true' || port === 465;

        return {
          transport: {
            host,
            port,
            secure: isSecure,
            auth: (user && pass) ? { user, pass } : undefined,
            tls: {
              rejectUnauthorized: false,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          },
          defaults: {
            from,
          },
          template: {
            dir: path.join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: false,
            },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {} 