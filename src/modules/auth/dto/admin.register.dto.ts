import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminRegisterDto {
  @ApiProperty({ description: 'Kullanıcı adı', example: 'gmudur01' })
  @IsNotEmpty()
  @IsString()
  display_name: string;

  @ApiProperty({ description: 'E-posta', example: 'gmudur@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Telefon numarası', example: '+905555555555' })
  @IsNotEmpty()
  @IsString()
  phone_number: string;

  @ApiProperty({ description: 'Profil fotoğrafı URL\'si', example: 'https://example.com/profile.jpg' })
  @IsString()
  avatar_url: string;


  @ApiProperty({ description: 'Atanacak rolün ID değeri', example: '9f2f2b2a-...' })
  @IsNotEmpty()
  @IsString()
  roleId: string;
}
