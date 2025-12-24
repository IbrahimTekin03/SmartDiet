import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WebsocketService } from './websocket.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly websocketService: WebsocketService) {}

  afterInit(server: Server) {
    this.websocketService.setServer(server);
    this.logger.log('WebSocket Sunucusu başlatıldı');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client bağlandı: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ayrıldı: ${client.id}`);
  }
} 