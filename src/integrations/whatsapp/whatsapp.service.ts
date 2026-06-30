import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { WhatsAppWebhookPayload } from './dto/webhook.dto';
import { ConversationsService } from '../../conversations/conversations.service';
import { InboxService } from '../../inbox/inbox.service';
import { ChatbotService } from '../../chatbot/chatbot.service';
import { BusinessHoursService } from '../../business-hours/business-hours.service';
import { ConversationsGateway } from '../../conversations/gateway/conversations.gateway';
import { Platform, MessageType } from '../../common/enums/platform.enum';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly verifyToken: string;
  private readonly appUrl: string;
  private readonly apiVersion = 'v19.0';

  constructor(
    configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly conversationsService: ConversationsService,
    private readonly inboxService: InboxService,
    private readonly chatbotService: ChatbotService,
    private readonly businessHoursService: BusinessHoursService,
    private readonly gateway: ConversationsGateway,
  ) {
    this.verifyToken =
      configService.get<string>('integrations.whatsapp.verifyToken') ?? '';
    this.appUrl =
      configService.get<string>('app.url') ?? 'http://localhost:3000';
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.verifyToken) return challenge;
    return null;
  }

  async handleWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    if (payload.object !== 'whatsapp_business_account') return;

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') continue;
        const phoneNumberId = change.value.metadata.phone_number_id;
        const contactName = change.value.contacts?.[0]?.profile.name;

        for (const msg of change.value.messages ?? []) {
          if (msg.type === 'text' && msg.text?.body) {
            await this.processTextMessage(
              phoneNumberId,
              msg.from,
              msg.text.body,
              contactName,
            );
          } else if (msg.type === 'image' && msg.image) {
            await this.processMediaMessage(
              phoneNumberId,
              msg.from,
              MessageType.IMAGE,
              msg.image.id,
              msg.image.caption,
              contactName,
            );
          } else if (msg.type === 'document' && msg.document) {
            await this.processMediaMessage(
              phoneNumberId,
              msg.from,
              MessageType.FILE,
              msg.document.id,
              msg.document.filename ?? msg.document.caption,
              contactName,
            );
          } else if (msg.type === 'video' && msg.video) {
            await this.processMediaMessage(
              phoneNumberId,
              msg.from,
              MessageType.FILE,
              msg.video.id,
              msg.video.caption ?? 'Video',
              contactName,
            );
          }
        }
      }
    }
  }

  private async findOrCreateConversation(
    phoneNumberId: string,
    from: string,
    contactName?: string,
  ) {
    let conversation = await this.conversationsService.findByContact({
      platform: Platform.WHATSAPP,
      contactId: from,
      pageId: phoneNumberId,
    });

    if (!conversation) {
      conversation = await this.conversationsService.create({
        platform: Platform.WHATSAPP,
        contactId: from,
        contactName,
        pageId: phoneNumberId,
        externalId: from,
      });
    }

    return conversation;
  }

  private async processTextMessage(
    phoneNumberId: string,
    from: string,
    text: string,
    contactName?: string,
  ) {
    const conversation = await this.findOrCreateConversation(
      phoneNumberId,
      from,
      contactName,
    );

    const message = await this.conversationsService.addMessage({
      conversationId: conversation.id,
      type: MessageType.TEXT,
      content: text,
      isFromContact: true,
    });

    this.gateway.emitNewMessage(conversation.id, message);

    if (conversation.handoverMode) return;

    const withinHours =
      await this.businessHoursService.isWithinBusinessHours();
    let outgoingText: string | null = null;

    if (!withinHours) {
      outgoingText =
        "We're currently outside business hours. We'll get back to you as soon as possible!";
    } else {
      outgoingText = await this.chatbotService.processMessage(
        conversation.id,
        text,
      );
    }

    if (outgoingText) {
      const inbox = await this.findActiveInbox(phoneNumberId);
      if (inbox?.accessToken) {
        await this.sendMessage(from, phoneNumberId, inbox.accessToken, outgoingText);
        const botMsg = await this.conversationsService.addMessage({
          conversationId: conversation.id,
          type: MessageType.TEXT,
          content: outgoingText,
          isFromContact: false,
        });
        this.gateway.emitNewMessage(conversation.id, botMsg);
      }
    }
  }

  private async processMediaMessage(
    phoneNumberId: string,
    from: string,
    type: MessageType,
    mediaId: string,
    caption?: string,
    contactName?: string,
  ) {
    const conversation = await this.findOrCreateConversation(
      phoneNumberId,
      from,
      contactName,
    );

    const message = await this.conversationsService.addMessage({
      conversationId: conversation.id,
      type,
      content: caption ?? (type === MessageType.IMAGE ? 'Image' : 'File'),
      mediaUrl: `/whatsapp-media/${mediaId}`,
      isFromContact: true,
    });

    this.gateway.emitNewMessage(conversation.id, message);
  }

  private async findActiveInbox(phoneNumberId: string) {
    const inboxes = await this.inboxService.findAll(Platform.WHATSAPP);
    return inboxes.find((i) => i.pageId === phoneNumberId && i.isActive);
  }

  async sendMessage(
    to: string,
    phoneNumberId: string,
    accessToken: string,
    text: string,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`,
          {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
          },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${String(error)}`);
      throw error;
    }
  }

  getWebhookInfo() {
    const masked = this.verifyToken
      ? `${'*'.repeat(Math.max(0, this.verifyToken.length - 4))}${this.verifyToken.slice(-4)}`
      : 'not configured';
    return {
      callbackUrl: `${this.appUrl}/integrations/whatsapp/webhook`,
      verifyToken: masked,
      subscribeFields: ['messages'],
      setupSteps: [
        'Go to Meta for Developers → Your App → WhatsApp → Configuration',
        `Set Callback URL: ${this.appUrl}/integrations/whatsapp/webhook`,
        'Set Verify Token to the value in your API .env (WHATSAPP_VERIFY_TOKEN)',
        'Subscribe to webhook field: messages',
        'Add each phone number below using its Phone Number ID and System User Access Token',
      ],
    };
  }
}
