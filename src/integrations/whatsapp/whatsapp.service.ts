import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { WhatsAppWebhookPayload } from './dto/webhook.dto';
import { ConversationsService } from '../../conversations/conversations.service';
import { InboxService } from '../../inbox/inbox.service';
import { ChatbotService } from '../../chatbot/chatbot.service';
import { Platform, MessageType } from '../../common/enums/platform.enum';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly verifyToken: string;
  private readonly apiVersion = 'v19.0';

  constructor(
    configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly conversationsService: ConversationsService,
    private readonly inboxService: InboxService,
    private readonly chatbotService: ChatbotService,
  ) {
    this.verifyToken =
      configService.get<string>('integrations.whatsapp.verifyToken') ?? '';
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
        for (const msg of change.value.messages ?? []) {
          if (msg.type === 'text' && msg.text?.body) {
            await this.processMessage(
              change.value.metadata.phone_number_id,
              msg.from,
              msg.text.body,
              change.value.contacts?.[0]?.profile.name,
            );
          }
        }
      }
    }
  }

  private async processMessage(
    phoneNumberId: string,
    from: string,
    text: string,
    contactName?: string,
  ) {
    let conversation = (
      await this.conversationsService.findAll(1, 1, Platform.WHATSAPP)
    ).data.find((c) => c.contactId === from && c.pageId === phoneNumberId);

    if (!conversation) {
      conversation = await this.conversationsService.create({
        platform: Platform.WHATSAPP,
        contactId: from,
        contactName,
        pageId: phoneNumberId,
        externalId: from,
      });
    }

    await this.conversationsService.addMessage({
      conversationId: conversation.id,
      type: MessageType.TEXT,
      content: text,
      isFromContact: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const reply: string | null = await this.chatbotService.processMessage(
      conversation.id,
      text,
    );

    if (reply) {
      const inboxes = await this.inboxService.findAll(Platform.WHATSAPP);
      const inbox = inboxes.find(
        (i) => i.pageId === phoneNumberId && i.isActive,
      );
      if (inbox?.accessToken) {
        await this.sendMessage(from, phoneNumberId, inbox.accessToken, reply);
        await this.conversationsService.addMessage({
          conversationId: conversation.id,
          type: MessageType.TEXT,
          content: reply,
          isFromContact: false,
        });
      }
    }
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
}
