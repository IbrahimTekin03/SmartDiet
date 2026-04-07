import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DietPlansService } from './diet-plans.service';
import { CreateDietPlanDto } from './dto/create-diet-plan.dto';
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
  async findAllByClient(@Query('clientId') clientId: string) {
    const result = await this.dietPlansService.findAllByClient(clientId);
    return ResponseDto.success('Diyet planları getirildi', result);
  }
}
