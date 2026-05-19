import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WebsocketService } from './websocket.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../messages/entities/message.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebsocketGateway.name);
  private activeConnections = new Map<string, string>(); // socketId -> userId

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly websocketService: WebsocketService,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  afterInit(server: Server) {
    this.websocketService.setServer(server);
    this.logger.log('WebSocket Sunucusu başlatıldı');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client bağlandı: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ayrıldı: ${client.id}`);
    const userId = this.activeConnections.get(client.id);
    if (userId) {
      this.activeConnections.delete(client.id);
      
      // Check if user still has other connections (e.g. open in multiple tabs)
      let stillConnected = false;
      for (const uid of this.activeConnections.values()) {
        if (uid === userId) {
          stillConnected = true;
          break;
        }
      }
      
      if (!stillConnected) {
        this.websocketService.onlineUsers.delete(userId);
        this.server.emit('user_status_changed', { userId, status: 'offline' });
      }
    }
  }

  @SubscribeMessage('join')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: { userId: string }) {
    if (payload && payload.userId) {
      client.join(`user:${payload.userId}`);
      this.activeConnections.set(client.id, payload.userId);
      
      const wasOnline = this.websocketService.isUserOnline(payload.userId);
      this.websocketService.onlineUsers.add(payload.userId);
      this.logger.log(`Client ${client.id} joined room user:${payload.userId}`);
      
      // Notify other clients about this user going online
      this.server.emit('user_status_changed', { userId: payload.userId, status: 'online' });
      
      // If they were previously offline, deliver all undelivered messages sent to them
      if (!wasOnline) {
        try {
          const undelivered = await this.messageRepository.query(
            `SELECT m.id, m.sender_id, m.room_id 
             FROM messages m
             JOIN chat_rooms r ON m.room_id = r.id
             WHERE m.is_delivered = false 
               AND m.sender_id <> $1
               AND (r.dietitian_id = $1 OR r.client_id = $1)`,
            [payload.userId]
          );

          if (undelivered.length > 0) {
            // Update in DB
            await this.messageRepository.query(
              `UPDATE messages 
               SET is_delivered = true 
               WHERE id IN (${undelivered.map((_, i) => `$${i + 1}`).join(',')})`,
              undelivered.map(m => m.id)
            );

            // Group by sender_id and notify them
            const senders = new Set<string>(undelivered.map(m => m.sender_id));
            senders.forEach(senderId => {
              this.server.to(`user:${senderId}`).emit('messages_delivered', {
                receiverId: payload.userId,
                messages: undelivered.filter(m => m.sender_id === senderId),
              });
            });
          }
        } catch (err) {
          this.logger.error('Failed to update undelivered messages status', err);
        }
      }
      
      return { status: 'success', joined: `user:${payload.userId}` };
    }
  }

  @SubscribeMessage('check_online_statuses')
  handleCheckOnlineStatuses(@ConnectedSocket() client: Socket, @MessageBody() payload: { userIds: string[] }) {
    if (payload && Array.isArray(payload.userIds)) {
      const statuses: Record<string, 'online' | 'offline'> = {};
      payload.userIds.forEach(uid => {
        statuses[uid] = this.websocketService.isUserOnline(uid) ? 'online' : 'offline';
      });
      return { status: 'success', statuses };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() payload: { receiverId: string, isTyping: boolean }) {
    const senderId = this.activeConnections.get(client.id);
    if (senderId && payload.receiverId) {
      this.server.to(`user:${payload.receiverId}`).emit('typing_status', {
        senderId,
        isTyping: payload.isTyping,
      });
    }
  }
} 