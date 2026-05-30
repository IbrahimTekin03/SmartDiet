import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateAppointmentDto {
  @ApiProperty({ description: 'Randevu durumu', example: 'approved', required: false })
  @IsOptional()
  @IsIn(['pending', 'approved', 'rescheduled', 'cancelled'])
  status?: 'pending' | 'approved' | 'rescheduled' | 'cancelled';

  @ApiProperty({ description: 'Yeni randevu tarihi (erteleme için)', example: '2026-06-02', required: false })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ description: 'Yeni randevu saati (erteleme için)', example: '14:00', required: false })
  @IsOptional()
  @IsString()
  time_slot?: string;

  @ApiProperty({ description: 'Notlar veya güncelleme açıklaması', example: 'Diyetisyen seyahat nedeniyle erteledi.', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
