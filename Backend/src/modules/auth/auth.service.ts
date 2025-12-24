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

  async validateUser(emailOrPhoneNumber: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: [
        { email: emailOrPhoneNumber },
        { phone_number: emailOrPhoneNumber },
      ],
      select: ['id', 'phone_number','first_name','email'],
      relations: ['roles'],
    });

    if (!user) {
      return null;
    }
    return user;
  }

  async login(user: any) {
    const sessionId = uuidv4();

    const roleNames = (user.roles || []).map((r) => r.name);
    const payload = { sub: user.id, display_name: user.display_name, sessionId, roles: roleNames };
    
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
    });

    // Redis etkinse oturum bilgilerini kaydet
    if (this.redisEnabled) {
      await this.redisService.set(
        `auth:${user.id}:${sessionId}`,
        JSON.stringify({ refreshToken }),
        this.configService.get('JWT_REFRESH_EXPIRATION_SECONDS'),
      );
    }


    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        display_name: user.display_name,
        email: user.email,
        phone_number: user.phone_number,
        roles: user.roles,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // En az bir iletişim bilgisi olmalı (DTO da doğrular, serviste de koru)
    if (!registerDto.email && !registerDto.phone_number) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.auth.email_or_phone_required'),
      );
    }

    // 1) Kullanıcı adı kontrolü
    const usernameCheck = await this.userRepository.findOne({
      where: { first_name: registerDto.first_name },
    });
    if (usernameCheck) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.auth.username_exists'),
      );
    }

    // 2) E‑posta verilmişse kontrol et
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

    // 3) Telefon verilmişse kontrol et
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

    // Varsayılan USER rolünü bul
    const defaultUserRole = await this.roleRepository.findOne({ where: { name: 'user' } });

    // Yeni kullanıcı oluştur
    const newUser = this.userRepository.create({
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      email: registerDto.email ?? null,
      phone_number: registerDto.phone_number ?? null,
      password_hash: registerDto.password,
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
    // Kayıt olan kullanıcıyı rolleriyle birlikte yükle
    const {...createdUser} = savedUser;

    // Kullanıcıyı otomatik olarak giriş yap
    return this.login(createdUser);
  }



    //Admin panelinden kullanıcı kaydı(rol ataması için)
    async adminRegister(registerDto: AdminRegisterDto) {
    // E-posta veya kullanıcı adı kontrolü
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


    // Rolü bul
    const role = await this.roleRepository.findOne({ where: { id: registerDto.roleId } });
    if (!role) {
      throw new UnauthorizedException(
        await this.i18n.translate('common.role.not_found'),
      );
    }

    // Yeni kullanıcı oluştur
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
    // Redis etkin değilse hata döndür
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

    // Eski refresh token kontrolü
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

    // Yeni tokenlar oluştur
    const payload = { sub: user.id, username: user.first_name, sessionId };
    
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
    });

    // Redis'teki oturum bilgilerini güncelle
    await this.redisService.set(
      sessionKey,
      JSON.stringify({ refreshToken: newRefreshToken }),
      this.configService.get('JWT_REFRESH_EXPIRATION_SECONDS'),
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
} 