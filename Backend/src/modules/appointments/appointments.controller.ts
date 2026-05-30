import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '@/common/dto/response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('book')
  @ApiOperation({ summary: 'Yeni bir diyetisyen randevusu talep et' })
  @ApiResponse({ status: 201, type: ResponseDto })
  async book(@Request() req, @Body() dto: CreateAppointmentDto) {
    const result = await this.appointmentsService.book(req.user.id, dto);
    return ResponseDto.success('Randevu talebi oluşturuldu.', result);
  }

  @Get('client')
  @ApiOperation({ summary: 'Danışanın kendi randevu geçmişini getir' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async getClientAppointments(@Request() req) {
    const result = await this.appointmentsService.getClientAppointments(req.user.id);
    return ResponseDto.success('Randevular başarıyla getirildi.', result);
  }

  @Get('booked-slots')
  @ApiOperation({ summary: 'Diyetisyenin seçili tarihteki dolu saatlerini getir' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async getBookedSlots(@Request() req, @Query('date') date: string) {
    const result = await this.appointmentsService.getBookedSlots(req.user.id, date);
    return ResponseDto.success('Dolu saatler getirildi.', result);
  }

  @Get('dietitian')
  @ApiOperation({ summary: 'Diyetisyenin randevu çalışma takvimini getir' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async getDietitianSchedule(@Request() req) {
    const result = await this.appointmentsService.getDietitianSchedule(req.user.id);
    return ResponseDto.success('Diyetisyen takvimi başarıyla getirildi.', result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Randevu durumunu güncelle veya ertele' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async updateStatus(
    @Request() req,
    @Param('id') appointmentId: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    const result = await this.appointmentsService.updateStatus(appointmentId, req.user.id, dto);
    return ResponseDto.success('Randevu başarıyla güncellendi.', result);
  }
}
