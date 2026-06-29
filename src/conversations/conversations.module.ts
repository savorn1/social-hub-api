import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsGateway } from './gateway/conversations.gateway';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { ConversationNote } from './entities/conversation-note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message, ConversationNote])],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationsGateway],
  exports: [ConversationsService, ConversationsGateway],
})
export class ConversationsModule {}
