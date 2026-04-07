import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AssignClientDietitianDto {
  @ApiProperty({ description: 'Client user id', example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID()
  client_id: string;

  @ApiProperty({ description: 'Dietitian user id', example: '22222222-2222-2222-2222-222222222222' })
  @IsUUID()
  dietitian_id: string;

  @ApiPropertyOptional({ description: 'Optional admin assignment note' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
