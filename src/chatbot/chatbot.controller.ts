import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { CreateChatbotDto } from './dto/create-chatbot.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Chatbot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  @ApiOperation({ summary: 'Create a chatbot' })
  create(@Body() dto: CreateChatbotDto) {
    return this.chatbotService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List chatbots' })
  findAll() {
    return this.chatbotService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chatbot' })
  findOne(@Param('id') id: string) {
    return this.chatbotService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a chatbot' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateChatbotDto>) {
    return this.chatbotService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a chatbot' })
  remove(@Param('id') id: string) {
    return this.chatbotService.remove(id);
  }
}
