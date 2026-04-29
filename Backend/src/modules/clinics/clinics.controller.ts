import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../acl/guards/roles.guard';
import { Roles } from '../acl/decorators/roles.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '@/common/dto/response.dto';
import { Clinic } from './entities/clinic.entity';

@ApiTags('clinics')
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm klinikleri listele' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async findAll() {
    const clinics = await this.clinicsService.findAll();
    return ResponseDto.success('Klinikler başarıyla getirildi', clinics);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Yeni klinik oluştur' })
  @ApiResponse({ status: 201, type: ResponseDto })
  async create(@Body() data: Partial<Clinic>) {
    const clinic = await this.clinicsService.create(data);
    return ResponseDto.success('Klinik başarıyla oluşturuldu', clinic);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Klinik bilgilerini güncelle' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async update(@Param('id') id: string, @Body() data: Partial<Clinic>) {
    const clinic = await this.clinicsService.update(id, data);
    return ResponseDto.success('Klinik başarıyla güncellendi', clinic);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Kliniği sil' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async remove(@Param('id') id: string) {
    await this.clinicsService.remove(id);
    return ResponseDto.success('Klinik başarıyla silindi');
  }
}
