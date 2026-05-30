import { Body, Controller, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiChatService } from './ai-chat.service';
import { AiAssistantService } from './ai-assistant.service';
import { GenerateDietPlanDto, AskSubstitutionDto, ChatRequestDto } from './dto/ai-requests.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../acl/guards/roles.guard';
import { Roles } from '../acl/decorators/roles.decorator';
import { ResponseDto } from '@/common/dto/response.dto';
import { Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('ai-assistant')
@Controller('ai-assistant')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiAssistantController {
  constructor(
    private readonly aiAssistantService: AiAssistantService,
    private readonly aiChatService: AiChatService
  ) {}

  @Post('generate-plan')
  @Roles('Diyetisyen')
  @ApiOperation({ summary: 'Yapay zeka ile diyet planı oluştur (Diyetisyenler için)' })
  @ApiResponse({ status: 201, description: 'Yapay zeka plan önerisi başarıyla alındı' })
  async generatePlan(@Body() dto: GenerateDietPlanDto) {
    const result = await this.aiAssistantService.generateDietPlan(dto);
    return ResponseDto.success('Yapay zeka plan önerisi', result);
  }

  @Post('substitute-food')
  @Roles('Danışan') // Assuming Danışan is the role name for clients
  @ApiOperation({ summary: 'Yapay zekadan yiyecek alternatifi iste (Danışanlar için)' })
  @ApiResponse({ status: 201, description: 'Yapay zeka yiyecek alternatifleri başarıyla alındı' })
  async suggestSubstitution(@Body() dto: AskSubstitutionDto) {
    const result = await this.aiAssistantService.suggestSubstitution(dto);
    return ResponseDto.success('Yapay zeka alternatif önerileri', result);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Yapay zeka ile durum korumalı sohbet' })
  @ApiResponse({ status: 201, description: 'Yapay zeka sohbet yanıtı' })
  async chat(@Req() req: any, @Body() dto: ChatRequestDto) {
    const result = await this.aiChatService.processChat(req.user, dto.prompt, dto.sessionId);
    return ResponseDto.success('Sohbet yanıtı', result);
  }

  @Post('scan-meal')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Fotoğraftan yemek analizi yap (Gemini/Claude Vision)' })
  @ApiResponse({ status: 200, description: 'Yemek analizi başarılı' })
  async scanMeal(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Lütfen bir resim dosyası yükleyin.');
    }
    const base64 = file.buffer.toString('base64');
    const mimeType = file.mimetype;
    const result = await this.aiAssistantService.scanMealImage(base64, mimeType);
    return ResponseDto.success('Yemek analizi sonucu', result);
  }
}
