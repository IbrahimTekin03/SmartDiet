import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<T> {
  @ApiProperty({ description: 'İşlem başarılı mı?', example: true })
  success: boolean;

  @ApiProperty({ description: 'Mesaj', example: 'İşlem başarıyla tamamlandı' })
  message: string;

  @ApiProperty({ description: 'Veri', example: {} })
  data: T;

  @ApiProperty({ description: 'Hata', example: null })
  error: string | null;

  constructor(success: boolean, message: string, data?: T, error?: string) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error || null;
  }

  static success<T>(message: string, data?: T): ResponseDto<T> {
    return new ResponseDto<T>(true, message, data);
  }

  static error<T>(message: string, data?: T): ResponseDto<T> {
    return new ResponseDto<T>(false, message, data, message);
  }
} 