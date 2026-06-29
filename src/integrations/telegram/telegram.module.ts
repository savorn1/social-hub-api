import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
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
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
