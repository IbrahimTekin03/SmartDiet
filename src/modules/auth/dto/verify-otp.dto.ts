import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OtpIdentityType, OtpPurpose } from '../otp/entities/otp-code.entity';

export class VerifyOtpDto {
  @ApiProperty({ enum: OtpIdentityType })
  @IsEnum(OtpIdentityType)
  identityType: OtpIdentityType;

  @ApiProperty({ description: 'E-posta veya telefon numarası' })
  @IsString()
  @IsNotEmpty()
  identity: string;

  @ApiProperty({ description: 'Kullanıcıya gönderilen OTP kodu' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: OtpPurpose })
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


