import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { ChatRoom } from '../auth/entities/chat-room.entity';
import { User } from '../users/entities/user.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { WebsocketService } from '../websocket/websocket.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly websocketService: WebsocketService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getOrCreateRoom(senderId: string, receiverId: string): Promise<ChatRoom> {
    let room = await this.chatRoomRepository.findOne({
      where: [
        { client_id: senderId, dietitian_id: receiverId },
        { client_id: receiverId, dietitian_id: senderId },
      ],
    });

    if (room) {
      if (!room.is_active) {
        room.is_active = true;
        await this.chatRoomRepository.save(room);
      }
      return room;
    }

    // Determine who is dietitian and who is client
    const user1 = await this.userRepository.findOne({ where: { id: senderId }, relations: ['roles'] });
    const user2 = await this.userRepository.findOne({ where: { id: receiverId }, relations: ['roles'] });

    if (!user1 || !user2) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const isUser1Dietitian = user1.roles?.some(r => r.name === 'Diyetisyen' || r.name === 'admin');
    
    const dietitianId = isUser1Dietitian ? senderId : receiverId;
    const clientId = isUser1Dietitian ? receiverId : senderId;

    room = this.chatRoomRepository.create({
      dietitian_id: dietitianId,
      client_id: clientId,
      is_active: true,
    });

    return this.chatRoomRepository.save(room);
  }

  async sendMessage(senderId: string, dto: SendMessageDto): Promise<Message> {
    const room = await this.getOrCreateRoom(senderId, dto.receiverId);
    
    const isOnline = this.websocketService.isUserOnline(dto.receiverId);

    const message = this.messageRepository.create({
      room_id: room.id,
      sender_id: senderId,
      content: dto.content,
      plan_id: dto.planId || null,
      is_delivered: isOnline,
      is_read: false,
    });

    const saved = await this.messageRepository.save(message);

    // Fetch complete populated object with plan relation
    const populated = await this.messageRepository.findOne({
      where: { id: saved.id },
      relations: ['plan'],
    });

    // Broadcast via WebSocket
    this.websocketService.emitToUser(dto.receiverId, 'new_message', {
      id: populated.id,
      room_id: populated.room_id,
      sender_id: populated.sender_id,
      content: populated.content,
      plan_id: populated.plan_id,
      plan: populated.plan,
      is_delivered: populated.is_delivered,
      is_read: populated.is_read,
      created_at: populated.created_at,
      sender: {
        id: senderId,
      }
    });

    try {
      // Create push notification in DB
      const sender = await this.userRepository.findOne({ where: { id: senderId } });
      const senderName = sender ? `${sender.first_name} ${sender.last_name}` : 'Diyetisyen/Danışan';
      await this.notificationsService.create(
        dto.receiverId,
        'Yeni Mesaj',
        dto.planId ? `${senderName} size bir diyet planı kartı paylaştı.` : `${senderName}: ${dto.content}`
      );
      
      // Real-time socket notification update
      this.websocketService.emitToUser(dto.receiverId, 'new_notification', {
        type: 'chat_message',
        senderName,
        content: dto.planId ? 'Diyet Planı Kartı' : dto.content,
      });
    } catch (err) {
      console.error('Failed to create system notification for chat message:', err);
    }

    return populated;
  }

  async getHistory(userId: string, contactId: string): Promise<Message[]> {
    const room = await this.getOrCreateRoom(userId, contactId);

    const messages = await this.messageRepository.find({
      where: { room_id: room.id },
      order: { created_at: 'ASC' },
      relations: ['sender', 'plan'],
    });

    // Mark messages sent by the contact in this room as read
    const unreadMessages = messages.filter(m => m.sender_id === contactId && !m.is_read);
    if (unreadMessages.length > 0) {
      await this.messageRepository.update(
        { room_id: room.id, sender_id: contactId, is_read: false },
        { is_read: true }
      );
      unreadMessages.forEach(m => m.is_read = true);

      // Notify the sender that their messages have been read
      this.websocketService.emitToUser(contactId, 'messages_read', {
        roomId: room.id,
        userId,
      });
    }

    return messages;
  }
}
