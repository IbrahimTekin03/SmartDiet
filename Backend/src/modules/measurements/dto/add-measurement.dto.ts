import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class AddMeasurementDto {
  @ApiPropertyOptional({ example: '2026-02-23' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 78.2 })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(400)
  weight?: number;

  @ApiPropertyOptional({ example: 21.5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(80)
  body_fat?: number;

  @ApiPropertyOptional({ example: 176 })
  @IsOptional()
  @IsNumber()
  @Min(80)
  @Max(260)
  height?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  waist?: number;

  @ApiPropertyOptional({ example: 102 })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  hip?: number;

  @ApiPropertyOptional({ example: 'Haftalik olcum' })
  @IsOptional()
  @IsString()
  notes?: string;
}

