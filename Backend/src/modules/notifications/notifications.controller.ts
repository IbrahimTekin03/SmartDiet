import { Controller, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseDto } from '@/common/dto/response.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Kullanıcının bildirimlerini getir' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async getUserNotifications(@Request() req) {
    const result = await this.notificationsService.getUserNotifications(req.user.id);
    return ResponseDto.success('Bildirimler getirildi', result);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Okunmamış bildirim sayısını getir' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return ResponseDto.success('Okunmamış bildirim sayısı', { count });
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Tüm bildirimleri okundu olarak işaretle' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return ResponseDto.success('Tümü okundu işaretlendi', null);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Belirli bir bildirimi okundu olarak işaretle' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async markAsRead(@Request() req, @Param('id') id: string) {
    await this.notificationsService.markAsRead(id, req.user.id);
    return ResponseDto.success('Okundu işaretlendi', null);
  }
}
