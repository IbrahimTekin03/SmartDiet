import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Column } from 'typeorm';

export class AdminRegisterDto {
  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @ApiProperty({ description: 'E-posta', example: 'gmudur@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Telefon numarası', example: '+905555555555' })
  @IsNotEmpty()
  @IsString()
  phone_number: string;


  @ApiProperty({ description: 'Atanacak rolün ID değeri', example: '9f2f2b2a-...' })
  @IsNotEmpty()
  @IsString()
  roleId: string;
}
