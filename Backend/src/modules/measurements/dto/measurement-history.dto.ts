import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class MeasurementHistoryDto {
  @ApiPropertyOptional({ example: 30, description: 'Son kac gunluk veri getirilsin' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;

  @ApiPropertyOptional({ description: 'Danışan IDsi (Diyetisyenler için)', example: 'uuid' })
  @IsOptional()
  @IsString()
  clientId?: string;
}

