import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseDto } from '@/common/dto/response.dto';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni mesaj gönder' })
  @ApiResponse({ status: 201, description: 'Mesaj başarıyla gönderildi' })
  async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    const result = await this.messagesService.sendMessage(req.user.id, dto);
    return ResponseDto.success('Mesaj gönderildi', result);
  }

  @Get('history')
  @ApiOperation({ summary: 'İki kullanıcı arasındaki sohbet geçmişini getir' })
  @ApiResponse({ status: 200, description: 'Sohbet geçmişi başarıyla getirildi' })
  async getHistory(@Request() req, @Query('contactId') contactId: string) {
    const result = await this.messagesService.getHistory(req.user.id, contactId);
    return ResponseDto.success('Sohbet geçmişi getirildi', result);
  }
}
