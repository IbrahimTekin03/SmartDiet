import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { OtpCode, OtpIdentityType, OtpPurpose } from './entities/otp-code.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../mail/mail.service';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';
import { RedisService } from '../../redis/redis.service';

const OTP_TTL_MINUTES = 5;
const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const MAX_SENT_PER_WINDOW = 3;
const RESEND_WINDOW_MINUTES = 10;
const LOCK_MINUTES = 15;
const MIN_RESEND_INTERVAL_SECONDS = 60;
const MAX_DEVICE_REQUESTS_PER_WINDOW = 5;
const DEVICE_RATE_WINDOW_MINUTES = 10;
const OTP_TRUST_TTL_SECONDS = 60 * 60 * 24 * 7;

type OtpRequestContext = {
  ip?: string;
  deviceId?: string;
  userAgent?: string;
};

@Injectable()
export class OtpService {
  private readonly requestRateBuckets = new Map<string, number[]>();
  private readonly trustedBuckets = new Map<string, number>();

  constructor(
    @InjectRepository(OtpCode)
    private readonly otpRepo: Repository<OtpCode>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
    @Inject('REDIS_ENABLED') private readonly redisEnabled: boolean,
  ) {}

  private addMinutes(base: Date, minutes: number): Date {
    return new Date(base.getTime() + minutes * 60 * 1000);
  }

  private isAfter(a: Date, b: Date): boolean {
    return a.getTime() > b.getTime();
  }

  private generateNumericCode(length: number): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  private async hashCode(code: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(code, saltRounds);
  }

  private normalizeIdentity(identityType: OtpIdentityType, identity: string): string {
    const normalized = identity.trim();
    if (identityType === OtpIdentityType.Email) return normalized.toLowerCase();

    const startsWithPlus = normalized.startsWith('+');
    const digitsOnly = normalized.replace(/\D/g, '');
    if (!digitsOnly) return normalized;
    return startsWithPlus ? `+${digitsOnly}` : digitsOnly;
  }

  private buildClientFingerprint(context?: OtpRequestContext): string {
    const deviceId = String(context?.deviceId || '').trim();
    if (deviceId) return `device:${deviceId}`;

    const ip = String(context?.ip || 'unknown').trim();
    const userAgent = String(context?.userAgent || 'unknown').trim().slice(0, 80);
    return `ip:${ip}|ua:${userAgent}`;
  }

  private buildTrustKey(
    identityType: OtpIdentityType,
    identity: string,
    purpose: OtpPurpose,
    context?: OtpRequestContext,
  ): string {
    const fingerprint = this.buildClientFingerprint(context);
    return `otp:trust:${purpose}:${identityType}:${identity}:${fingerprint}`;
  }

  private buildUserTrustKey(userId: string, purpose: OtpPurpose, context?: OtpRequestContext): string {
    const fingerprint = this.buildClientFingerprint(context);
    return `otp:trust:user:${purpose}:${userId}:${fingerprint}`;
  }

  private async getTrustedTtlSeconds(key: string): Promise<number> {
    if (this.redisEnabled) {
      const ttl = await this.redisService.ttl(key);
      return ttl > 0 ? ttl : 0;
    }

    const expiresAt = this.trustedBuckets.get(key);
    if (!expiresAt) return 0;
    const seconds = Math.floor((expiresAt - Date.now()) / 1000);
    if (seconds <= 0) {
      this.trustedBuckets.delete(key);
      return 0;
    }
    return seconds;
  }

  private async markTrusted(key: string, ttlSeconds: number): Promise<void> {
    if (this.redisEnabled) {
      await this.redisService.set(key, '1', ttlSeconds);
      return;
    }
    this.trustedBuckets.set(key, Date.now() + ttlSeconds * 1000);
  }

  async shouldRequireOtp(
    identityType: OtpIdentityType,
    identity: string,
    purpose: OtpPurpose,
    context?: OtpRequestContext,
  ) {
    if (purpose !== OtpPurpose.Login) {
      return { otpRequired: true, trustedTtlSeconds: 0 };
    }

    const normalizedIdentity = this.normalizeIdentity(identityType, identity);
    const trustKey = this.buildTrustKey(identityType, normalizedIdentity, purpose, context);
    const trustedTtlSeconds = await this.getTrustedTtlSeconds(trustKey);

    return {
      otpRequired: trustedTtlSeconds <= 0,
      trustedTtlSeconds,
    };
  }

  async shouldRequireOtpForUser(
    user: Pick<User, 'id' | 'email' | 'phone_number'> | null | undefined,
    purpose: OtpPurpose,
    context?: OtpRequestContext,
  ) {
    if (purpose !== OtpPurpose.Login || !user?.id) {
      return { otpRequired: true, trustedTtlSeconds: 0 };
    }

    const keys: string[] = [this.buildUserTrustKey(user.id, purpose, context)];

    const email = String(user.email || '').trim();
    if (email) {
      const normalizedEmail = this.normalizeIdentity(OtpIdentityType.Email, email);
      keys.push(this.buildTrustKey(OtpIdentityType.Email, normalizedEmail, purpose, context));
    }

    const phone = String(user.phone_number || '').trim();
    if (phone) {
      const normalizedPhone = this.normalizeIdentity(OtpIdentityType.Phone, phone);
      keys.push(this.buildTrustKey(OtpIdentityType.Phone, normalizedPhone, purpose, context));
    }

    let maxTtl = 0;
    for (const key of keys) {
      const ttl = await this.getTrustedTtlSeconds(key);
      if (ttl > maxTtl) maxTtl = ttl;
    }

    return {
      otpRequired: maxTtl <= 0,
      trustedTtlSeconds: maxTtl,
    };
  }

  private enforceDeviceRateLimit(
    identityType: OtpIdentityType,
    identity: string,
    purpose: OtpPurpose,
    context?: OtpRequestContext,
  ) {
    const nowMs = Date.now();
    const windowMs = DEVICE_RATE_WINDOW_MINUTES * 60 * 1000;
    const fingerprint = this.buildClientFingerprint(context);
    const key = `${purpose}:${identityType}:${identity}:${fingerprint}`;

    const recent = (this.requestRateBuckets.get(key) || []).filter((ts) => nowMs - ts < windowMs);
    if (recent.length >= MAX_DEVICE_REQUESTS_PER_WINDOW) {
      throw new HttpException('OTP device rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    recent.push(nowMs);
    this.requestRateBuckets.set(key, recent);

    // Best-effort cleanup for memory usage.
    if (this.requestRateBuckets.size > 5000) {
      for (const [bucketKey, timestamps] of this.requestRateBuckets.entries()) {
        const active = timestamps.filter((ts) => nowMs - ts < windowMs);
        if (active.length === 0) this.requestRateBuckets.delete(bucketKey);
        else this.requestRateBuckets.set(bucketKey, active);
      }
    }
  }

  async requestOtp(
    identityType: OtpIdentityType,
    identity: string,
    purpose: OtpPurpose,
    context?: OtpRequestContext,
  ) {
    const normalizedIdentity = this.normalizeIdentity(identityType, identity);
    this.enforceDeviceRateLimit(identityType, normalizedIdentity, purpose, context);

    const user = await (identityType === OtpIdentityType.Email
      ? this.userRepo.findOne({ where: { email: normalizedIdentity } })
      : this.userRepo.findOne({ where: { phone_number: normalizedIdentity } }));

    // Login OTP only works for existing users.
    // Signup OTP can be sent to any identity.
    if (purpose === OtpPurpose.Login && !user) {
      throw new BadRequestException('User not found');
    }

    const now = new Date();
    const windowSince = this.addMinutes(now, -RESEND_WINDOW_MINUTES);
    const recent = await this.otpRepo.find({
      where: {
        identity_type: identityType,
        identity: normalizedIdentity,
        purpose,
        created_at: MoreThan(windowSince),
      },
      order: { created_at: 'DESC' },
    });

    const totalSent = recent.reduce((acc, r) => acc + (r.sent_count || 0), 0);
    if (totalSent >= MAX_SENT_PER_WINDOW) {
      throw new HttpException('OTP rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    const last = recent[0];
    if (last?.created_at) {
      const secondsSinceLastSend = Math.floor((now.getTime() - last.created_at.getTime()) / 1000);
      if (secondsSinceLastSend < MIN_RESEND_INTERVAL_SECONDS) {
        throw new HttpException('OTP resend cooldown active', HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    const lockedRecord = recent.find((r) => r.locked_until && this.isAfter(r.locked_until, now));
    if (lockedRecord) {
      throw new HttpException('Temporarily locked. Please try later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const activeRecords = await this.otpRepo.find({
      where: {
        identity_type: identityType,
        identity: normalizedIdentity,
        purpose,
        expires_at: MoreThan(now),
        consumed_at: null,
      },
      order: { created_at: 'ASC' },
    });

    if (activeRecords.length > 0) {
      for (const active of activeRecords) {
        active.consumed_at = now;
      }
      await this.otpRepo.save(activeRecords);
    }

    const code = this.generateNumericCode(OTP_LENGTH);
    const codeHash = await this.hashCode(code);
    const newExpiresAt = this.addMinutes(now, OTP_TTL_MINUTES);

    const record = this.otpRepo.create({
      identity_type: identityType,
      identity: normalizedIdentity,
      purpose,
      code_hash: codeHash,
      salt: null,
      expires_at: newExpiresAt,
      attempt_count: 0,
      sent_count: 1,
      locked_until: null,
      consumed_at: null,
    });
    await this.otpRepo.save(record);

    // Keep legacy field sync only for existing users.
    if (user) {
      user.verification_code = code;
      await this.userRepo.save(user);
    }

    if (identityType === OtpIdentityType.Email) {
      await this.mailService.sendOtpMail(normalizedIdentity, code);
    } else {
      const smsEnabled = this.configService.get('SMS_ENABLED', 'false') === 'true';
      if (!smsEnabled) {
        throw new BadRequestException('SMS service is not configured. Please choose email OTP.');
      }
      // TODO: Add SMS provider integration here (Twilio/NetGSM/etc).
    }

    return { ok: true };
  }

  async verifyOtp(
    identityType: OtpIdentityType,
    identity: string,
    code: string,
    purpose: OtpPurpose,
    context?: OtpRequestContext,
  ) {
    const now = new Date();
    const normalizedIdentity = this.normalizeIdentity(identityType, identity);

    const otp = await this.otpRepo.findOne({
      where: {
        identity_type: identityType,
        identity: normalizedIdentity,
        purpose,
        expires_at: MoreThan(now),
        consumed_at: null,
      },
      order: { created_at: 'DESC' },
    });

    if (!otp) {
      throw new UnauthorizedException('OTP not found or expired');
    }
    if (otp.locked_until && this.isAfter(otp.locked_until, now)) {
      throw new HttpException('Temporarily locked. Please try later.', HttpStatus.TOO_MANY_REQUESTS);
    }
    const isValid = await bcrypt.compare(code, otp.code_hash);
    if (!isValid) {
      otp.attempt_count += 1;
      if (otp.attempt_count >= MAX_ATTEMPTS) {
        otp.locked_until = this.addMinutes(now, LOCK_MINUTES);
      }
      await this.otpRepo.save(otp);
      throw new UnauthorizedException('Invalid OTP code');
    }

    otp.consumed_at = now;
    await this.otpRepo.save(otp);

    if (purpose === OtpPurpose.Signup) {
      return { ok: true, verified: true };
    }

    const user = await (identityType === OtpIdentityType.Email
      ? this.userRepo.findOne({ where: { email: normalizedIdentity }, relations: ['roles'] })
      : this.userRepo.findOne({ where: { phone_number: normalizedIdentity }, relations: ['roles'] }));

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (purpose === OtpPurpose.Login) {
      const trustTasks: Array<Promise<void>> = [];
      const identityTrustKey = this.buildTrustKey(identityType, normalizedIdentity, purpose, context);
      trustTasks.push(this.markTrusted(identityTrustKey, OTP_TRUST_TTL_SECONDS));

      const userTrustKey = this.buildUserTrustKey(user.id, purpose, context);
      trustTasks.push(this.markTrusted(userTrustKey, OTP_TRUST_TTL_SECONDS));

      if (user.email) {
        const emailTrustKey = this.buildTrustKey(
          OtpIdentityType.Email,
          this.normalizeIdentity(OtpIdentityType.Email, user.email),
          purpose,
          context,
        );
        trustTasks.push(this.markTrusted(emailTrustKey, OTP_TRUST_TTL_SECONDS));
      }

      if (user.phone_number) {
        const phoneTrustKey = this.buildTrustKey(
          OtpIdentityType.Phone,
          this.normalizeIdentity(OtpIdentityType.Phone, user.phone_number),
          purpose,
          context,
        );
        trustTasks.push(this.markTrusted(phoneTrustKey, OTP_TRUST_TTL_SECONDS));
      }

      await Promise.all(trustTasks);
    }

    if (!user.is_active) {
      user.is_active = true;
      await this.userRepo.save(user);
    }
    if (!user.is_verified) {
      user.is_verified = true;
      await this.userRepo.save(user);
    }

    const loginResult = await this.authService.login(user);
    return {
      ok: true,
      user: loginResult.user,
      accessToken: loginResult.accessToken,
      refreshToken: loginResult.refreshToken,
      deviceId: undefined,
    };
  }
}
