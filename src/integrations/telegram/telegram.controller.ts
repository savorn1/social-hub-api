import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  HttpStatus,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Response } from 'express';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './dto/webhook.dto';
import { Public } from '../../common/decorators/public.decorator';
import { InboxService } from '../../inbox/inbox.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { ConversationsGateway } from '../../conversations/gateway/conversations.gateway';
import { Platform, MessageType } from '../../common/enums/platform.enum';

class ConnectBotDto {
  @ApiProperty()
  @IsString()
  botToken: string;
}

class SendReplyDto {
  @ApiProperty()
  @IsString()
  content: string;
}

class UpdateInboxDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

@ApiTags('Integrations / Telegram')
@Controller('integrations/telegram')
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly inboxService: InboxService,
    private readonly conversationsService: ConversationsService,
    private readonly gateway: ConversationsGateway,
  ) {}

  // ─── Public webhook (legacy single-bot, kept for backward compat) ──────────
  @Post('webhook')
  @Public()
  @ApiExcludeEndpoint()
  async receiveUpdate(
    @Body() update: TelegramUpdate,
    @Headers('x-telegram-bot-api-secret-token') secretToken: string,
    @Res() res: Response,
  ) {
    if (!this.telegramService.verifySecret(secretToken)) {
      return res.status(HttpStatus.FORBIDDEN).send('Forbidden');
    }
    res.status(HttpStatus.OK).send('OK');
    // Legacy: try to find a telegram inbox and use its token
    const inboxes = await this.inboxService.findAll(Platform.TELEGRAM);
    const active = inboxes.find((i) => i.isActive);
    const token = active?.config?.botToken as string | undefined;
    if (token && active) {
      await this.telegramService.handleUpdate(token, active.id, update);
    }
  }

  // ─── Per-bot webhook ───────────────────────────────────────────────────────
  @Post('webhook/:inboxId')
  @Public()
  @ApiExcludeEndpoint()
  async receiveBotUpdate(
    @Param('inboxId') inboxId: string,
    @Body() update: TelegramUpdate,
    @Headers('x-telegram-bot-api-secret-token') secretToken: string,
    @Res() res: Response,
  ) {
    const inbox = await this.inboxService.findOne(inboxId).catch(() => null);
    if (!inbox) return res.status(HttpStatus.NOT_FOUND).send('Not found');

    if (!this.telegramService.verifySecret(secretToken)) {
      return res.status(HttpStatus.FORBIDDEN).send('Forbidden');
    }

    const botToken = inbox.config?.botToken as string | undefined;
    if (!botToken) return res.status(HttpStatus.BAD_REQUEST).send('No token');

    res.status(HttpStatus.OK).send('OK');
    await this.telegramService.handleUpdate(botToken, inboxId, update);
  }

  // ─── Bot validation ────────────────────────────────────────────────────────
  @Post('bots/validate')
  @ApiOperation({ summary: 'Validate a bot token and return bot info' })
  async validateBot(@Body() dto: ConnectBotDto) {
    if (!dto.botToken) throw new BadRequestException('botToken is required');
    return this.telegramService.getBotInfo(dto.botToken);
  }

  // ─── Per-inbox webhook management ─────────────────────────────────────────
  @Post('inboxes/:inboxId/set-webhook')
  @ApiOperation({ summary: 'Register the Telegram webhook for an inbox bot' })
  async setWebhook(@Param('inboxId') inboxId: string) {
    const inbox = await this.inboxService.findOne(inboxId);
    const botToken = inbox.config?.botToken as string | undefined;
    if (!botToken) throw new BadRequestException('Inbox has no bot token');
    await this.telegramService.setWebhook(botToken, inboxId);
    const webhookUrl = this.telegramService.getWebhookUrlForInbox(inboxId);
    return { success: true, webhookUrl };
  }

  @Delete('inboxes/:inboxId/webhook')
  @ApiOperation({ summary: 'Remove the Telegram webhook for an inbox bot' })
  async deleteWebhook(@Param('inboxId') inboxId: string) {
    const inbox = await this.inboxService.findOne(inboxId);
    const botToken = inbox.config?.botToken as string | undefined;
    if (!botToken) throw new BadRequestException('Inbox has no bot token');
    await this.telegramService.deleteWebhook(botToken);
    return { success: true };
  }

  @Get('inboxes/:inboxId/webhook-info')
  @ApiOperation({ summary: 'Get webhook info for an inbox bot' })
  async getWebhookInfo(@Param('inboxId') inboxId: string) {
    const inbox = await this.inboxService.findOne(inboxId);
    const botToken = inbox.config?.botToken as string | undefined;
    if (!botToken) throw new BadRequestException('Inbox has no bot token');
    const info = await this.telegramService.getWebhookInfo(botToken);
    const expectedUrl = this.telegramService.getWebhookUrlForInbox(inboxId);
    return {
      ...info,
      expectedUrl,
      isRegistered: info.url === expectedUrl,
    };
  }

  @Get('inboxes/:inboxId/bot-info')
  @ApiOperation({ summary: 'Get bot info for an inbox' })
  async getBotInfo(@Param('inboxId') inboxId: string) {
    const inbox = await this.inboxService.findOne(inboxId);
    const botToken = inbox.config?.botToken as string | undefined;
    if (!botToken) throw new BadRequestException('Inbox has no bot token');
    return this.telegramService.getBotInfo(botToken);
  }

  // ─── Inbox CRUD ────────────────────────────────────────────────────────────
  @Patch('inboxes/:inboxId')
  @ApiOperation({ summary: 'Toggle active state of an inbox' })
  async updateInbox(
    @Param('inboxId') inboxId: string,
    @Body() dto: UpdateInboxDto,
  ) {
    return this.inboxService.update(inboxId, dto);
  }

  @Delete('inboxes/:inboxId')
  @ApiOperation({ summary: 'Remove a Telegram bot inbox' })
  async removeInbox(@Param('inboxId') inboxId: string) {
    await this.inboxService.remove(inboxId);
    return { success: true };
  }

  // ─── Agent send reply ──────────────────────────────────────────────────────
  @Post('conversations/:id/send')
  @ApiOperation({ summary: 'Send an agent reply to a Telegram conversation' })
  async sendReply(
    @Param('id') conversationId: string,
    @Body() dto: SendReplyDto,
  ) {
    const conversation = await this.conversationsService.findOne(conversationId);

    const message = await this.conversationsService.addMessage({
      conversationId,
      type: MessageType.TEXT,
      content: dto.content,
      isFromContact: false,
    });

    // Look up the inbox (bot) for this conversation
    const inboxId = conversation.pageId;
    if (inboxId && conversation.contactId) {
      const inbox = await this.inboxService.findOne(inboxId).catch(() => null);
      const botToken = inbox?.config?.botToken as string | undefined;
      if (botToken && inbox?.isActive) {
        await this.telegramService.sendMessage(
          botToken,
          conversation.contactId,
          dto.content,
        );
      }
    }

    this.gateway.emitNewMessage(conversationId, message);
    return message;
  }
}
