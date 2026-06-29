import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConversationsService } from '../conversations.service';
import { CreateMessageDto } from '../dto/create-message.dto';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ConversationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ConversationsGateway.name);

  constructor(private readonly conversationsService: ConversationsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.join(`conversation:${conversationId}`);
    return { event: 'joined', data: conversationId };
  }

  @SubscribeMessage('leaveConversation')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.leave(`conversation:${conversationId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() dto: CreateMessageDto) {
    const message = await this.conversationsService.addMessage(dto);
    this.server
      .to(`conversation:${dto.conversationId}`)
      .emit('newMessage', message);
    return message;
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { conversationId: string; userId?: string; userName?: string },
  ) {
    client
      .to(`conversation:${data.conversationId}`)
      .emit('userTyping', { userId: data.userId, userName: data.userName });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId?: string },
  ) {
    client
      .to(`conversation:${data.conversationId}`)
      .emit('userStopTyping', { userId: data.userId });
  }

  emitNewMessage(conversationId: string, message: unknown) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('newMessage', message);
  }
}
