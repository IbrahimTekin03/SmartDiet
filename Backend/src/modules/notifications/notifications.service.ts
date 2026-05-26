import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(userId: string, title: string, message: string) {
    const notification = this.notificationRepo.create({
      user_id: userId,
      title,
      message,
    });
    return this.notificationRepo.save(notification);
  }

  async getUserNotifications(userId: string) {
    return this.notificationRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string) {
    return this.notificationRepo.count({
      where: { user_id: userId, is_read: false },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.notificationRepo.update(
      { id: notificationId, user_id: userId },
      { is_read: true },
    );
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepo.update(
      { user_id: userId, is_read: false },
      { is_read: true },
    );
    return { success: true };
  }
}
