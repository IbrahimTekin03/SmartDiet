import { Injectable, BadRequestException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { OtpCode, OtpIdentityType, OtpPurpose } from './entities/otp-code.entity';
import * as bcrypt from 'bcrypt';
import { MailService } from '../../mail/mail.service';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';

const OTP_TTL_MINUTES = 5;
const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const MAX_SENT_PER_WINDOW = 3;
const RESEND_WINDOW_MINUTES = 10;
const LOCK_MINUTES = 15;

@Injectable()
export class OtpService {
	constructor(
		@InjectRepository(OtpCode)
		private readonly otpRepo: Repository<OtpCode>,
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
		private readonly mailService: MailService,
		private readonly authService: AuthService,
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

	async requestOtp(identityType: OtpIdentityType, identity: string, purpose: OtpPurpose) {
		// request rate limiti kontolü
		const windowSince = this.addMinutes(new Date(), -RESEND_WINDOW_MINUTES);
		const recent = await this.otpRepo.find({
			where: { identity_type: identityType, identity, purpose, created_at: MoreThan(windowSince) },
			order: { created_at: 'DESC' },
		});
		const totalSent = recent.reduce((acc, r) => acc + (r.sent_count || 0), 0);
		if (totalSent >= MAX_SENT_PER_WINDOW) {
			throw new HttpException('OTP rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
		}

		// son istek kilitliyse, blokla
		const last = recent[0];
		if (last?.locked_until && this.isAfter(last.locked_until, new Date())) {
			throw new HttpException('Temporarily locked. Please try later.', HttpStatus.TOO_MANY_REQUESTS);
		}

		const now = new Date();
		let record = await this.otpRepo.findOne({
			where: {
				identity_type: identityType,
				identity,
				purpose,
				expires_at: MoreThan(now),
				consumed_at: null,
			},
			order: { created_at: 'DESC' },
		});

		const code = this.generateNumericCode(OTP_LENGTH);
		const codeHash = await this.hashCode(code);
		const newExpiresAt = this.addMinutes(new Date(), OTP_TTL_MINUTES);

		if (record) {
		// aynı purpose ve identity için request varsa count artır
			record.code_hash = codeHash;
			record.expires_at = newExpiresAt;
			record.sent_count = (record.sent_count || 0) + 1;
			await this.otpRepo.save(record);
		} else {
			record = this.otpRepo.create({
				identity_type: identityType,
				identity,
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
		}

		// type mail ise mail gönder
		if (identityType === OtpIdentityType.Email) {
			await this.mailService.sendOtpMail(identity, code);
		}

		return { ok: true };
	}

	async verifyOtp(identityType: OtpIdentityType, identity: string, code: string, purpose: OtpPurpose) {
		// en son kullanılmayan kodu bul
		const now = new Date();
		const otp = await this.otpRepo.findOne({
			where: { identity_type: identityType, identity, purpose, expires_at: MoreThan(now) },
			order: { created_at: 'DESC' },
		});
		if (!otp) {
			throw new UnauthorizedException('OTP not found or expired');
		}
		if (otp.locked_until && this.isAfter(otp.locked_until, now)) {
			throw new HttpException('Temporarily locked. Please try later.', HttpStatus.TOO_MANY_REQUESTS);
		}
		if (otp.consumed_at) {
			throw new UnauthorizedException('OTP already used');
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

		// kullanılan kodu işaretle
		otp.consumed_at = now;
		await this.otpRepo.save(otp);

		// başarılı doğrulama: eğer login/signup ise kullanıcıyı aktif yap ve tokenları döndür
		if (purpose === OtpPurpose.Login || purpose === OtpPurpose.Signup) {
			// find user by identity
			const user = await (identityType === OtpIdentityType.Email
				? this.userRepo.findOne({ where: { email: identity }, relations: ['roles'] })
				: this.userRepo.findOne({ where: { phone_number: identity }, relations: ['roles'] }));
			if (!user) {
				return { ok: true };
			}
			if (!user.is_active) {
				user.is_active = true;
				await this.userRepo.save(user);
			}
			const loginResult = await this.authService.login(user);
			return { ok: true, user: { id: loginResult.user.id }, accessToken: loginResult.accessToken, refreshToken: loginResult.refreshToken, deviceId: undefined };
		}

		return { ok: true };
	}
}
