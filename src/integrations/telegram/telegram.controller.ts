import {
  Controller,
  Post,
  Body,
  Headers,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './dto/webhook.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Integrations / Telegram')
@Controller('integrations/telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

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
    await this.telegramService.handleUpdate(update);
  }
}
