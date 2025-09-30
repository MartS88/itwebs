// Nest js
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

// Services
import { WebsocketService } from './websocket.service';

// Types
import { MessagePayload, BroadcastPayload } from './types';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebSocketGateway');

  constructor(private readonly websocketService: WebsocketService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const clientId = client.id;
    this.logger.log(`Client connected: ${clientId}`);
    

    client.emit('connection', {
      message: 'Connected to WebSocket server',
      clientId: clientId,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.logger.log(`Client disconnected: ${clientId}`);
  }

  /**
   * Handles incoming messages from clients
   * Example: client.emit('message', { text: 'Hello', userId: 123 })
   */
  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessagePayload,
  ) {
    this.logger.log(`Message received from ${client.id}: ${JSON.stringify(payload)}`);
    

    return {
      event: 'message',
      data: {
        text: `Server received: ${payload.text}`,
        clientId: client.id,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Broadcasts message to all connected clients
   * Example: client.emit('broadcast', { message: 'Hello everyone' })
   */
  @SubscribeMessage('broadcast')
  handleBroadcast(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: BroadcastPayload,
  ) {
    this.logger.log(`Broadcasting message from ${client.id}`);
    
    this.server.emit('broadcast', {
      message: payload.message,
      from: client.id,
      timestamp: new Date().toISOString(),
    });

    return {
      event: 'broadcast',
      data: {
        success: true,
        message: 'Broadcast sent',
      },
    };
  }

  /**
   * Joins a specific room
   * Example: client.emit('join-room', { room: 'chat-1' })
   */
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string },
  ) {
    const { room } = payload;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    

    client.to(room).emit('user-joined', {
      clientId: client.id,
      room: room,
      timestamp: new Date().toISOString(),
    });

    return {
      event: 'join-room',
      data: {
        success: true,
        room: room,
        message: `Joined room: ${room}`,
      },
    };
  }

  /**
   * Leaves a specific room
   * Example: client.emit('leave-room', { room: 'chat-1' })
   */
  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string },
  ) {
    const { room } = payload;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
    

    client.to(room).emit('user-left', {
      clientId: client.id,
      room: room,
      timestamp: new Date().toISOString(),
    });

    return {
      event: 'leave-room',
      data: {
        success: true,
        room: room,
        message: `Left room: ${room}`,
      },
    };
  }

  /**
   * Sends message to a specific room
   * Example: client.emit('room-message', { room: 'chat-1', text: 'Hello room!' })
   */
  @SubscribeMessage('room-message')
  handleRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string; text: string },
  ) {
    const { room, text } = payload;
    this.logger.log(`Room message from ${client.id} to room ${room}: ${text}`);
    

    this.server.to(room).emit('room-message', {
      text: text,
      from: client.id,
      room: room,
      timestamp: new Date().toISOString(),
    });

    return {
      event: 'room-message',
      data: {
        success: true,
        message: 'Message sent to room',
      },
    };
  }

  /**
   * Gets list of connected clients count
   * Example: client.emit('get-clients-count')
   */
  @SubscribeMessage('get-clients-count')
  async handleGetClientsCount(@ConnectedSocket() client: Socket) {
    const sockets = await this.server.fetchSockets();
    const count = sockets.length;
    
    return {
      event: 'clients-count',
      data: {
        count: count,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Server method to broadcast notifications to all clients
   * Can be called from other services
   */
  sendNotification(notification: any) {
    this.server.emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Server method to send message to specific room
   * Can be called from other services
   */
  sendToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
