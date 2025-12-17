import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name', example: 'admin' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Role description', example: 'Administrator role', required: false })
  @IsOptional()
  @IsString()
  description?: string;
} 