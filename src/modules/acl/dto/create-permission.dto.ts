import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ description: 'Permission name', example: 'user.create' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Permission description', example: 'Create user', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Permission group', example: 'user' })
  @IsNotEmpty()
  @IsString()
  group: string;
} 