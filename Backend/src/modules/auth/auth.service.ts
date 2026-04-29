import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { I18nService } from 'nestjs-i18n';
import { RedisService } from '../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Brackets, In, MoreThan, Repository } from 'typeorm';
import { Role } from '../acl/entities/role.entity';
import { AdminRegisterDto } from './dto/admin.register.dto';
import { LoginDto } from './dto/login.dto';
import {
  AccountType,
  DietitianVerificationStatus,
  UserProfile,
} from '../users/entities/user.profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SubmitDietitianVerificationDto } from './dto/submit-dietitian-verification.dto';
import { MailService } from '../mail/mail.service';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { AssignClientDietitianDto } from './dto/assign-client-dietitian.dto';
import { UserAssignedDietitian } from '../users/entities/user-assigned-dietitian.entity';
import { NotificationsService } from '../notifications/notifications.service';

type ListDietitianApplicationsOptions = {
  status?: string;
  search?: string;
  city?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

type ListHistoryOptions = {
  page?: number;
  limit?: number;
};

type ListClinicDietitiansOptions = {
  search?: string;
  city?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

type ListAdminUsersOptions = {
  search?: string;
  accountType?: string;
  page?: number;
  limit?: number;
};

type ListAdminConnectionsOptions = {
  search?: string;
  page?: number;
  limit?: number;
};

const MAX_FAILED_LOGIN_ATTEMPTS = 3;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(UserAssignedDietitian)
    private readonly userAssignedDietitianRepository: Repository<UserAssignedDietitian>,
    public readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    @Inject('REDIS_ENABLED') private readonly redisEnabled: boolean,
  ) {}

  private getAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return age;
  }

  private hasRole(user: Pick<User, 'roles'> | any, roleName: string): boolean {
    return (user?.roles || []).some((r: Role) => r?.name === roleName);
  }

  private normalizeEmail(email: string): string {
    return String(email || '').trim().toLowerCase();
  }

  private normalizeIdentifier(identifier: string): string {
    const value = String(identifier || '').trim();
    if (!value) return '';
    return value.includes('@') ? value.toLowerCase() : value;
  }

  private async findUserForAuth(identifier: string): Promise<User | null> {
    const normalized = this.normalizeIdentifier(identifier);
    if (!normalized) return null;

    return this.userRepository.findOne({
      where: normalized.includes('@') ? [{ email: normalized }] : [{ phone_number: normalized }],
      select: [
        'id',
        'phone_number',
        'first_name',
        'last_name',
        'email',
        'password_hash',
        'failed_login_attempts',
        'password_reset_token',
        'password_reset_expires_at',
        'is_active',
        'is_verified',
        'last_login',
      ],
      relations: ['roles'],
    });
  }

  private async recordFailedLoginAttempt(user: User): Promise<number> {
    const nextAttempts = Number(user.failed_login_attempts || 0) + 1;
    user.failed_login_attempts = nextAttempts;
    await this.userRepository.save(user);
    return nextAttempts;
  }

  private async clearFailedLoginAttempts(user: User): Promise<User> {
    const needsReset =
      Number(user.failed_login_attempts || 0) > 0 ||
      Boolean(user.password_reset_token) ||
      Boolean(user.password_reset_expires_at);

    if (!needsReset) return user;

    user.failed_login_attempts = 0;
    user.password_reset_token = null;
    user.password_reset_expires_at = null;
    return this.userRepository.save(user);
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async authenticateForLogin(loginDto: LoginDto): Promise<User> {
    const identifier = loginDto.email || loginDto.phone_number || '';
    const normalizedIdentifier = this.normalizeIdentifier(identifier);
    const plainPassword = String(loginDto.password || '');

    if (!normalizedIdentifier || !plainPassword) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.auth.invalid_credentials'),
      );
    }

    const user = await this.findUserForAuth(normalizedIdentifier);
    if (!user) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.auth.invalid_credentials'),
      );
    }

    let isValid = false;
    if (user.password_hash?.startsWith('$2')) {
      isValid = await bcrypt.compare(plainPassword, user.password_hash);
    } else {
      isValid = user.password_hash === plainPassword;
      if (isValid) {
        user.password_hash = await bcrypt.hash(plainPassword, 10);
        await this.userRepository.save(user);
      }
    }

    if (!isValid) {
      await this.recordFailedLoginAttempt(user);
      throw new UnauthorizedException(
        await this.i18n.translate('common.auth.invalid_credentials'),
      );
    }

    return this.clearFailedLoginAttempts(user);
  }

  private async ensureBootstrapAdmin(user: User): Promise<User> {
    if (!user?.email) return user;

    const bootstrapAdminEmail = String(
      this.configService.get('BOOTSTRAP_ADMIN_EMAIL') || 'mertb2627@gmail.com',
    )
      .trim()
      .toLowerCase();

    if (user.email.toLowerCase() !== bootstrapAdminEmail) return user;
    if (this.hasRole(user, 'admin')) return user;

    const adminRole = await this.roleRepository.findOne({ where: { name: 'admin' } });
    if (!adminRole) return user;

    user.roles = [...(user.roles || []), adminRole];
    await this.userRepository.save(user);
    return user;
  }

  buildSessionUser(user: any) {
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
    return {
      id: user?.id,
      first_name: user?.first_name,
      last_name: user?.last_name,
      display_name: fullName,
      full_name: fullName,
      email: user?.email,
      phone_number: user?.phone_number,
      roles: user?.roles || [],
    };
  }

  async validateUser(emailOrPhoneNumber: string, plainPassword: string): Promise<any> {
    const user = await this.findUserForAuth(emailOrPhoneNumber);

    if (!user) {
      return null;
    }
    if (!plainPassword) {
      return null;
    }

    // Backward compatibility: if old records were saved as plain text, allow once.
    let isValid = false;
    if (user.password_hash?.startsWith('$2')) {
      isValid = await bcrypt.compare(plainPassword, user.password_hash);
    } else {
      isValid = user.password_hash === plainPassword;
      if (isValid) {
        user.password_hash = await bcrypt.hash(plainPassword, 10);
        await this.userRepository.save(user);
      }
    }
    if (!isValid) {
      return null;
    }

    return this.clearFailedLoginAttempts(user);
  }

  async login(user: any) {
    user = await this.ensureBootstrapAdmin(user as User);
    user.last_login = new Date();
    user.failed_login_attempts = 0;
    user = await this.userRepository.save(user);

    const sessionId = uuidv4();
    const accessExpiresIn = this.configService.get('JWT_EXPIRATION') ?? '15m';
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRATION') ?? '7d';
    const refreshTtlSeconds = Number(
      this.configService.get('JWT_REFRESH_EXPIRATION_SECONDS') ?? 60 * 60 * 24 * 7,
    );
    const refreshSecret =
      this.configService.get('JWT_REFRESH_SECRET') ?? this.configService.get('JWT_SECRET');

    const roleNames = (user.roles || []).map((r) => r.name);
    const sessionUser = this.buildSessionUser(user);
    const payload = {
      sub: user.id,
      display_name: sessionUser.display_name,
      sessionId,
      roles: roleNames,
    };
    
    const accessToken = this.jwtService.sign(payload, { expiresIn: accessExpiresIn });
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    // Redis etkinse oturum bilgilerini kaydet
    if (this.redisEnabled) {
      await this.redisService.set(
        `auth:${user.id}:${sessionId}`,
        JSON.stringify({ refreshToken }),
        refreshTtlSeconds,
      );
    }


    return {
      accessToken,
      refreshToken,
      user: sessionUser,
    };
  }

  async register(registerDto: RegisterDto) {
    // En az bir iletişim bilgisi olmalı (DTO da doğrular, serviste de koru)
    if (!registerDto.email && !registerDto.phone_number) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.auth.email_or_phone_required'),
      );
    }

    const birthDate = new Date(registerDto.birth_date);
    if (Number.isNaN(birthDate.getTime())) {
      throw new BadRequestException('Birth date format is invalid');
    }
    if (this.getAge(birthDate) < 18) {
      throw new BadRequestException('You must be at least 18 years old');
    }

    // E-posta verilmişse kontrol et
    if (registerDto.email) {
      const emailCheck = await this.userRepository.findOne({
        where: { email: registerDto.email },
      });
      if (emailCheck) {
        throw new UnauthorizedException(
          await this.i18n.translate('common.auth.email_exists'),
        );
      }
    }

    // 3) Telefon verilmi?se kontrol et
    if (registerDto.phone_number) {
      const phoneNumberCheck = await this.userRepository.findOne({
        where: { phone_number: registerDto.phone_number },
      });
      if (phoneNumberCheck) {
        throw new UnauthorizedException(
          await this.i18n.translate('common.auth.phone_number_exists'),
        );
      }
    }

    const requestedAccountType =
      registerDto.account_type === AccountType.Dietitian ? AccountType.Dietitian : AccountType.Client;
    const requestedRoleName =
      requestedAccountType === AccountType.Dietitian ? 'Diyetisyen' : 'client';

    let assignedRole = await this.roleRepository.findOne({ where: { name: requestedRoleName } });
    if (!assignedRole) {
      assignedRole = this.roleRepository.create({
        name: requestedRoleName,
        description:
        requestedRoleName === 'Diyetisyen' ? 'Diyetisyen kullanici' : 'Danisan kullanici',
      });
      assignedRole = await this.roleRepository.save(assignedRole);
    }
    if (!assignedRole) {
      assignedRole = await this.roleRepository.findOne({ where: { name: 'user' } });
    }

    // Yeni kullan?c? olu?tur
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const newUser = this.userRepository.create({
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      email: registerDto.email ?? null,
      phone_number: registerDto.phone_number ?? null,
      password_hash: hashedPassword,
      roles: assignedRole ? [assignedRole] : [],
    });
    

    const savedUser = await this.userRepository.save(newUser);

    const newProfile = this.userProfileRepository.create({
      user_id: savedUser.id,
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      birth_date: registerDto.birth_date,
      gender: registerDto.gender,
      avatar_url: registerDto.avatar_url ?? null,
      account_type: requestedAccountType,
      dietitian_verification_status:
        requestedAccountType === AccountType.Dietitian
          ? DietitianVerificationStatus.NotSubmitted
          : DietitianVerificationStatus.Approved,
      clinic_name: null,
      clinic_city: null,
      clinic_address: null,
      verification_note: null,
      verification_review_note: null,
      verification_submitted_at: null,
      verification_reviewed_at: null,
      verification_reviewed_by: null,
    });
    
    console.log(`[Register] User ${savedUser.id} registered as ${requestedAccountType}. ClinicID: ${(registerDto as any).clinic_id}`);
    
    // Eğer danışan ise otomatik ata
    if (requestedAccountType === AccountType.Client) {
        if ((registerDto as any).clinic_id) {
            newProfile.clinic_id = (registerDto as any).clinic_id;
        }
        await this.userProfileRepository.save(newProfile);
        console.log(`[Register] Triggering auto-assignment for client ${savedUser.id}`);
        await this.autoAssignToDietitian(savedUser.id, (registerDto as any).clinic_id);
    } else {
        await this.userProfileRepository.save(newProfile);
    }
    // Kay?t olan kullan?c?y? rolleriyle birlikte y?kle
    const {...createdUser} = savedUser;

    // Kullanıcıyı otomatik olarak giriş yap
    return this.login(createdUser);
  }



    //Admin panelinden kullan?c? kayd?(rol atamas? i?in)
    async adminRegister(registerDto: AdminRegisterDto) {
    // E-posta veya kullan?c? ad? kontrol?
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: registerDto.email },
        { first_name: registerDto.first_name },
        { phone_number: registerDto.phone_number },
      ],
    });

    if (existingUser) {
      if (existingUser.email === registerDto.email) {
        throw new UnauthorizedException(
          await this.i18n.translate('common.auth.email_exists'),
        );
      }
      if (existingUser.first_name === registerDto.first_name) {
        throw new UnauthorizedException(
          await this.i18n.translate('common.auth.username_exists'),
        );
      }
      if (existingUser.phone_number === registerDto.phone_number) {
        throw new UnauthorizedException(
          await this.i18n.translate('common.auth.phone_number_exists'),
        );
      }
    }


    // Rol? bul
    const role = await this.roleRepository.findOne({ where: { id: registerDto.roleId } });
    if (!role) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.role.not_found'),
      );
    }

    // Yeni kullan?c? olu?tur
    const newUser = this.userRepository.create({
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      email: registerDto.email,
      phone_number: registerDto.phone_number,
      roles: [role],
    });

    const savedUser = await this.userRepository.save(newUser);

    // Şifreyi hariç tutarak kullanıcıyı döndür
    const { password, ...createdUser } = savedUser as any;
    return createdUser;
  }



  async refreshToken(userId: string, sessionId: string, oldRefreshToken: string) {
    const accessExpiresIn = this.configService.get('JWT_EXPIRATION') ?? '15m';
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRATION') ?? '7d';
    const refreshTtlSeconds = Number(
      this.configService.get('JWT_REFRESH_EXPIRATION_SECONDS') ?? 60 * 60 * 24 * 7,
    );
    const refreshSecret =
      this.configService.get('JWT_REFRESH_SECRET') ?? this.configService.get('JWT_SECRET');
    // Redis etkin de?ilse hata d?nd?r
    if (!this.redisEnabled) {
      throw new BadRequestException(
        await this.i18n.translate('common.auth.redis_disabled'),
      );
    }

    // Redis'ten oturum bilgilerini al
    const sessionKey = `auth:${userId}:${sessionId}`;
    const sessionData = await this.redisService.get(sessionKey);

    if (!sessionData) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.auth.invalid_session'),
      );
    }

    const { refreshToken } = JSON.parse(sessionData);

    // Eski refresh token kontrol?
    if (refreshToken !== oldRefreshToken) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.auth.invalid_refresh_token'),
      );
    }

    // Kullanıcı bilgilerini al
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'first_name', 'email', 'phone_number','roles'],
    });

    if (!user) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.auth.user_not_found'),
      );
    }

    // Yeni tokenlar olu?tur
    const payload = { sub: user.id, username: user.first_name, sessionId };
    
    const accessToken = this.jwtService.sign(payload, { expiresIn: accessExpiresIn });
    const newRefreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    // Redis'teki oturum bilgilerini güncelle
    await this.redisService.set(
      sessionKey,
      JSON.stringify({ refreshToken: newRefreshToken }),
      refreshTtlSeconds,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user,
    };
  }

  async logout(userId: string, sessionId: string) {
    // Redis etkinse oturum bilgilerini sil
    if (this.redisEnabled) {
      await this.redisService.del(`auth:${userId}:${sessionId}`);
    }
    return true;
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const message = await this.i18n.translate('common.auth.password_reset_email_sent');

    if (!normalizedEmail) {
      return { ok: true, message };
    }

    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      select: [
        'id',
        'email',
        'first_name',
        'failed_login_attempts',
        'password_reset_token',
        'password_reset_expires_at',
      ],
    });

    if (!user) {
      return { ok: true, message };
    }

    if (Number(user.failed_login_attempts || 0) < MAX_FAILED_LOGIN_ATTEMPTS) {
      return { ok: true, message };
    }

    const rawToken = randomBytes(32).toString('hex');
    user.password_reset_token = this.hashResetToken(rawToken);
    user.password_reset_expires_at = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await this.userRepository.save(user);

    const sent = await this.mailService.sendPasswordResetMail(normalizedEmail, rawToken);
    if (!sent) {
      return { ok: true, message };
    }

    return { ok: true, message };
  }

  async resetPassword(token: string, password: string) {
    const rawToken = String(token || '').trim();
    if (!rawToken) {
      throw new BadRequestException(
        await this.i18n.translate('common.auth.password_reset_invalid_token'),
      );
    }

    const user = await this.userRepository.findOne({
      where: {
        password_reset_token: this.hashResetToken(rawToken),
        password_reset_expires_at: MoreThan(new Date()),
      },
      select: [
        'id',
        'password_hash',
        'failed_login_attempts',
        'password_reset_token',
        'password_reset_expires_at',
      ],
    });

    if (!user) {
      throw new BadRequestException(
        await this.i18n.translate('common.auth.password_reset_invalid_token'),
      );
    }

    user.password_hash = await bcrypt.hash(password, 10);
    user.failed_login_attempts = 0;
    user.password_reset_token = null;
    user.password_reset_expires_at = null;
    await this.userRepository.save(user);

    return {
      ok: true,
      message: await this.i18n.translate('common.auth.password_reset_success'),
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
      select: ['id', 'first_name', 'last_name', 'email', 'phone_number'],
    });
    if (!user) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.auth.user_not_found'),
      );
    }

    const profile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: fullName,
      display_name: fullName,
      email: user.email,
      phone_number: user.phone_number,
      roles: user.roles,
      avatar_url: profile?.avatar_url ?? null,
      birth_date: profile?.birth_date ?? null,
      gender: profile?.gender ?? null,
      account_type: profile?.account_type ?? AccountType.Client,
      dietitian_verification_status:
        profile?.dietitian_verification_status ?? DietitianVerificationStatus.NotSubmitted,
      clinic_id: profile?.clinic_id ?? null,
      clinic_name: profile?.clinic_name ?? null,
      clinic_city: profile?.clinic_city ?? null,
      clinic_address: profile?.clinic_address ?? null,
      verification_note: profile?.verification_note ?? null,
      verification_review_note: profile?.verification_review_note ?? null,
      verification_submitted_at: profile?.verification_submitted_at ?? null,
      verification_reviewed_at: profile?.verification_reviewed_at ?? null,
      verification_reviewed_by: profile?.verification_reviewed_by ?? null,
    };
  }

  private async ensureUserProfile(userId: string) {
    let profile = await this.userProfileRepository.findOne({ where: { user_id: userId } });
    if (profile) return profile;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'first_name', 'last_name'],
    });
    if (!user) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.auth.user_not_found'),
      );
    }

    profile = this.userProfileRepository.create({
      user_id: userId,
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      birth_date: null,
      gender: null,
      avatar_url: null,
      account_type: AccountType.Client,
      dietitian_verification_status: DietitianVerificationStatus.Approved,
      clinic_name: null,
      clinic_city: null,
      clinic_address: null,
      verification_note: null,
      verification_review_note: null,
      verification_submitted_at: null,
      verification_reviewed_at: null,
      verification_reviewed_by: null,
    });
    return this.userProfileRepository.save(profile);
  }

  async updateAvatar(userId: string, avatarUrl: string | null) {
    const profile = await this.ensureUserProfile(userId);
    profile.avatar_url = avatarUrl;
    await this.userProfileRepository.save(profile);
    return this.getProfile(userId);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
      select: ['id', 'first_name', 'last_name', 'email', 'phone_number'],
    });
    if (!user) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.auth.user_not_found'),
      );
    }

    const profile = await this.ensureUserProfile(userId);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existing && existing.id !== userId) {
        throw new UnauthorizedException(await this.i18n.translate('common.auth.email_exists'));
      }
      user.email = dto.email;
    }

    if (dto.phone_number && dto.phone_number !== user.phone_number) {
      const existing = await this.userRepository.findOne({ where: { phone_number: dto.phone_number } });
      if (existing && existing.id !== userId) {
        throw new UnauthorizedException(await this.i18n.translate('common.auth.phone_number_exists'));
      }
      user.phone_number = dto.phone_number;
    }

    if (dto.first_name) {
      user.first_name = dto.first_name;
      profile.first_name = dto.first_name;
    }
    if (dto.last_name) {
      user.last_name = dto.last_name;
      profile.last_name = dto.last_name;
    }
    if (dto.birth_date) {
      const birthDate = new Date(dto.birth_date);
      if (Number.isNaN(birthDate.getTime())) {
        throw new BadRequestException('Birth date format is invalid');
      }
      if (this.getAge(birthDate) < 18) {
        throw new BadRequestException('You must be at least 18 years old');
      }
      profile.birth_date = dto.birth_date as any;
    }
    if (dto.gender) {
      profile.gender = dto.gender;
    }

    await this.userRepository.save(user);
    await this.userProfileRepository.save(profile);

    return this.getProfile(userId);
  }

  async updateClientClinic(userId: string, clinicId: string) {
    const profile = await this.ensureUserProfile(userId);
    
    if (profile.account_type !== AccountType.Client) {
      throw new BadRequestException('Only clients can select a clinic');
    }

    profile.clinic_id = clinicId;
    await this.userProfileRepository.save(profile);

    // Otomatik atama sürecini tetikle
    await this.autoAssignToDietitian(userId, clinicId);

    return this.getProfile(userId);
  }

  async submitDietitianVerification(userId: string, dto: SubmitDietitianVerificationDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) {
      throw new UnauthorizedException(await this.i18n.translate('common.auth.user_not_found'));
    }

    const dietitianRole = await this.roleRepository.findOne({ where: { name: 'Diyetisyen' } });
    if (dietitianRole && !this.hasRole(user, 'Diyetisyen')) {
      user.roles = [...(user.roles || []), dietitianRole];
      await this.userRepository.save(user);
    }

    const profile = await this.ensureUserProfile(userId);
    profile.account_type = AccountType.Dietitian;
    profile.dietitian_verification_status = DietitianVerificationStatus.Pending;
    profile.clinic_id = dto.clinic_id ?? null;
    profile.clinic_name = dto.clinic_name.trim();
    profile.clinic_city = dto.clinic_city.trim();
    profile.clinic_address = dto.clinic_address.trim();
    profile.verification_note = dto.verification_note?.trim() || null;
    if (dto.certificate_url) {
      profile.certificate_url = dto.certificate_url;
    }
    profile.verification_review_note = null;
    profile.verification_submitted_at = new Date();
    profile.verification_reviewed_at = null;
    profile.verification_reviewed_by = null;
    await this.userProfileRepository.save(profile);

    return {
      ok: true,
      status: profile.dietitian_verification_status,
      submitted_at: profile.verification_submitted_at,
    };
  }

  async getDietitianVerificationStatus(userId: string) {
    const profile = await this.ensureUserProfile(userId);
    return {
      account_type: profile.account_type ?? AccountType.Client,
      status: profile.dietitian_verification_status ?? DietitianVerificationStatus.NotSubmitted,
      clinic_name: profile.clinic_name ?? null,
      clinic_city: profile.clinic_city ?? null,
      clinic_address: profile.clinic_address ?? null,
      verification_note: profile.verification_note ?? null,
      review_note: profile.verification_review_note ?? null,
      submitted_at: profile.verification_submitted_at ?? null,
      reviewed_at: profile.verification_reviewed_at ?? null,
      reviewed_by: profile.verification_reviewed_by ?? null,
    };
  }

  private normalizePaging(page?: number, limit?: number) {
    const normalizedPage = Number.isFinite(page as number) ? Number(page) : 1;
    const normalizedLimit = Number.isFinite(limit as number) ? Number(limit) : 10;
    const safePage = Math.max(1, Math.trunc(normalizedPage || 1));
    const safeLimit = Math.min(50, Math.max(1, Math.trunc(normalizedLimit || 10)));
    return { page: safePage, limit: safeLimit };
  }

  async listDietitianApplications(options: ListDietitianApplicationsOptions = {}) {
    const { status, search, city, sort, page, limit } = options;
    const normalizedStatus =
      String(status || '').trim().toLowerCase() === DietitianVerificationStatus.Rejected
        ? DietitianVerificationStatus.Rejected
        : DietitianVerificationStatus.Pending;
    const normalizedSort = String(sort || '').trim().toLowerCase() === 'oldest' ? 'ASC' : 'DESC';
    const { page: safePage, limit: safeLimit } = this.normalizePaging(page, limit);
    const normalizedSearch = String(search || '').trim().toLowerCase();
    const normalizedCity = String(city || '').trim().toLowerCase();

    const query = this.userProfileRepository
      .createQueryBuilder('profile')
      .leftJoin(User, 'user', 'user.id = profile.user_id')
      .where('profile.account_type = :accountType', { accountType: AccountType.Dietitian })
      .andWhere('profile.dietitian_verification_status = :status', { status: normalizedStatus });

    if (normalizedCity) {
      query.andWhere('LOWER(COALESCE(profile.clinic_city, \'\')) = :city', { city: normalizedCity });
    }

    if (normalizedSearch) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(COALESCE(user.first_name, \'\')) LIKE :search', { search: `%${normalizedSearch}%` })
            .orWhere('LOWER(COALESCE(user.last_name, \'\')) LIKE :search', { search: `%${normalizedSearch}%` })
            .orWhere('LOWER(COALESCE(user.email, \'\')) LIKE :search', { search: `%${normalizedSearch}%` })
            .orWhere('LOWER(COALESCE(user.phone_number, \'\')) LIKE :search', { search: `%${normalizedSearch}%` })
            .orWhere('LOWER(COALESCE(profile.clinic_name, \'\')) LIKE :search', { search: `%${normalizedSearch}%` })
            .orWhere('LOWER(COALESCE(profile.clinic_city, \'\')) LIKE :search', { search: `%${normalizedSearch}%` });
        }),
      );
    }

    query
      .orderBy('profile.verification_submitted_at', normalizedSort as 'ASC' | 'DESC')
      .addOrderBy('profile.createdAt', normalizedSort as 'ASC' | 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    const [profiles, total] = await query.getManyAndCount();
    const userIds = profiles.map((p) => p.user_id);
    if (userIds.length === 0) {
      return {
        items: [],
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      };
    }

    const users = await this.userRepository.find({
      where: { id: In(userIds) },
      relations: ['roles'],
    });
    const usersById = new Map(users.map((u) => [u.id, u]));

    const items = profiles.map((p) => {
      const user = usersById.get(p.user_id);
      return {
        user_id: p.user_id,
        first_name: user?.first_name ?? '',
        last_name: user?.last_name ?? '',
        email: user?.email ?? null,
        phone_number: user?.phone_number ?? null,
        roles: (user?.roles || []).map((r) => r.name),
        clinic_name: p.clinic_name,
        clinic_city: p.clinic_city,
        clinic_address: p.clinic_address,
        verification_note: p.verification_note,
        review_note: p.verification_review_note,
        submitted_at: p.verification_submitted_at,
        reviewed_at: p.verification_reviewed_at,
      };
    });

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async listDietitianApplicationHistory(options: ListHistoryOptions = {}) {
    const { page, limit } = options;
    const { page: safePage, limit: safeLimit } = this.normalizePaging(page, limit);

    const query = this.userProfileRepository
      .createQueryBuilder('profile')
      .leftJoin(User, 'user', 'user.id = profile.user_id')
      .where('profile.account_type = :accountType', { accountType: AccountType.Dietitian })
      .andWhere('profile.dietitian_verification_status IN (:...statuses)', {
        statuses: [DietitianVerificationStatus.Approved, DietitianVerificationStatus.Rejected],
      })
      .andWhere('profile.verification_reviewed_at IS NOT NULL')
      .orderBy('profile.verification_reviewed_at', 'DESC')
      .addOrderBy('profile.updatedAt', 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    const [profiles, total] = await query.getManyAndCount();
    const userIds = profiles.map((p) => p.user_id);

    const users =
      userIds.length > 0
        ? await this.userRepository.find({
            where: { id: In(userIds) },
            relations: ['roles'],
          })
        : [];
    const usersById = new Map(users.map((u) => [u.id, u]));

    const items = profiles.map((p) => {
      const user = usersById.get(p.user_id);
      return {
        user_id: p.user_id,
        first_name: user?.first_name ?? '',
        last_name: user?.last_name ?? '',
        email: user?.email ?? null,
        phone_number: user?.phone_number ?? null,
        clinic_name: p.clinic_name ?? null,
        clinic_city: p.clinic_city ?? null,
        action:
          p.dietitian_verification_status === DietitianVerificationStatus.Approved
            ? 'approved'
            : 'rejected',
        review_note: p.verification_review_note ?? null,
        reviewed_at: p.verification_reviewed_at ?? null,
        reviewed_by: p.verification_reviewed_by ?? null,
      };
    });

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async listClinicDietitians(options: ListClinicDietitiansOptions = {}) {
    const { search, city, sort, page, limit } = options;
    const normalizedSort = String(sort || '').trim().toLowerCase() === 'oldest' ? 'ASC' : 'DESC';
    const { page: safePage, limit: safeLimit } = this.normalizePaging(page, limit);
    const normalizedSearch = String(search || '').trim().toLowerCase();
    const normalizedCity = String(city || '').trim().toLowerCase();

    const query = this.userProfileRepository
      .createQueryBuilder('profile')
      .leftJoin(User, 'user', 'user.id = profile.user_id')
      .where('profile.account_type = :accountType', { accountType: AccountType.Dietitian })
      .andWhere('profile.dietitian_verification_status = :status', {
        status: DietitianVerificationStatus.Approved,
      });

    if (normalizedCity) {
      query.andWhere('LOWER(COALESCE(profile.clinic_city, \'\')) = :city', { city: normalizedCity });
    }

    if (normalizedSearch) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(COALESCE(user.first_name, \'\')) LIKE :search', { search: `%${normalizedSearch}%` })
            .orWhere('LOWER(COALESCE(user.last_name, \'\')) LIKE :search', { search: `%${normalizedSearch}%` })
            .orWhere('LOWER(COALESCE(user.email, \'\')) LIKE :search', { search: `%${normalizedSearch}%` })
            .orWhere('LOWER(COALESCE(user.phone_number, \'\')) LIKE :search', { search: `%${normalizedSearch}%` })
            .orWhere('LOWER(COALESCE(profile.clinic_name, \'\')) LIKE :search', { search: `%${normalizedSearch}%` })
            .orWhere('LOWER(COALESCE(profile.clinic_city, \'\')) LIKE :search', { search: `%${normalizedSearch}%` });
        }),
      );
    }

    query
      .orderBy('profile.verification_reviewed_at', normalizedSort as 'ASC' | 'DESC')
      .addOrderBy('profile.updatedAt', normalizedSort as 'ASC' | 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    const [profiles, total] = await query.getManyAndCount();
    const userIds = profiles.map((p) => p.user_id);
    const users =
      userIds.length > 0
        ? await this.userRepository.find({
            where: { id: In(userIds) },
            relations: ['roles'],
          })
        : [];
    const usersById = new Map(users.map((u) => [u.id, u]));

    const items = profiles.map((p) => {
      const user = usersById.get(p.user_id);
      return {
        user_id: p.user_id,
        first_name: user?.first_name ?? '',
        last_name: user?.last_name ?? '',
        email: user?.email ?? null,
        phone_number: user?.phone_number ?? null,
        roles: (user?.roles || []).map((r) => r.name),
        clinic_name: p.clinic_name ?? null,
        clinic_city: p.clinic_city ?? null,
        clinic_address: p.clinic_address ?? null,
        verification_note: p.verification_note ?? null,
        reviewed_at: p.verification_reviewed_at ?? null,
        is_active: Boolean(user?.is_active),
        is_verified: Boolean(user?.is_verified),
        last_login: user?.last_login ?? null,
      };
    });

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async listAdminUsers(options: ListAdminUsersOptions = {}) {
    const { search, accountType, page, limit } = options;
    const normalizedAccountType =
      String(accountType || '').trim().toLowerCase() === AccountType.Dietitian
        ? AccountType.Dietitian
        : String(accountType || '').trim().toLowerCase() === AccountType.Client
          ? AccountType.Client
          : 'all';
    const normalizedSearch = String(search || '').trim().toLowerCase();
    const { page: safePage, limit: safeLimit } = this.normalizePaging(page, limit);

    const query = this.userProfileRepository
      .createQueryBuilder('profile')
      .leftJoin(User, 'user', 'user.id = profile.user_id');

    if (normalizedAccountType !== 'all') {
      query.andWhere('profile.account_type = :accountType', { accountType: normalizedAccountType });
    }

    if (normalizedSearch) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(COALESCE(user.first_name, \'\')) LIKE :search', { search: `%${normalizedSearch}%` })
            .orWhere('LOWER(COALESCE(user.last_name, \'\')) LIKE :search', { search: `%${normalizedSearch}%` })
            .orWhere('LOWER(COALESCE(user.email, \'\')) LIKE :search', { search: `%${normalizedSearch}%` })
            .orWhere('LOWER(COALESCE(user.phone_number, \'\')) LIKE :search', { search: `%${normalizedSearch}%` })
            .orWhere('LOWER(COALESCE(profile.clinic_name, \'\')) LIKE :search', { search: `%${normalizedSearch}%` })
            .orWhere('LOWER(COALESCE(profile.clinic_city, \'\')) LIKE :search', { search: `%${normalizedSearch}%` });
        }),
      );
    }

    query
      .orderBy('profile.createdAt', 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    const [profiles, total] = await query.getManyAndCount();
    const userIds = profiles.map((profile) => profile.user_id);
    if (userIds.length === 0) {
      return {
        items: [],
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      };
    }

    const users = await this.userRepository.find({
      where: { id: In(userIds) },
      relations: ['roles'],
    });
    const usersById = new Map(users.map((user) => [user.id, user]));

    const activeSubscriptions = await this.subscriptionRepository.find({
      where: [
        { client_id: In(userIds), status: SubscriptionStatus.Active },
        { dietitian_id: In(userIds), status: SubscriptionStatus.Active },
      ],
    });

    const partnerIds = Array.from(
      new Set(
        activeSubscriptions.flatMap((subscription) => [subscription.client_id, subscription.dietitian_id]).filter(Boolean),
      ),
    );
    const partnerUsers =
      partnerIds.length > 0
        ? await this.userRepository.find({
            where: { id: In(partnerIds) },
            relations: ['roles'],
          })
        : [];
    const partnerProfiles =
      partnerIds.length > 0
        ? await this.userProfileRepository.find({
            where: { user_id: In(partnerIds) },
          })
        : [];

    const partnerUsersById = new Map(partnerUsers.map((user) => [user.id, user]));
    const partnerProfilesById = new Map(partnerProfiles.map((profile) => [profile.user_id, profile]));
    const activeSubscriptionByClient = new Map(
      activeSubscriptions
        .filter((subscription) => subscription.status === SubscriptionStatus.Active)
        .map((subscription) => [subscription.client_id, subscription]),
    );
    const activeSubscriptionCountByDietitian = new Map<string, number>();
    for (const subscription of activeSubscriptions.filter((item) => item.status === SubscriptionStatus.Active)) {
      activeSubscriptionCountByDietitian.set(
        subscription.dietitian_id,
        (activeSubscriptionCountByDietitian.get(subscription.dietitian_id) || 0) + 1,
      );
    }

    const items = profiles.map((profile) => {
      const user = usersById.get(profile.user_id);
      const activeSubscription = activeSubscriptionByClient.get(profile.user_id);
      const linkedDietitianUser = activeSubscription
        ? partnerUsersById.get(activeSubscription.dietitian_id)
        : null;
      const linkedDietitianProfile = activeSubscription
        ? partnerProfilesById.get(activeSubscription.dietitian_id)
        : null;

      return {
        user_id: profile.user_id,
        first_name: user?.first_name ?? profile.first_name ?? '',
        last_name: user?.last_name ?? profile.last_name ?? '',
        email: user?.email ?? null,
        phone_number: user?.phone_number ?? null,
        roles: (user?.roles || []).map((role) => role.name),
        account_type: profile.account_type,
        dietitian_verification_status: profile.dietitian_verification_status,
        clinic_name: profile.clinic_name ?? null,
        clinic_city: profile.clinic_city ?? null,
        is_active: Boolean(user?.is_active),
        is_verified: Boolean(user?.is_verified),
        last_login: user?.last_login ?? null,
        assigned_dietitian_id: activeSubscription?.dietitian_id ?? null,
        assigned_dietitian_name: linkedDietitianUser
          ? [linkedDietitianUser.first_name, linkedDietitianUser.last_name].filter(Boolean).join(' ').trim() ||
            linkedDietitianUser.email ||
            linkedDietitianProfile?.clinic_name ||
            null
          : null,
        assigned_clients_count:
          profile.account_type === AccountType.Dietitian
            ? Number(activeSubscriptionCountByDietitian.get(profile.user_id) || 0)
            : 0,
      };
    });

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async listAdminConnections(options: ListAdminConnectionsOptions = {}) {
    const { search, page, limit } = options;
    const normalizedSearch = String(search || '').trim().toLowerCase();
    const { page: safePage, limit: safeLimit } = this.normalizePaging(page, limit);

    const subscriptions = await this.subscriptionRepository.find({
      where: { status: SubscriptionStatus.Active },
      order: { updated_at: 'DESC' },
    });

    const userIds = Array.from(
      new Set(subscriptions.flatMap((subscription) => [subscription.client_id, subscription.dietitian_id]).filter(Boolean)),
    );
    const users =
      userIds.length > 0
        ? await this.userRepository.find({
            where: { id: In(userIds) },
            relations: ['roles'],
          })
        : [];
    const profiles =
      userIds.length > 0
        ? await this.userProfileRepository.find({
            where: { user_id: In(userIds) },
          })
        : [];

    const usersById = new Map(users.map((user) => [user.id, user]));
    const profilesById = new Map(profiles.map((profile) => [profile.user_id, profile]));

    const allItems = subscriptions
      .map((subscription) => {
        const clientUser = usersById.get(subscription.client_id);
        const dietitianUser = usersById.get(subscription.dietitian_id);
        const dietitianProfile = profilesById.get(subscription.dietitian_id);

        return {
          id: subscription.id,
          client_id: subscription.client_id,
          client_name:
            [clientUser?.first_name, clientUser?.last_name].filter(Boolean).join(' ').trim() ||
            clientUser?.email ||
            subscription.client_id,
          client_email: clientUser?.email ?? null,
          dietitian_id: subscription.dietitian_id,
          dietitian_name:
            [dietitianUser?.first_name, dietitianUser?.last_name].filter(Boolean).join(' ').trim() ||
            dietitianUser?.email ||
            dietitianProfile?.clinic_name ||
            subscription.dietitian_id,
          dietitian_email: dietitianUser?.email ?? null,
          clinic_name: dietitianProfile?.clinic_name ?? null,
          clinic_city: dietitianProfile?.clinic_city ?? null,
          start_date: subscription.start_date,
          notes: subscription.notes ?? null,
        };
      })
      .filter((item) => {
        if (!normalizedSearch) return true;
        return [item.client_name, item.client_email, item.dietitian_name, item.dietitian_email, item.clinic_name, item.clinic_city]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      });

    const total = allItems.length;
    const items = allItems.slice((safePage - 1) * safeLimit, safePage * safeLimit);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async assignClientToDietitian(adminId: string, dto: AssignClientDietitianDto) {
    const clientProfile = await this.userProfileRepository.findOne({ where: { user_id: dto.client_id } });
    if (!clientProfile || clientProfile.account_type !== AccountType.Client) {
      throw new BadRequestException('Client not found');
    }

    const dietitianProfile = await this.userProfileRepository.findOne({ where: { user_id: dto.dietitian_id } });
    if (
      !dietitianProfile ||
      dietitianProfile.account_type !== AccountType.Dietitian ||
      dietitianProfile.dietitian_verification_status !== DietitianVerificationStatus.Approved
    ) {
      throw new BadRequestException('Dietitian must be approved before assignment');
    }

    const clientUser = await this.userRepository.findOne({ where: { id: dto.client_id }, relations: ['roles'] });
    const dietitianUser = await this.userRepository.findOne({
      where: { id: dto.dietitian_id },
      relations: ['roles'],
    });
    if (!clientUser || !dietitianUser) {
      throw new UnauthorizedException(await this.i18n.translate('common.auth.user_not_found'));
    }
    if (!clientUser.is_active || !dietitianUser.is_active) {
      throw new BadRequestException('Both client and dietitian must be active');
    }

    const existingClientSubscriptions = await this.subscriptionRepository.find({
      where: { client_id: dto.client_id },
    });

    for (const subscription of existingClientSubscriptions) {
      if (subscription.dietitian_id !== dto.dietitian_id && subscription.status === SubscriptionStatus.Active) {
        subscription.status = SubscriptionStatus.Paused;
        subscription.end_date = new Date();
        await this.subscriptionRepository.save(subscription);
      }
    }

    const cleanNotes = String(dto.notes || '').trim();
    let activeSubscription =
      existingClientSubscriptions.find((subscription) => subscription.dietitian_id === dto.dietitian_id) || null;

    if (activeSubscription) {
      activeSubscription.status = SubscriptionStatus.Active;
      activeSubscription.start_date = activeSubscription.start_date || new Date();
      activeSubscription.end_date = null;
      activeSubscription.notes = cleanNotes || activeSubscription.notes || `Assigned by admin ${adminId}`;
      activeSubscription = await this.subscriptionRepository.save(activeSubscription);
    } else {
      activeSubscription = await this.subscriptionRepository.save(
        this.subscriptionRepository.create({
          client_id: dto.client_id,
          dietitian_id: dto.dietitian_id,
          clinic_id: null,
          start_date: new Date(),
          end_date: null,
          status: SubscriptionStatus.Active,
          notes: cleanNotes || `Assigned by admin ${adminId}`,
        }),
      );
    }

    const existingRoom = await this.chatRoomRepository.findOne({
      where: { client_id: dto.client_id, dietitian_id: dto.dietitian_id },
    });

    if (existingRoom) {
      existingRoom.is_active = true;
      await this.chatRoomRepository.save(existingRoom);
    } else {
      await this.chatRoomRepository.save(
        this.chatRoomRepository.create({
          client_id: dto.client_id,
          dietitian_id: dto.dietitian_id,
          is_active: true,
        }),
      );
    }

    const existingAssignment = await this.userAssignedDietitianRepository.findOne({
      where: { clientId: dto.client_id },
    });

    if (existingAssignment) {
      existingAssignment.dietitianId = dto.dietitian_id;
      existingAssignment.clinicId = dietitianProfile.clinic_id || null;
      existingAssignment.assignedAt = new Date();
      await this.userAssignedDietitianRepository.save(existingAssignment);
    } else {
      const newAssignment = this.userAssignedDietitianRepository.create({
        clientId: dto.client_id,
        dietitianId: dto.dietitian_id,
        clinicId: dietitianProfile.clinic_id || null,
        assignedAt: new Date(),
      });
      await this.userAssignedDietitianRepository.save(newAssignment);
    }

    await this.notificationsService.create(
      dto.client_id,
      'Yeni Diyetisyen Ataması',
      'Size yeni bir diyetisyen atandı. Sağlıklı yaşam yolculuğunuzda başarılar dileriz.'
    );
    await this.notificationsService.create(
      dto.dietitian_id,
      'Yeni Danışan Ataması',
      'Size yeni bir danışan atandı. Hemen program oluşturabilirsiniz.'
    );

    return {
      ok: true,
      subscription_id: activeSubscription.id,
      client_id: dto.client_id,
      dietitian_id: dto.dietitian_id,
      status: activeSubscription.status,
      assigned_at: activeSubscription.updated_at,
    };
  }

  async getProfessionalWorkspace(userId: string) {
    const profile = await this.ensureUserProfile(userId);
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['roles'] });
    const roleNames = (user?.roles || []).map((role) => role.name);
    const isAdmin = roleNames.includes('admin');
    const isClinicManager = roleNames.includes('clinic_manager');

    if (profile.account_type === AccountType.Client) {
      const subscription = await this.subscriptionRepository.findOne({
        where: { client_id: userId, status: SubscriptionStatus.Active },
        order: { updated_at: 'DESC' },
      });

      if (!subscription) {
        return {
          account_type: profile.account_type,
          assignedDietitian: null,
          clients: [],
          isAdmin,
          isClinicManager,
        };
      }

      const dietitianUser = await this.userRepository.findOne({ where: { id: subscription.dietitian_id } });
      const dietitianProfile = await this.userProfileRepository.findOne({
        where: { user_id: subscription.dietitian_id },
      });

      return {
        account_type: profile.account_type,
        assignedDietitian: {
          user_id: subscription.dietitian_id,
          name:
            [dietitianUser?.first_name, dietitianUser?.last_name].filter(Boolean).join(' ').trim() ||
            dietitianUser?.email ||
            dietitianProfile?.clinic_name ||
            null,
          email: dietitianUser?.email ?? null,
          clinic_name: dietitianProfile?.clinic_name ?? null,
          clinic_city: dietitianProfile?.clinic_city ?? null,
          notes: subscription.notes ?? null,
        },
        clients: [],
        isAdmin,
        isClinicManager,
      };
    }

    if (profile.account_type === AccountType.Dietitian || isAdmin || isClinicManager) {
      // Diyetisyen ise veya yetkili ise, kendisine bağlı danışanları çek
      const assignments = await this.userAssignedDietitianRepository.find({
        where: { dietitianId: userId },
        order: { assignedAt: 'DESC' },
      });
      
      const clientIds = assignments.map((a) => a.clientId);
      const clientUsers =
        clientIds.length > 0
          ? await this.userRepository.find({
              where: { id: In(clientIds) },
            })
          : [];
      const clientProfiles =
        clientIds.length > 0
          ? await this.userProfileRepository.find({
              where: { user_id: In(clientIds) },
            })
          : [];
      const clientUsersById = new Map(clientUsers.map((client) => [client.id, client]));
      const clientProfilesById = new Map(clientProfiles.map((client) => [client.user_id, client]));

      return {
        account_type: profile.account_type,
        assignedDietitian: null,
        clients: assignments.map((a) => {
          const clientUser = clientUsersById.get(a.clientId);
          const clientProfile = clientProfilesById.get(a.clientId);
          return {
            user_id: a.clientId,
            name:
              [clientUser?.first_name, clientUser?.last_name].filter(Boolean).join(' ').trim() ||
              clientUser?.email ||
              a.clientId,
            email: clientUser?.email ?? null,
            phone_number: clientUser?.phone_number ?? null,
            notes: null, // Relation tablosunda not yoksa null
            birth_date: clientProfile?.birth_date ?? null,
            assignedAt: a.assignedAt,
          };
        }),
        isAdmin,
        isClinicManager,
      };
    }

    return {
      account_type: profile.account_type,
      assignedDietitian: null,
      clients: [],
      isAdmin,
      isClinicManager,
    };
  }

  async updateClinicDietitianActivation(userId: string, isActive: boolean) {
    const profile = await this.userProfileRepository.findOne({ where: { user_id: userId } });
    if (!profile || profile.account_type !== AccountType.Dietitian) {
      throw new BadRequestException('Dietitian not found');
    }
    if (profile.dietitian_verification_status !== DietitianVerificationStatus.Approved) {
      throw new BadRequestException('Only approved dietitians can be managed');
    }

    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['roles'] });
    if (!user) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.auth.user_not_found'),
      );
    }

    user.is_active = Boolean(isActive);
    await this.userRepository.save(user);

    return {
      ok: true,
      user_id: userId,
      is_active: user.is_active,
    };
  }

  async approveDietitianApplication(adminId: string, userId: string) {
    const profile = await this.userProfileRepository.findOne({ where: { user_id: userId } });
    if (!profile || profile.account_type !== AccountType.Dietitian) {
      throw new BadRequestException('Dietitian application not found');
    }

    profile.dietitian_verification_status = DietitianVerificationStatus.Approved;
    profile.verification_review_note = null;
    profile.verification_reviewed_at = new Date();
    profile.verification_reviewed_by = adminId;
    await this.userProfileRepository.save(profile);

    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['roles'] });
    if (user) {
    const dietitianRole = await this.roleRepository.findOne({ where: { name: 'Diyetisyen' } });
    if (dietitianRole && !this.hasRole(user, 'Diyetisyen')) {
      user.roles = [...(user.roles || []), dietitianRole];
    }
      user.is_active = true;
      user.is_verified = true;
      await this.userRepository.save(user);
    }

    return {
      ok: true,
      user_id: userId,
      status: profile.dietitian_verification_status,
      reviewed_at: profile.verification_reviewed_at,
    };
  }

  async rejectDietitianApplication(adminId: string, userId: string, reason: string) {
    const profile = await this.userProfileRepository.findOne({ where: { user_id: userId } });
    if (!profile || profile.account_type !== AccountType.Dietitian) {
      throw new BadRequestException('Dietitian application not found');
    }

    const cleanReason = String(reason || '').trim();
    if (!cleanReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    profile.dietitian_verification_status = DietitianVerificationStatus.Rejected;
    profile.verification_review_note = cleanReason;
    profile.verification_reviewed_at = new Date();
    profile.verification_reviewed_by = adminId;
    await this.userProfileRepository.save(profile);

    return {
      ok: true,
      user_id: userId,
      status: profile.dietitian_verification_status,
      reviewed_at: profile.verification_reviewed_at,
      review_note: profile.verification_review_note,
    };
  }

  private async tableExists(tableName: string): Promise<boolean> {
    const rows = await this.userRepository.query(
      `SELECT to_regclass($1) AS reg`,
      [`public.${tableName}`],
    );
    return Boolean(rows?.[0]?.reg);
  }

  private async safeCount(tableName: string, whereClause = '', params: any[] = []): Promise<number> {
    const exists = await this.tableExists(tableName);
    if (!exists) return 0;
    const query = `SELECT COUNT(*)::int AS count FROM ${tableName} ${whereClause}`;
    const rows = await this.userRepository.query(query, params);
    return Number(rows?.[0]?.count ?? 0);
  }

  async getDashboardSummary(userId: string) {
    const activeClients = await this.safeCount('users', 'WHERE id <> $1 AND is_active = true', [userId]);
    const plans = await this.safeCount('diet_plans');
    const messages = await this.safeCount('messages');

    let adherence = 0;
    const trackingExists = await this.tableExists('meal_tracking');
    if (trackingExists) {
      const rows = await this.userRepository.query(
        `SELECT
          COALESCE(SUM(CASE WHEN is_consumed = true THEN 1 ELSE 0 END),0)::float AS consumed,
          COALESCE(COUNT(*),0)::float AS total
         FROM meal_tracking`,
      );
      const consumed = Number(rows?.[0]?.consumed ?? 0);
      const total = Number(rows?.[0]?.total ?? 0);
      adherence = total > 0 ? Math.round((consumed / total) * 100) : 0;
    }

    return {
      activeClients,
      plans,
      messages,
      adherence,
    };
  }

  async getPublicLandingStats() {
    const totalDietitians = await this.safeCount(
      'user_profiles',
      'WHERE account_type = $1',
      [AccountType.Dietitian],
    );
    const approvedDietitians = await this.safeCount(
      'user_profiles',
      'WHERE account_type = $1 AND dietitian_verification_status = $2',
      [AccountType.Dietitian, DietitianVerificationStatus.Approved],
    );
    const totalUsers = await this.safeCount('users');
    const activeUsers = await this.safeCount('users', 'WHERE is_active = true');
    const totalPlans = await this.safeCount('diet_plans');
    const totalMeasurements = await this.safeCount('measurements');

    return {
      totalDietitians,
      approvedDietitians,
      totalUsers,
      activeUsers,
      totalPlans,
      totalMeasurements,
    };
  }

  async autoAssignToDietitian(clientId: string, clinicId?: string) {
    console.log(
      `[AutoAssign] Starting assignment for client ${clientId}${clinicId ? ` in clinic ${clinicId}` : ' (Global)'}`,
    );

    // Potansiyel diyetisyenleri bul (sadece onaylı olanlar)
    const whereClause: any = {
      account_type: AccountType.Dietitian,
      dietitian_verification_status: DietitianVerificationStatus.Approved,
    };
    if (clinicId) {
      whereClause.clinic_id = clinicId;
    }

    const dietitians = await this.userProfileRepository.find({ where: whereClause });

    if (dietitians.length === 0) {
      console.log(`[AutoAssign] No approved dietitians found for assignment.`);
      // Fallback: Klinik bazlı aramada bulunamadıysa global havuzdan dene
      if (clinicId) {
        console.log(`[AutoAssign] Fallback to global pool...`);
        return this.autoAssignToDietitian(clientId);
      }
      return;
    }

    console.log(`[AutoAssign] Candidates: ${dietitians.length} approved dietitians.`);

    // Mevcut iş yüklerini (danışan sayılarını) çek
    const dietitianIds = dietitians.map((d) => d.user_id);
    const workloads = await this.userAssignedDietitianRepository
      .createQueryBuilder('assignment')
      .select('assignment.dietitianId', 'dietitianId')
      .addSelect('COUNT(assignment.id)', 'count')
      .where('assignment.dietitianId IN (:...ids)', { ids: dietitianIds })
      .groupBy('assignment.dietitianId')
      .getRawMany();

    const workloadMap = new Map<string, number>(
      workloads.map((w) => [w.dietitianId, parseInt(w.count, 10)]),
    );

    // İş yükü olmayanları 0 olarak ata
    dietitians.forEach((d) => {
      if (!workloadMap.has(d.user_id)) {
        workloadMap.set(d.user_id, 0);
      }
    });

    // Minimum iş yükünü bul
    const loadValues = Array.from(workloadMap.values());
    const minLoad = Math.min(...loadValues);

    // Minimum iş yüküne sahip tüm diyetisyenleri filtrele
    const candidatesWithMinLoad = dietitians.filter(
      (d) => workloadMap.get(d.user_id) === minLoad,
    );

    // Rastgele birini seç
    const selectedDietitian =
      candidatesWithMinLoad[Math.floor(Math.random() * candidatesWithMinLoad.length)];

    console.log(
      `[AutoAssign] Selected dietitian ${selectedDietitian.user_id} with load ${minLoad} among ${candidatesWithMinLoad.length} equals.`,
    );
    await this.performAssignment(clientId, selectedDietitian.user_id, selectedDietitian.clinic_id);
  }

  private async performAssignment(
    clientId: string,
    dietitianId: string,
    clinicId: string | null,
  ) {
    // 1. Atama Kaydı (user_assigned_dietitian)
    const assignment = this.userAssignedDietitianRepository.create({
      clientId: clientId,
      dietitianId: dietitianId,
      clinicId: clinicId,
    });
    await this.userAssignedDietitianRepository.save(assignment);

    // 2. Abonelik Kaydı (Subscription - Dashboard görünürlüğü için kritik)
    const subscription = this.subscriptionRepository.create({
      client_id: clientId,
      dietitian_id: dietitianId,
      clinic_id: clinicId,
      status: SubscriptionStatus.Active,
      start_date: new Date(),
      notes: 'Sistem tarafından otomatik atandı',
    });
    await this.subscriptionRepository.save(subscription);

    // 3. Sohbet Odası (Chat Room)
    const existingRoom = await this.chatRoomRepository.findOne({
      where: { client_id: clientId, dietitian_id: dietitianId },
    });
    if (!existingRoom) {
      const room = this.chatRoomRepository.create({
        client_id: clientId,
        dietitian_id: dietitianId,
        is_active: true,
      });
      await this.chatRoomRepository.save(room);
    } else {
      existingRoom.is_active = true;
      await this.chatRoomRepository.save(existingRoom);
    }

    console.log(
      `[AutoAssign] Full sync completed for client ${clientId} <-> dietitian ${dietitianId}`,
    );

    await this.notificationsService.create(
      clientId,
      'Yeni Diyetisyen Ataması',
      'Size yeni bir diyetisyen atandı. Sağlıklı yaşam yolculuğunuzda başarılar dileriz.'
    );
    await this.notificationsService.create(
      dietitianId,
      'Yeni Danışan Ataması',
      'Size yeni bir danışan atandı. Hemen program oluşturabilirsiniz.'
    );
  }

  async getDietitianClients(dietitianId: string) {
    const assignments = await this.userAssignedDietitianRepository.find({
      where: { dietitianId },
    });

    if (assignments.length === 0) return [];

    const clientIds = assignments.map((a) => a.clientId);
    const profiles = await this.userProfileRepository.find({
      where: { user_id: In(clientIds) },
    });

    return profiles.map((p) => ({
      user_id: p.user_id,
      first_name: p.first_name,
      last_name: p.last_name,
      avatar_url: p.avatar_url,
      gender: p.gender,
      birth_date: p.birth_date,
    }));
  }
}

