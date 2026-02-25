import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpService } from './otp/otp.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '@/common/dto/response.dto';
import { I18nService } from 'nestjs-i18n';
import { LoginDto } from './dto/login.dto';
import { RolesGuard } from '../acl/guards/roles.guard';
import { Roles } from '../acl/decorators/roles.decorator';
import { AdminRegisterDto } from './dto/admin.register.dto';
import { SubmitDietitianVerificationDto } from './dto/submit-dietitian-verification.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { OtpPurpose } from './otp/entities/otp-code.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly i18n: I18nService,
  ) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Kullanıcı girişi' })
  @ApiResponse({
    status: 200,
    description: 'Giriş başarılı',
    type: ResponseDto,
  })
  async login(@Request() req, @Body() loginDto: LoginDto) {
    if (!loginDto.email && !loginDto.phone_number) {
      return ResponseDto.error('E-posta veya telefon numarası gereklidir');
    }

    const otpCheck = await this.otpService.shouldRequireOtpForUser(
      req.user,
      OtpPurpose.Login,
      {
        ip: this.resolveClientIp(req),
        deviceId: this.readHeader(req, 'x-device-id'),
        userAgent: this.readHeader(req, 'user-agent'),
      },
    );

    if (otpCheck.otpRequired) {
      const message = await this.i18n.translate('common.auth.login_success');
      return ResponseDto.success(message, {
        otpRequired: true,
        user: this.authService.buildSessionUser(req.user),
      });
    }

    const result = await this.authService.login(req.user);
    const message = await this.i18n.translate('common.auth.login_success');
    return ResponseDto.success(message, {
      ...result,
      otpRequired: false,
      otpTrusted: true,
      otpTrustedTtlSeconds: otpCheck.trustedTtlSeconds,
    });
  }

  @Post('register')
  @ApiOperation({ summary: 'Kullanıcı kaydı' })
  @ApiResponse({
    status: 201,
    description: 'Kayıt başarılı',
    type: ResponseDto,
  })
  @UseInterceptors(
    FileInterceptor('avatar_url', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadRoot = join(process.cwd(), 'uploads');
          const dir = join(uploadRoot, 'avatars');
          if (!fs.existsSync(uploadRoot)) {
            fs.mkdirSync(uploadRoot, { recursive: true });
          }
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const fileName = `avatar_url-${Date.now()}${extname(file.originalname)}`;
          cb(null, fileName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file) return cb(null, false);
        if (/^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
      limits: { fileSize: 3 * 1024 * 1024 },
    }),
  )
  async register(@UploadedFile() file: any, @Body() registerDto: RegisterDto) {
    // Eğer dosya geldiyse, public URL'yi dto'ya yaz
    if (file) {
      registerDto.avatar_url = `/uploads/avatars/${file.filename}`;
    }

    const result = await this.authService.register(registerDto);
    const message = await this.i18n.translate('common.auth.register_success');
    return ResponseDto.success(message, result);
  }

  @Post('request-otp')
  @ApiOperation({ summary: 'OTP talep et' })
  @ApiResponse({ status: 200, description: 'OTP oluşturuldu ve gönderildi', type: ResponseDto })
  async requestOtp(@Request() req, @Body() dto: RequestOtpDto) {
    const result = await this.otpService.requestOtp(dto.identityType, dto.identity, dto.purpose, {
      ip: this.resolveClientIp(req),
      deviceId: this.readHeader(req, 'x-device-id'),
      userAgent: this.readHeader(req, 'user-agent'),
    });
    return ResponseDto.success('OTP oluşturuldu', result);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'OTP doğrula' })
  @ApiResponse({ status: 200, description: 'OTP doğrulandı', type: ResponseDto })
  async verifyOtp(@Request() req, @Body() dto: VerifyOtpDto) {
    const result = await this.otpService.verifyOtp(dto.identityType, dto.identity, dto.code, dto.purpose, {
      ip: this.resolveClientIp(req),
      deviceId: this.readHeader(req, 'x-device-id'),
      userAgent: this.readHeader(req, 'user-agent'),
    });
    return ResponseDto.success('OTP doğrulandı', result);
  }

  @Post('dietitian/verification')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Diyetisyen dogrulama bilgilerini gonder' })
  @ApiResponse({ status: 200, description: 'Dogrulama talebi alindi', type: ResponseDto })
  async submitDietitianVerification(@Request() req, @Body() dto: SubmitDietitianVerificationDto) {
    const result = await this.authService.submitDietitianVerification(req.user.id, dto);
    return ResponseDto.success('Dogrulama talebi alindi', result);
  }

  @Get('dietitian/verification-status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Diyetisyen dogrulama durumunu getir' })
  @ApiResponse({ status: 200, description: 'Dogrulama durumu', type: ResponseDto })
  async getDietitianVerificationStatus(@Request() req) {
    const result = await this.authService.getDietitianVerificationStatus(req.user.id);
    return ResponseDto.success('Dogrulama durumu', result);
  }

  @Get('admin/dietitian-applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Bekleyen diyetisyen basvurularini listele' })
  @ApiResponse({ status: 200, description: 'Bekleyen basvurular', type: ResponseDto })
  async listDietitianApplications() {
    const result = await this.authService.listPendingDietitianApplications();
    return ResponseDto.success('Bekleyen basvurular', result);
  }

  @Post('admin/dietitian-applications/:userId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Diyetisyen basvurusunu onayla' })
  @ApiResponse({ status: 200, description: 'Basvuru onaylandi', type: ResponseDto })
  async approveDietitianApplication(@Request() req, @Param('userId') userId: string) {
    const result = await this.authService.approveDietitianApplication(req.user.id, userId);
    return ResponseDto.success('Basvuru onaylandi', result);
  }

  @Post('admin/register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin panelinden kullanıcı kaydı (rol ile)' })
  @ApiResponse({
    status: 201,
    description: 'Kayıt başarılı (admin)',
    type: ResponseDto,
  })
  async adminRegister(@Body() registerDto: AdminRegisterDto) {
    const createdUser = await this.authService.adminRegister(registerDto);
    const message = await this.i18n.translate('common.auth.register_success');
    return ResponseDto.success(message, createdUser);
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Token yenileme' })
  @ApiResponse({
    status: 200,
    description: 'Token yenileme başarılı',
    type: ResponseDto,
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      const { refreshToken } = refreshTokenDto;
      const decoded = this.authService.jwtService.decode(refreshToken);
      
      if (!decoded || !decoded.sub || !decoded.sessionId) {
        throw new Error('Invalid token');
      }
      
      const result = await this.authService.refreshToken(
        decoded.sub,
        decoded.sessionId,
        refreshToken,
      );
      
      const message = await this.i18n.translate('common.auth.refresh_token_success');
      return ResponseDto.success(message, result);
    } catch (error) {
      return ResponseDto.error(error.message);
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Kullanıcı çıkışı' })
  @ApiResponse({
    status: 200,
    description: 'Çıkış başarılı',
    type: ResponseDto,
  })
  async logout(@Request() req) {
    const { id } = req.user;
    const decoded = this.authService.jwtService.decode(
      req.headers.authorization.split(' ')[1],
    );
    
    await this.authService.logout(id, decoded.sessionId);
    const message = await this.i18n.translate('common.auth.logout_success');
    return ResponseDto.success(message);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Kullanıcı profili' })
  @ApiResponse({
    status: 200,
    description: 'Profil başarıyla getirildi',
    type: ResponseDto,
  })
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id).then((profile) => ResponseDto.success('', profile));
  }

  @Post('profile/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadRoot = join(process.cwd(), 'uploads');
          const dir = join(uploadRoot, 'avatars');
          if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const fileName = `avatar-${Date.now()}${extname(file.originalname)}`;
          cb(null, fileName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file) return cb(null, false);
        if (/^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype)) return cb(null, true);
        cb(new Error('Invalid file type'), false);
      },
      limits: { fileSize: 3 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(@Request() req, @UploadedFile() file: any) {
    const avatarUrl = file ? `/uploads/avatars/${file.filename}` : null;
    const profile = await this.authService.updateAvatar(req.user.id, avatarUrl);
    return ResponseDto.success('Avatar updated', profile);
  }

  @Post('profile/update')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'KullanÄ±cÄ± profilini gÃ¼ncelle' })
  @ApiResponse({
    status: 200,
    description: 'Profil baÅŸarÄ±yla gÃ¼ncellendi',
    type: ResponseDto,
  })
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    const profile = await this.authService.updateProfile(req.user.id, dto);
    return ResponseDto.success('Profile updated', profile);
  }

  @Get('dashboard/summary')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Dashboard Ã¶zet verileri' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard ozet verileri basariyla getirildi',
    type: ResponseDto,
  })
  async getDashboardSummary(@Request() req) {
    const summary = await this.authService.getDashboardSummary(req.user.id);
    return ResponseDto.success('Dashboard summary', summary);
  }

  @Get('public/landing-stats')
  @ApiOperation({ summary: 'Landing sayfasi genel istatistikleri' })
  @ApiResponse({
    status: 200,
    description: 'Landing istatistikleri basariyla getirildi',
    type: ResponseDto,
  })
  async getPublicLandingStats() {
    const stats = await this.authService.getPublicLandingStats();
    return ResponseDto.success('Public landing stats', stats);
  }

  private readHeader(req: any, key: string): string {
    const value = req?.headers?.[key];
    if (Array.isArray(value)) return String(value[0] || '').trim();
    return String(value || '').trim();
  }

  private resolveClientIp(req: any): string {
    const forwardedFor = this.readHeader(req, 'x-forwarded-for');
    if (forwardedFor) return forwardedFor.split(',')[0].trim();

    return String(req?.ip || req?.connection?.remoteAddress || '').trim();
  }
} 
