import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '@/common/dto/response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WaterTrackingService } from './water-tracking.service';
import { AddWaterDto } from './dto/add-water.dto';

@ApiTags('water-tracking')
@Controller('water-tracking')
@UseGuards(JwtAuthGuard)
export class WaterTrackingController {
  constructor(private readonly waterService: WaterTrackingService) {}

  @Post()
  @ApiOperation({ summary: 'Günlük su tüketim miktarını kaydet veya güncelle' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async addOrUpdate(@Request() req, @Body() dto: AddWaterDto) {
    const result = await this.waterService.addOrUpdate(req.user.id, dto);
    return ResponseDto.success('Water log updated', result);
  }

  @Get('today')
  @ApiOperation({ summary: 'Bugünkü su tüketimini getir' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async getToday(@Request() req, @Query('date') date?: string) {
    const result = await this.waterService.getToday(req.user.id, date);
    return ResponseDto.success('Water log fetched', result);
  }

  @Get('history')
  @ApiOperation({ summary: 'Geçmiş su tüketim kayıtlarını getir' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async getHistory(@Request() req, @Query('days') days?: number) {
    const result = await this.waterService.getHistory(req.user.id, days ?? 7);
    return ResponseDto.success('Water logs fetched', result);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Diyetisyen için danışanın su tüketim geçmişini getir' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async getClientHistory(
    @Param('clientId') clientId: string,
    @Query('days') days?: number,
  ) {
    const result = await this.waterService.getHistory(clientId, days ?? 7);
    return ResponseDto.success('Client water logs fetched', result);
  }
}
