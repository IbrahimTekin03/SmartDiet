import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { OtpIdentityType, OtpPurpose } from '../otp/entities/otp-code.entity';

export class VerifyOtpDto {
  @ApiProperty({ enum: OtpIdentityType })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const v = value.toLowerCase().trim();
      if (v === 'email') return OtpIdentityType.Email;
      if (v === 'phone') return OtpIdentityType.Phone;
    }
    return Number(value);
  })
  @IsEnum(OtpIdentityType)
  identityType: OtpIdentityType;

  @ApiProperty({ description: 'E-posta veya telefon numarası' })
  @IsString()
  @IsNotEmpty()
  identity: string;

  @ApiProperty({ description: 'Kullanıcıya gönderilen OTP kodu' })
  @Transform(({ value }) => String(value || '').replace(/\D/g, '').trim())
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: OtpPurpose })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const v = value.toLowerCase().trim();
      if (v === 'signup') return OtpPurpose.Signup;
      if (v === 'login') return OtpPurpose.Login;
    }
    return Number(value);
  })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;

  @ApiProperty({
    description: 'Cihaz bilgisi',
    required: false,
    example: { platform: 'web', name: 'Chrome', pushToken: null },
  })
  @IsOptional()
  device?: {
    platform: 'web' | 'android' | 'ios' | 'desktop';
    name?: string;
    pushToken?: string;
  };
}


