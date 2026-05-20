import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor(private readonly configService: ConfigService) {
    const env = this.configService.get('NODE_ENV', 'development');
    const isProduction = env === 'production';
    const isVercel = process.env.VERCEL === '1';

    const transports = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(
            (info) => `${info.timestamp} ${info.level}: ${info.message}`,
          ),
        ),
      }),
    ];

    if (isProduction && !isVercel) {
      transports.push(
        new (winston.transports.DailyRotateFile as any)({
          dirname: 'logs',
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );
    }

    this.logger = winston.createLogger({
      level: isProduction ? 'info' : 'debug',
      transports,
    });
  }

  log(message: string, context?: string) {
    this.logger.info(this.formatMessage(message, context));
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(this.formatMessage(message, context), { trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(this.formatMessage(message, context));
  }

  debug(message: string, context?: string) {
    this.logger.debug(this.formatMessage(message, context));
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(this.formatMessage(message, context));
  }

  private formatMessage(message: string, context?: string): string {
    return context ? `[${context}] ${message}` : message;
  }
} 