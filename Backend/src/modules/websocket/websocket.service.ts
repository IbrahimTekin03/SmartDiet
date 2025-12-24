import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class WebsocketService {
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  emitToAll(event: string, data: any) {
    if (this.server) {
      this.server.emit(event, data);
    }
  }

  emitToRoom(room: string, event: string, data: any) {
    if (this.server) {
      this.server.to(room).emit(event, data);
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    this.emitToRoom(`user:${userId}`, event, data);
  }
} 