import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    description: 'Email',
    example: 'tomson@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone Number',
    example: '+905555555555',
  })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ description: 'Password', example: 'StrongP@ssw0rd' })
  @IsString()
  password: string;
}