import {
  Body,
  Controller,
  Get,
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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '@/common/dto/response.dto';
import { I18nService } from 'nestjs-i18n';
import { LoginDto } from './dto/login.dto';
import { RolesGuard } from '../acl/guards/roles.guard';
import { Roles } from '../acl/decorators/roles.decorator';
import { AdminRegisterDto } from './dto/admin.register.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

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

    const result = await this.authService.login(req.user);
    const message = await this.i18n.translate('common.auth.login_success');
    return ResponseDto.success(message, result);
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
  async requestOtp(@Body() dto: RequestOtpDto) {
    const result = await this.otpService.requestOtp(dto.identityType, dto.identity, dto.purpose);
    return ResponseDto.success('OTP oluşturuldu', result);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'OTP doğrula' })
  @ApiResponse({ status: 200, description: 'OTP doğrulandı', type: ResponseDto })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await this.otpService.verifyOtp(dto.identityType, dto.identity, dto.code, dto.purpose);
    return ResponseDto.success('OTP doğrulandı', result);
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
    return ResponseDto.success('', req.user);
  }
} 