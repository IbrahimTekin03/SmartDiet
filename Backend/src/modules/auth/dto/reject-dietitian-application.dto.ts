import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectDietitianApplicationDto {
  @ApiProperty({ example: 'Belge numarası doğrulanamadı. Lütfen güncel lisans belgeni ekleyerek tekrar başvur.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  reason: string;
}
