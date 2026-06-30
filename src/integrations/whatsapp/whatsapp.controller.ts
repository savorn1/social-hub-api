import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Response } from 'express';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppWebhookPayload } from './dto/webhook.dto';
import { Public } from '../../common/decorators/public.decorator';
import { ConversationsService } from '../../conversations/conversations.service';
import { ConversationsGateway } from '../../conversations/gateway/conversations.gateway';
import { InboxService } from '../../inbox/inbox.service';
import { MessageType, Platform } from '../../common/enums/platform.enum';

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

@ApiTags('Integrations / WhatsApp')
@Controller('integrations/whatsapp')
export class WhatsAppController {
  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly conversationsService: ConversationsService,
    private readonly inboxService: InboxService,
    private readonly gateway: ConversationsGateway,
  ) {}

  @Public()
  @Get('webhook')
  @ApiExcludeEndpoint()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.whatsappService.verifyWebhook(mode, token, challenge);
    if (result) return res.status(HttpStatus.OK).send(result);
    return res.status(HttpStatus.FORBIDDEN).send('Forbidden');
  }

  @Public()
  @Post('webhook')
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Body() payload: WhatsAppWebhookPayload,
    @Res() res: Response,
  ) {
    res.status(HttpStatus.OK).send('EVENT_RECEIVED');
    await this.whatsappService.handleWebhook(payload);
  }

  @Get('webhook/info')
  @ApiOperation({ summary: 'Get WhatsApp webhook configuration info' })
  getWebhookInfo() {
    return this.whatsappService.getWebhookInfo();
  }

  @Post('conversations/:id/send')
  @ApiOperation({ summary: 'Send an agent reply to a WhatsApp conversation' })
  async sendReply(
    @Param('id') conversationId: string,
    @Body() dto: SendReplyDto,
  ) {
    const conversation =
      await this.conversationsService.findOne(conversationId);

    const message = await this.conversationsService.addMessage({
      conversationId,
      type: MessageType.TEXT,
      content: dto.content,
      isFromContact: false,
    });

    const inboxes = await this.inboxService.findAll(Platform.WHATSAPP);
    const inbox = inboxes.find(
      (i) => i.pageId === conversation.pageId && i.isActive,
    );

    if (inbox?.accessToken && conversation.contactId && conversation.pageId) {
      await this.whatsappService.sendMessage(
        conversation.contactId,
        conversation.pageId,
        inbox.accessToken,
        dto.content,
      );
    }

    this.gateway.emitNewMessage(conversationId, message);
    return message;
  }

  @Patch('inboxes/:inboxId')
  @ApiOperation({ summary: 'Toggle WhatsApp inbox active state' })
  async updateInbox(
    @Param('inboxId') inboxId: string,
    @Body() dto: UpdateInboxDto,
  ) {
    return this.inboxService.update(inboxId, dto);
  }

  @Delete('inboxes/:inboxId')
  @ApiOperation({ summary: 'Remove a WhatsApp phone number inbox' })
  async removeInbox(@Param('inboxId') inboxId: string) {
    await this.inboxService.remove(inboxId);
    return { success: true };
  }
}
