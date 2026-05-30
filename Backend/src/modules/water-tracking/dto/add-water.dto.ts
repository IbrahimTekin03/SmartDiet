import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddWaterDto {
  @ApiProperty({ description: 'Tüketilen su miktarı (mililitre)', example: 250 })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Kayıt tarihi (YYYY-MM-DD)', example: '2026-05-30', required: false })
  @IsOptional()
  @IsString()
  date?: string;
}
