import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { OtpIdentityType, OtpPurpose } from '../otp/entities/otp-code.entity';

export class RequestOtpDto {
  @ApiProperty({ enum: OtpIdentityType, example: OtpIdentityType.Email })
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

  @ApiProperty({ enum: OtpPurpose, example: OtpPurpose.Signup })
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
}


