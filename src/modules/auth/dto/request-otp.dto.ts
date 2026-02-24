import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OtpIdentityType, OtpPurpose } from '../otp/entities/otp-code.entity';

export class RequestOtpDto {
  @ApiProperty({ enum: OtpIdentityType, example: OtpIdentityType.Email })
  @IsEnum(OtpIdentityType)
  identityType: OtpIdentityType;

  @ApiProperty({ description: 'E-posta veya telefon numarası' })
  @IsString()
  @IsNotEmpty()
  identity: string;

  @ApiProperty({ enum: OtpPurpose, example: OtpPurpose.Signup })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}


