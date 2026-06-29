import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FacebookService } from './facebook.service';
import { FacebookWebhookPayload } from './dto/webhook.dto';
import { Public } from '../../common/decorators/public.decorator';
import { ConversationsService } from '../../conversations/conversations.service';
import { ConversationsGateway } from '../../conversations/gateway/conversations.gateway';
import { InboxService } from '../../inbox/inbox.service';
import { MessageType, Platform } from '../../common/enums/platform.enum';

class SyncPagesDto {
  @ApiProperty({ description: 'Facebook User Access Token from Meta Login' })
  @IsString()
  userAccessToken: string;
}

class SendReplyDto {
  @ApiProperty()
  @IsString()
  content: string;
}

@ApiTags('Integrations / Facebook')
@Controller('integrations/facebook')
export class FacebookController {
  constructor(
    private readonly facebookService: FacebookService,
    private readonly conversationsService: ConversationsService,
    private readonly inboxService: InboxService,
    private readonly gateway: ConversationsGateway,
  ) {}

  @Get('webhook')
  @Public()
  @ApiExcludeEndpoint()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.facebookService.verifyWebhook(mode, token, challenge);
    if (result) return res.status(HttpStatus.OK).send(result);
    return res.status(HttpStatus.FORBIDDEN).send('Forbidden');
  }

  @Post('webhook')
  @Public()
  @ApiExcludeEndpoint()
  async receiveWebhook(
    @Body() payload: FacebookWebhookPayload,
    @Res() res: Response,
  ) {
    res.status(HttpStatus.OK).send('EVENT_RECEIVED');
    await this.facebookService.handleWebhook(payload);
  }

  @Get('status')
  @ApiOperation({ summary: 'Facebook integration status' })
  status() {
    return { integration: 'facebook', status: 'active' };
  }

  @Get('webhook/info')
  @ApiOperation({ summary: 'Get Facebook webhook configuration info' })
  getWebhookInfo() {
    return this.facebookService.getWebhookInfo();
  }

  @Post('sync-pages')
  @ApiOperation({
    summary: 'Fetch all pages manageable by a User Access Token',
  })
  async syncPages(@Body() dto: SyncPagesDto) {
    if (!dto.userAccessToken) {
      throw new BadRequestException('userAccessToken is required');
    }
    return this.facebookService.syncPages(dto.userAccessToken);
  }

  @Post('conversations/:id/send')
  @ApiOperation({
    summary: 'Send an agent reply to Facebook (Messenger or comment)',
  })
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

    const inboxes = await this.inboxService.findAll(Platform.FACEBOOK);
    const inbox = inboxes.find(
      (i) => i.pageId === conversation.pageId && i.isActive,
    );

    if (inbox?.accessToken) {
      const isComment = conversation.metadata?.type === 'comment';
      if (isComment) {
        const lastCommentId = conversation.metadata?.lastCommentId as
          | string
          | undefined;
        if (lastCommentId) {
          await this.facebookService.replyToComment(
            lastCommentId,
            inbox.accessToken,
            dto.content,
          );
        }
      } else if (conversation.contactId) {
        await this.facebookService.sendMessage(
          conversation.contactId,
          inbox.accessToken,
          dto.content,
        );
      }
    }

    this.gateway.emitNewMessage(conversationId, message);
    return message;
  }
}
