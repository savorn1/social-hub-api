import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { FacebookService } from './facebook.service';
import { FacebookWebhookPayload } from './dto/webhook.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Integrations / Facebook')
@Controller('integrations/facebook')
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}

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
}
