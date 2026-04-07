import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Password reset email address',
    example: 'user@example.com',
  })
  @IsString()
  @IsEmail()
  email: string;
}
