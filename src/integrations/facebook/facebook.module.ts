import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FacebookService } from './facebook.service';
import { FacebookController } from './facebook.controller';
import { ConversationsModule } from '../../conversations/conversations.module';
import { InboxModule } from '../../inbox/inbox.module';
import { ChatbotModule } from '../../chatbot/chatbot.module';
import { BusinessHoursModule } from '../../business-hours/business-hours.module';

@Module({
  imports: [HttpModule, ConversationsModule, InboxModule, ChatbotModule, BusinessHoursModule],
  controllers: [FacebookController],
  providers: [FacebookService],
  exports: [FacebookService],
})
export class FacebookModule {}
