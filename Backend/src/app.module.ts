import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import * as fs from 'fs';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MailModule } from './modules/mail/mail.module';
import { RedisModule } from './modules/redis/redis.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { LoggerModule } from './modules/logger/logger.module';
import { AclModule } from './modules/acl/acl.module';
import { MeasurementsModule } from './modules/measurements/measurements.module';
import { ClinicsModule } from './modules/clinics/clinics.module';
import { FoodsModule } from './modules/foods/foods.module';
import { DietPlansModule } from './modules/diet-plans/diet-plans.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { MessagesModule } from './modules/messages/messages.module';
import { WaterTrackingModule } from './modules/water-tracking/water-tracking.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

const DIST_I18N_PATH = path.join(__dirname, 'i18n');
const SRC_I18N_PATH = path.join(process.cwd(), 'src', 'i18n');
const I18N_PATH = fs.existsSync(DIST_I18N_PATH) ? DIST_I18N_PATH : SRC_I18N_PATH;

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as any, // <-- KRİTİK: undefined olmasın
        host: configService.get('DB_HOST') || 'localhost',
        port: Number(configService.get('DB_PORT')) || 5432,
        username: configService.get('DB_USERNAME') || 'postgres',
        password: configService.get('DB_PASSWORD'),
        database: (configService.get('DB_DATABASE') as string) || 'smartDiet',
        autoLoadEntities: true,
        synchronize: (configService.get('DB_SYNCHRONIZE') || 'true') === 'true',
      }),
    }),


    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('THROTTLE_TTL', 60),
        limit: configService.get('THROTTLE_LIMIT', 10),
      }),
    }),

    // i18n
    I18nModule.forRoot({
      fallbackLanguage: 'tr',
      loaderOptions: {
        path: I18N_PATH,
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),

    // Modules
    AuthModule,
    UsersModule,
    MailModule,
    RedisModule.register({ isGlobal: true }),
    WebsocketModule,
    LoggerModule,
    AclModule,
    MeasurementsModule,
    ClinicsModule,
    FoodsModule,
    DietPlansModule,
    NotificationsModule,
    AiAssistantModule,
    MessagesModule,
    WaterTrackingModule,
    AppointmentsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
