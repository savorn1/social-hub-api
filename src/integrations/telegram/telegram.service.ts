import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TelegramUpdate } from './dto/webhook.dto';
import { ConversationsService } from '../../conversations/conversations.service';
import { ChatbotService } from '../../chatbot/chatbot.service';
import { BusinessHoursService } from '../../business-hours/business-hours.service';
import { Platform, MessageType } from '../../common/enums/platform.enum';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly secretToken: string;
  private readonly apiBase: string;

  constructor(
    configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly conversationsService: ConversationsService,
    private readonly chatbotService: ChatbotService,
    private readonly businessHoursService: BusinessHoursService,
  ) {
    this.botToken =
      configService.get<string>('integrations.telegram.botToken') ?? '';
    this.secretToken =
      configService.get<string>('integrations.telegram.secretToken') ?? '';
    this.apiBase = `https://api.telegram.org/bot${this.botToken}`;
  }

  verifySecret(token: string): boolean {
    return !this.secretToken || token === this.secretToken;
  }

  async handleUpdate(update: TelegramUpdate): Promise<void> {
    if (!update.message?.text) return;

    const chatId = String(update.message.chat.id);
    const contactName = [
      update.message.from.first_name,
      update.message.from.last_name,
    ]
      .filter(Boolean)
      .join(' ');

    let conversation = (
      await this.conversationsService.findAll(1, 1, Platform.TELEGRAM)
    ).data.find((c) => c.contactId === chatId);

    if (!conversation) {
      conversation = await this.conversationsService.create({
        platform: Platform.TELEGRAM,
        contactId: chatId,
        contactName,
        externalId: chatId,
      });
    }

    await this.conversationsService.addMessage({
      conversationId: conversation.id,
      type: MessageType.TEXT,
      content: update.message.text,
      isFromContact: true,
    });

    const withinHours = await this.businessHoursService.isWithinBusinessHours();
    let outgoingText: string | null = null;

    if (!withinHours) {
      outgoingText =
        "We're currently outside business hours. We'll get back to you as soon as possible!";
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      outgoingText = (await this.chatbotService.processMessage(
        conversation.id,
        update.message.text,
      )) as string | null;
    }

    if (outgoingText) {
      await this.sendMessage(chatId, outgoingText);
      await this.conversationsService.addMessage({
        conversationId: conversation.id,
        type: MessageType.TEXT,
        content: outgoingText,
        isFromContact: false,
      });
    }
  }

  async sendMessage(chatId: string | number, text: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.apiBase}/sendMessage`, {
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to send Telegram message: ${error}`);
      throw error;
    }
  }

  async setWebhook(webhookUrl: string): Promise<void> {
    await firstValueFrom(
      this.httpService.post(`${this.apiBase}/setWebhook`, {
        url: webhookUrl,
        secret_token: this.secretToken,
      }),
    );
  }
}
