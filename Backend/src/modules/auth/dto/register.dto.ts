import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ValidateIf } from 'class-validator';
import { Gender } from '../../users/enums/gender.enum';
import { AccountType } from 'src/modules/users/entities/user.profile.entity';

export class RegisterDto {
  @ApiProperty({
    description: 'İsim',
    example: 'İbrahim',
  })
  @IsString()
  first_name: string;

  @ApiProperty({
    description: 'Soyisim',
    example: 'Tekin',
  })
  @IsString()
  last_name: string;

  @ApiProperty({ description: 'Şifre', example: 'StrongP@ssw0rd' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter (@$!%*?&) içermelidir.',
    },
  )
  password: string;

  @IsNotEmpty({ message: 'Doğum tarihi boş bırakılamaz' }) // BU EKSİK OLABİLİR
  @IsDateString(
    {},
    { message: 'Geçerli bir tarih formatı giriniz (YYYY-MM-DD)' },
  ) // BU EKSİK OLABİLİR
  birth_date: string;

  @IsEnum(Gender, { message: 'cinsiyet male-female' })
  gender: Gender;

  @ApiPropertyOptional({
    description:
      'Kullanıcı Profil fotoğrafı URL (opsiyonel, yerine dosya yüklenebilir)',
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
    description:
      'Kullanıcı telefon numarası (en az bir alan: e-posta veya telefon)',
    example: '+905555555555',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => !o.email || o.email.length === 0)
  @IsNotEmpty()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({
    description: 'Hesap tipi',
    enum: AccountType,
    example: AccountType.Client,
  })
  @IsOptional()
  @IsEnum(AccountType)
  account_type?: AccountType;

  @ApiPropertyOptional({ description: 'Klinik ID (danışan için)', example: 'uuid-of-clinic' })
  @IsOptional()
  @IsString()
  clinic_id?: string;
}
