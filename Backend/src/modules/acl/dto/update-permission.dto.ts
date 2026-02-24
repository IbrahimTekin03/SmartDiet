import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePermissionDto {
  @ApiProperty({ description: 'Permission name', example: 'user.create', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Permission description', example: 'Create user', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Permission group', example: 'user', required: false })
  @IsOptional()
  @IsString()
  group?: string;
} 