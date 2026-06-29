import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateReplyDto, ChatCompletionDto } from './dto/generate.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat completion' })
  chatCompletion(@Body() dto: ChatCompletionDto) {
    return this.aiService.chatCompletion(dto);
  }

  @Post('reply')
  @ApiOperation({ summary: 'Generate AI reply for a conversation' })
  generateReply(@Body() dto: GenerateReplyDto) {
    return this.aiService.generateReply(dto);
  }
}
