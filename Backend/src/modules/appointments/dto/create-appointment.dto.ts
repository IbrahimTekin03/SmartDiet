import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Randevu tarihi (YYYY-MM-DD)', example: '2026-06-01' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Randevu saat dilimi (09:00 - 17:00 arası saat başları)', example: '10:00' })
  @IsString()
  @IsNotEmpty()
  time_slot: string;

  @ApiProperty({ description: 'Randevu için ek notlar', example: 'İlk kontrol seansı', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
