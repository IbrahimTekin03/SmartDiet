import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class SubmitDietitianVerificationDto {
  @ApiProperty({ example: 'Mert Beslenme Klinigi' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  clinic_name: string;

  @ApiPropertyOptional({ example: 'uuid-of-clinic' })
  @IsString()
  @IsOptional()
  clinic_id?: string;

  @ApiProperty({ example: 'Istanbul' })
  @IsString()
  @IsNotEmpty()
  clinic_city: string;

  @ApiProperty({ example: 'Kadikoy, Istanbul' })
  @IsString()
  @IsNotEmpty()
  clinic_address: string;

  @ApiPropertyOptional({ example: 'Yetki belgesi sisteme eklenecektir.' })
  @IsOptional()
  @IsString()
  verification_note?: string;

  @ApiPropertyOptional({ example: '/uploads/certificates/abc.pdf' })
  @IsOptional()
  @IsString()
  certificate_url?: string;
}
