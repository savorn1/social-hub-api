import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { ConversationsModule } from '../../conversations/conversations.module';
import { InboxModule } from '../../inbox/inbox.module';
import { ChatbotModule } from '../../chatbot/chatbot.module';

@Module({
  imports: [HttpModule, ConversationsModule, InboxModule, ChatbotModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
