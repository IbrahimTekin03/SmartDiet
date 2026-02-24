import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  IsOptional,
} from 'class-validator';
import { ValidateIf } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Görünen kullanıcı adı',
    example: 'johndoe',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Kullanıcı adı sadece harf, rakam, alt çizgi ve tire içerebilir',
  })
  display_name: string;

  @ApiPropertyOptional({
  description: 'Kullanıcı Profil fotoğrafı URL (opsiyonel, yerine dosya yüklenebilir)',
  example: 'https://example.com/profile.jpg',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value : undefined))
  avatar_url?: string;

  @ApiProperty({
    description: 'E-posta adresi (en az bir alan: e-posta veya telefon)',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => !o.phone_number || o.phone_number.length === 0)
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Kullanıcı telefon numarası (en az bir alan: e-posta veya telefon)',
    example: '+905555555555',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => !o.email || o.email.length === 0)
  @IsNotEmpty()
  @IsString()
  phone_number?: string;



}
