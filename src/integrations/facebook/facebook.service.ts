import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  FacebookWebhookPayload,
  FacebookMessagingEvent,
  FacebookFeedChangeValue,
  FacebookPage,
} from './dto/webhook.dto';
import { ConversationsService } from '../../conversations/conversations.service';
import { InboxService } from '../../inbox/inbox.service';
import { ChatbotService } from '../../chatbot/chatbot.service';
import { BusinessHoursService } from '../../business-hours/business-hours.service';
import { Platform, MessageType } from '../../common/enums/platform.enum';

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);
  private readonly verifyToken: string;
  private readonly appUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly conversationsService: ConversationsService,
    private readonly inboxService: InboxService,
    private readonly chatbotService: ChatbotService,
    private readonly businessHoursService: BusinessHoursService,
  ) {
    this.verifyToken =
      configService.get<string>('integrations.facebook.verifyToken') ?? '';
    this.appUrl =
      configService.get<string>('app.url') ?? 'http://localhost:3000';
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

      for (const change of entry.changes ?? []) {
        if (
          change.field === 'feed' &&
          change.value?.item === 'comment' &&
          change.value.verb === 'add'
        ) {
          await this.processIncomingComment(entry.id, change.value);
        }
      }
    }
  }

  private async processIncomingMessage(
    pageId: string,
    event: FacebookMessagingEvent,
  ) {
    const contactId = event.sender.id;

    let conversation = await this.conversationsService.findByContact({
      platform: Platform.FACEBOOK,
      contactId,
      pageId,
    });

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
      outgoingText = await this.chatbotService.processMessage(
        conversation.id,
        messageText,
      );
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

  private async processIncomingComment(
    pageId: string,
    value: FacebookFeedChangeValue,
  ): Promise<void> {
    if (!value.from || !value.comment_id || !value.message) return;

    const contactId = value.from.id;
    const postId = value.post_id ?? '';

    let conversation = await this.conversationsService.findByContact({
      platform: Platform.FACEBOOK,
      contactId,
      pageId,
      externalId: postId,
    });

    if (!conversation) {
      conversation = await this.conversationsService.create({
        platform: Platform.FACEBOOK,
        contactId,
        contactName: value.from.name,
        pageId,
        externalId: postId,
        metadata: { type: 'comment', lastCommentId: value.comment_id },
      });
    } else {
      await this.conversationsService.updateMetadata(conversation.id, {
        ...conversation.metadata,
        type: 'comment',
        lastCommentId: value.comment_id,
      });
    }

    await this.conversationsService.addMessage({
      conversationId: conversation.id,
      type: MessageType.TEXT,
      content: value.message,
      isFromContact: true,
    });
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

  async replyToComment(
    commentId: string,
    accessToken: string,
    message: string,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `https://graph.facebook.com/v19.0/${commentId}/comments`,
          { message },
          { params: { access_token: accessToken } },
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to reply to Facebook comment: ${error}`);
      throw error;
    }
  }

  async syncPages(userAccessToken: string): Promise<FacebookPage[]> {
    try {
      const resp = await firstValueFrom(
        this.httpService.get<{ data: FacebookPage[] }>(
          `https://graph.facebook.com/v19.0/me/accounts`,
          {
            params: {
              access_token: userAccessToken,
              fields: 'id,name,access_token',
            },
          },
        ),
      );
      return resp.data.data ?? [];
    } catch (error) {
      this.logger.error(`Failed to sync Facebook pages: ${error}`);
      throw error;
    }
  }

  getWebhookInfo() {
    const masked = this.verifyToken
      ? `${'*'.repeat(Math.max(0, this.verifyToken.length - 4))}${this.verifyToken.slice(-4)}`
      : 'not configured';
    return {
      callbackUrl: `${this.appUrl}/integrations/facebook/webhook`,
      verifyToken: masked,
      subscribeFields: ['messages', 'messaging_postbacks', 'feed'],
      setupSteps: [
        'Go to Meta for Developers → Your App → Webhooks',
        `Set Callback URL: ${this.appUrl}/integrations/facebook/webhook`,
        'Set Verify Token to the value in your API .env (FACEBOOK_VERIFY_TOKEN)',
        'Subscribe to fields: messages, messaging_postbacks, feed',
        'Subscribe each Page to the webhook via App → Messenger → Webhooks',
      ],
    };
  }
}
