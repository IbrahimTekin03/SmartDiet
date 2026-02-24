import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '@/common/dto/response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MeasurementsService } from './measurements.service';
import { AddMeasurementDto } from './dto/add-measurement.dto';
import { MeasurementHistoryDto } from './dto/measurement-history.dto';

@ApiTags('measurements')
@Controller('measurements')
@UseGuards(JwtAuthGuard)
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  @Post('add')
  @ApiOperation({ summary: 'Kilo ve vucut olcumlerini ekle' })
  @ApiResponse({ status: 201, description: 'Olcum kaydi olusturuldu', type: ResponseDto })
  async add(@Request() req, @Body() dto: AddMeasurementDto) {
    const result = await this.measurementsService.add(req.user.id, dto);
    return ResponseDto.success('Measurement created', result);
  }

  @Get('history')
  @ApiOperation({ summary: 'Tarihsel olcum grafikleri icin gecmis veriyi getir' })
  @ApiResponse({ status: 200, description: 'Olcum gecmisi getirildi', type: ResponseDto })
  async history(@Request() req, @Query() query: MeasurementHistoryDto) {
    const result = await this.measurementsService.history(req.user.id, query.days ?? 30);
    return ResponseDto.success('Measurement history', result);
  }
}

