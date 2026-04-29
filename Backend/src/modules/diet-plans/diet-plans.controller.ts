import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DietPlansService } from './diet-plans.service';
import { CreateDietPlanDto } from './dto/create-diet-plan.dto';
import { TrackMealItemDto } from './dto/track-meal-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../acl/guards/roles.guard';
import { Roles } from '../acl/decorators/roles.decorator';
import { ResponseDto } from '@/common/dto/response.dto';

@ApiTags('diet-plans')
@Controller('diet-plans')
@UseGuards(JwtAuthGuard)
export class DietPlansController {
  constructor(private readonly dietPlansService: DietPlansService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Diyetisyen')
  @ApiOperation({ summary: 'Yeni bir diyet planı oluştur' })
  @ApiResponse({ status: 201, description: 'Diyet planı başarıyla oluşturuldu' })
  async create(@Request() req, @Body() createDietPlanDto: CreateDietPlanDto) {
    const result = await this.dietPlansService.create(req.user.id, createDietPlanDto);
    return ResponseDto.success('Diyet planı başarıyla oluşturuldu', result);
  }

  @Get('client')
  @ApiOperation({ summary: 'Bir danışana ait diyet planlarını getir' })
  async findAllByClient(@Request() req, @Query('clientId') clientId?: string) {
    const idToUse = clientId || req.user.id;
    const result = await this.dietPlansService.findAllByClient(idToUse);
    return ResponseDto.success('Diyet planları getirildi', result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Belirli bir diyet planını getir' })
  async findOne(@Request() req, @Param('id') id: string) {
    const result = await this.dietPlansService.findOne(id, req.user.id);
    return ResponseDto.success('Diyet planı detayı getirildi', result);
  }

  @Post('track')
  @ApiOperation({ summary: 'Yenilen öğünleri takip için kaydet' })
  async trackMealItem(@Request() req, @Body() dto: TrackMealItemDto) {
    const result = await this.dietPlansService.trackMealItem(
      req.user.id,
      dto.plan_id,
      dto.meal_item_id,
      dto.date,
      dto.is_consumed
    );
    return ResponseDto.success('Öğün takibi güncellendi', result);
  }

  @Post('track/batch')
  @ApiOperation({ summary: 'Yenilen öğünleri toplu olarak kaydet' })
  async trackMealItemBatch(@Request() req, @Body() dto: import('./dto/track-meal-item.dto').TrackMealItemBatchDto) {
    const result = await this.dietPlansService.trackMealItemBatch(
      req.user.id,
      dto.plan_id,
      dto.date,
      dto.items
    );
    return ResponseDto.success('Toplu öğün takibi güncellendi', result);
  }

  @Get('track')
  @ApiOperation({ summary: 'Belirli bir tarihteki takip verilerini getir' })
  async getTracking(@Request() req, @Query('planId') planId: string, @Query('date') date: string) {
    const result = await this.dietPlansService.getTracking(req.user.id, planId, date);
    return ResponseDto.success('Takip verileri getirildi', result);
  }
}

