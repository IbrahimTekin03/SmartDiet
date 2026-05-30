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
  @ApiResponse({ status: 201, description: '?l??m kayd? olu?turuldu', type: ResponseDto })
  async add(@Request() req, @Body() dto: AddMeasurementDto) {
    const result = await this.measurementsService.add(req.user.id, dto);
    return ResponseDto.success('Measurement created', result);
  }

  @Get('history')
  @ApiOperation({ summary: 'Tarihsel olcum grafikleri icin gecmis veriyi getir' })
  @ApiResponse({ status: 200, description: 'Ölçüm geçmişi getirildi', type: ResponseDto })
  async history(@Request() req, @Query() query: MeasurementHistoryDto) {
    const isDietitian = (req.user.roles || []).some((r: any) => {
      if (typeof r === 'string') return r.toLowerCase() === 'diyetisyen';
      return r.name?.toLowerCase() === 'diyetisyen';
    }) || req.user.account_type?.toLowerCase() === 'diyetisyen';

    const targetClientId = (isDietitian && query.clientId) ? query.clientId : req.user.id;
    const result = await this.measurementsService.history(targetClientId, query.days ?? 30);
    return ResponseDto.success('Measurement history', result);
  }
}

