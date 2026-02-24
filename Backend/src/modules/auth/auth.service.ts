import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { I18nService } from 'nestjs-i18n';
import { RedisService } from '../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { Role } from '../acl/entities/role.entity';
import { AdminRegisterDto } from './dto/admin.register.dto';
import { LoginDto } from './dto/login.dto';
import { UserProfile } from '../users/entities/user.profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    public readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
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

  async validateUser(emailOrPhoneNumber: string, plainPassword: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: [
        { email: emailOrPhoneNumber },
        { phone_number: emailOrPhoneNumber },
      ],
      select: ['id', 'phone_number', 'first_name', 'last_name', 'email', 'password_hash'],
      relations: ['roles'],
    });

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

    return user;
  }

  async login(user: any) {
    const sessionId = uuidv4();
    const accessExpiresIn = this.configService.get('JWT_EXPIRATION') ?? '15m';
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRATION') ?? '7d';
    const refreshTtlSeconds = Number(
      this.configService.get('JWT_REFRESH_EXPIRATION_SECONDS') ?? 60 * 60 * 24 * 7,
    );
    const refreshSecret =
      this.configService.get('JWT_REFRESH_SECRET') ?? this.configService.get('JWT_SECRET');

    const roleNames = (user.roles || []).map((r) => r.name);
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    const payload = { sub: user.id, display_name: fullName, sessionId, roles: roleNames };
    
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
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        display_name: fullName,
        full_name: fullName,
        email: user.email,
        phone_number: user.phone_number,
        roles: user.roles,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // En az bir iletiÅŸim bilgisi olmalÄ± (DTO da doÄŸrular, serviste de koru)
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

    // Eâ€‘posta verilmiÅŸse kontrol et
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

    // 3) Telefon verilmiÅŸse kontrol et
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

    // VarsayÄ±lan USER rolÃ¼nÃ¼ bul
    const defaultUserRole = await this.roleRepository.findOne({ where: { name: 'user' } });

    // Yeni kullanÄ±cÄ± oluÅŸtur
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const newUser = this.userRepository.create({
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      email: registerDto.email ?? null,
      phone_number: registerDto.phone_number ?? null,
      password_hash: hashedPassword,
      roles: defaultUserRole ? [defaultUserRole] : [],
    });
    

    const savedUser = await this.userRepository.save(newUser);

    const newProfile = this.userProfileRepository.create({
      user_id: savedUser.id,
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      birth_date: registerDto.birth_date,
      gender: registerDto.gender,
      avatar_url: registerDto.avatar_url ?? null,
    });
    await this.userProfileRepository.save(newProfile);
    // KayÄ±t olan kullanÄ±cÄ±yÄ± rolleriyle birlikte yÃ¼kle
    const {...createdUser} = savedUser;

    // KullanÄ±cÄ±yÄ± otomatik olarak giriÅŸ yap
    return this.login(createdUser);
  }



    //Admin panelinden kullanÄ±cÄ± kaydÄ±(rol atamasÄ± iÃ§in)
    async adminRegister(registerDto: AdminRegisterDto) {
    // E-posta veya kullanÄ±cÄ± adÄ± kontrolÃ¼
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


    // RolÃ¼ bul
    const role = await this.roleRepository.findOne({ where: { id: registerDto.roleId } });
    if (!role) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.role.not_found'),
      );
    }

    // Yeni kullanÄ±cÄ± oluÅŸtur
    const newUser = this.userRepository.create({
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      email: registerDto.email,
      phone_number: registerDto.phone_number,
      roles: [role],
    });

    const savedUser = await this.userRepository.save(newUser);

    // Åifreyi hariÃ§ tutarak kullanÄ±cÄ±yÄ± dÃ¶ndÃ¼r
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
    // Redis etkin deÄŸilse hata dÃ¶ndÃ¼r
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

    // Eski refresh token kontrolÃ¼
    if (refreshToken !== oldRefreshToken) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.auth.invalid_refresh_token'),
      );
    }

    // KullanÄ±cÄ± bilgilerini al
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'first_name', 'email', 'phone_number','roles'],
    });

    if (!user) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.auth.user_not_found'),
      );
    }

    // Yeni tokenlar oluÅŸtur
    const payload = { sub: user.id, username: user.first_name, sessionId };
    
    const accessToken = this.jwtService.sign(payload, { expiresIn: accessExpiresIn });
    const newRefreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    // Redis'teki oturum bilgilerini gÃ¼ncelle
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
}

