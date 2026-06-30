import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { ConversationsModule } from '../../conversations/conversations.module';
import { InboxModule } from '../../inbox/inbox.module';
import { ChatbotModule } from '../../chatbot/chatbot.module';
import { BusinessHoursModule } from '../../business-hours/business-hours.module';

@Module({
  imports: [
    HttpModule,
    ConversationsModule,
    InboxModule,
    ChatbotModule,
    BusinessHoursModule,
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
