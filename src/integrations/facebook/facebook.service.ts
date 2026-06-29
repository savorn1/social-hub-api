import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { FacebookWebhookPayload } from './dto/webhook.dto';
import { ConversationsService } from '../../conversations/conversations.service';
import { InboxService } from '../../inbox/inbox.service';
import { ChatbotService } from '../../chatbot/chatbot.service';
import { BusinessHoursService } from '../../business-hours/business-hours.service';
import { Platform, MessageType } from '../../common/enums/platform.enum';

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);
  private readonly verifyToken: string;

  constructor(
    configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly conversationsService: ConversationsService,
    private readonly inboxService: InboxService,
    private readonly chatbotService: ChatbotService,
    private readonly businessHoursService: BusinessHoursService,
  ) {
    this.verifyToken =
      configService.get<string>('integrations.facebook.verifyToken') ?? '';
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.verifyToken) return challenge;
    return null;
  }

  async handleWebhook(payload: FacebookWebhookPayload): Promise<void> {
    if (payload.object !== 'page') return;

    for (const entry of payload.entry) {
      for (const event of entry.messaging ?? []) {
        if (event.message) {
          await this.processIncomingMessage(entry.id, event);
        }
      }
    }
  }

  private async processIncomingMessage(
    pageId: string,
    event: FacebookWebhookPayload['entry'][0]['messaging'][0],
  ) {
    const contactId = event.sender.id;

    let conversation = (
      await this.conversationsService.findAll(1, 1, Platform.FACEBOOK)
    ).data.find((c) => c.contactId === contactId && c.pageId === pageId);

    if (!conversation) {
      conversation = await this.conversationsService.create({
        platform: Platform.FACEBOOK,
        contactId,
        pageId,
        externalId: contactId,
      });
    }

    const messageText = event.message?.text;
    if (!messageText) return;

    await this.conversationsService.addMessage({
      conversationId: conversation.id,
      type: MessageType.TEXT,
      content: messageText,
      isFromContact: true,
    });

    const inboxes = await this.inboxService.findAll(Platform.FACEBOOK);
    const inbox = inboxes.find((i) => i.pageId === pageId && i.isActive);
    if (!inbox?.accessToken) return;

    const withinHours = await this.businessHoursService.isWithinBusinessHours();
    let outgoingText: string | null = null;

    if (!withinHours) {
      outgoingText =
        "We're currently outside business hours. We'll get back to you as soon as possible!";
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      outgoingText = (await this.chatbotService.processMessage(
        conversation.id,
        messageText,
      )) as string | null;
    }

    if (outgoingText) {
      await this.sendMessage(contactId, inbox.accessToken, outgoingText);
      await this.conversationsService.addMessage({
        conversationId: conversation.id,
        type: MessageType.TEXT,
        content: outgoingText,
        isFromContact: false,
      });
    }
  }

  async sendMessage(
    recipientId: string,
    accessToken: string,
    text: string,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `https://graph.facebook.com/v19.0/me/messages`,
          { recipient: { id: recipientId }, message: { text } },
          { params: { access_token: accessToken } },
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to send Facebook message: ${error}`);
      throw error;
    }
  }
}
