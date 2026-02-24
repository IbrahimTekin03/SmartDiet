import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({ description: 'Role name', example: 'admin', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Role description', example: 'Administrator role', required: false })
  @IsOptional()
  @IsString()
  description?: string;
} 