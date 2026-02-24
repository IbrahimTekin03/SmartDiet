import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class SubmitDietitianVerificationDto {
  @ApiProperty({ example: 'Mert Beslenme Klinigi' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  clinic_name: string;

  @ApiProperty({ example: 'Istanbul' })
  @IsString()
  @IsNotEmpty()
  clinic_city: string;

  @ApiProperty({ example: 'Kadikoy, Istanbul' })
  @IsString()
  @IsNotEmpty()
  clinic_address: string;

  @ApiProperty({ example: 'DT-2026-0001' })
  @IsString()
  @IsNotEmpty()
  clinic_license_no: string;

  @ApiPropertyOptional({ example: 'Yetki belgesi sisteme eklenecektir.' })
  @IsOptional()
  @IsString()
  verification_note?: string;
}
