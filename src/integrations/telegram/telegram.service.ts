import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TelegramUpdate } from './dto/webhook.dto';
import { ConversationsService } from '../../conversations/conversations.service';
import { ChatbotService } from '../../chatbot/chatbot.service';
import { BusinessHoursService } from '../../business-hours/business-hours.service';
import { Platform, MessageType } from '../../common/enums/platform.enum';

export interface TelegramBotInfo {
  id: number;
  username: string;
  first_name: string;
}

export interface TelegramWebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly secretToken: string;
  private readonly webhookBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly conversationsService: ConversationsService,
    private readonly chatbotService: ChatbotService,
    private readonly businessHoursService: BusinessHoursService,
  ) {
    this.secretToken =
      configService.get<string>('integrations.telegram.secretToken') ?? '';
    this.webhookBaseUrl =
      configService.get<string>('integrations.telegram.webhookUrl') ?? '';
  }

  private apiBase(botToken: string): string {
    return `https://api.telegram.org/bot${botToken}`;
  }

  getSecretToken(): string {
    return this.secretToken;
  }

  getWebhookUrlForInbox(inboxId: string): string {
    return `${this.webhookBaseUrl}/${inboxId}`;
  }

  verifySecret(received: string, expected?: string): boolean {
    const secret = expected ?? this.secretToken;
    return !secret || received === secret;
  }

  async getBotInfo(botToken: string): Promise<TelegramBotInfo> {
    const resp = await firstValueFrom(
      this.httpService.get<{ ok: boolean; result: TelegramBotInfo }>(
        `${this.apiBase(botToken)}/getMe`,
      ),
    );
    return resp.data.result;
  }

  async setWebhook(botToken: string, inboxId: string): Promise<void> {
    const webhookUrl = this.getWebhookUrlForInbox(inboxId);
    await firstValueFrom(
      this.httpService.post(`${this.apiBase(botToken)}/setWebhook`, {
        url: webhookUrl,
        ...(this.secretToken ? { secret_token: this.secretToken } : {}),
      }),
    );
  }

  async getWebhookInfo(botToken: string): Promise<TelegramWebhookInfo> {
    const resp = await firstValueFrom(
      this.httpService.get<{ ok: boolean; result: TelegramWebhookInfo }>(
        `${this.apiBase(botToken)}/getWebhookInfo`,
      ),
    );
    return resp.data.result;
  }

  async deleteWebhook(botToken: string): Promise<void> {
    await firstValueFrom(
      this.httpService.post(`${this.apiBase(botToken)}/deleteWebhook`, {}),
    );
  }

  async handleUpdate(
    botToken: string,
    inboxId: string,
    update: TelegramUpdate,
  ): Promise<void> {
    if (!update.message?.text) return;

    const chatId = String(update.message.chat.id);
    const contactName = [
      update.message.from.first_name,
      update.message.from.last_name,
    ]
      .filter(Boolean)
      .join(' ');

    let conversation = await this.conversationsService.findByContact({
      platform: Platform.TELEGRAM,
      contactId: chatId,
      pageId: inboxId,
    });

    if (!conversation) {
      conversation = await this.conversationsService.create({
        platform: Platform.TELEGRAM,
        contactId: chatId,
        contactName,
        externalId: chatId,
        pageId: inboxId,
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
      outgoingText = await this.chatbotService.processMessage(
        conversation.id,
        update.message.text,
      );
    }

    if (outgoingText) {
      await this.sendMessage(botToken, chatId, outgoingText);
      await this.conversationsService.addMessage({
        conversationId: conversation.id,
        type: MessageType.TEXT,
        content: outgoingText,
        isFromContact: false,
      });
    }
  }

  async sendMessage(
    botToken: string,
    chatId: string | number,
    text: string,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.apiBase(botToken)}/sendMessage`, {
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
}
