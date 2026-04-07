import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RedisModule } from '../redis/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../acl/entities/role.entity';
import { OtpCode } from './otp/entities/otp-code.entity';
import { OtpTrustKey } from './otp/entities/otp-trust-key.entity';
import { OtpService } from './otp/otp.service';
import { MailModule } from '../mail/mail.module';
import { UserProfile } from '../users/entities/user.profile.entity';
import { Subscription } from './entities/subscription.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { UserAssignedDietitian } from '../users/entities/user-assigned-dietitian.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      User, 
      Role, 
      OtpCode, 
      OtpTrustKey, 
      UserProfile, 
      Subscription, 
      ChatRoom, 
      UserAssignedDietitian
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRATION') ?? '15m' },
      }),
    }),
    RedisModule.register(),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, OtpService],
  exports: [AuthService],
})
export class AuthModule {} 
