import { Controller, Get, Post, Body, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppWebhookPayload } from './dto/webhook.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('WhatsApp')
@Controller('integrations/whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Public()
  @Get('webhook')
  @ApiOperation({ summary: 'Verify WhatsApp webhook' })
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.whatsappService.verifyWebhook(mode, token, challenge);
    if (result) return res.status(200).send(result);
    return res.status(403).send('Forbidden');
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Receive WhatsApp webhook events' })
  handleWebhook(@Body() payload: WhatsAppWebhookPayload) {
    return this.whatsappService.handleWebhook(payload);
  }
}
