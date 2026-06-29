import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MessageType } from '../common/enums/platform.enum';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a conversation' })
  create(@Body() dto: CreateConversationDto) {
    return this.conversationsService.create(dto);
  }

  @Get('contacts')
  @ApiOperation({
    summary: 'List unique contacts grouped by contactId+platform',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getContacts(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.conversationsService.getContacts(page, limit);
  }

  @Get()
  @ApiOperation({ summary: 'List conversations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'platform', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('platform') platform?: string,
    @Query('search') search?: string,
  ) {
    return this.conversationsService.findAll(page, limit, platform, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a conversation with messages' })
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update conversation status / assignment' })
  update(@Param('id') id: string, @Body() dto: UpdateConversationDto) {
    return this.conversationsService.update(id, dto);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message' })
  addMessage(@Body() dto: CreateMessageDto) {
    return this.conversationsService.addMessage(dto);
  }

  @Post(':id/upload')
  @ApiOperation({
    summary: 'Upload a file/image and attach it to a conversation',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (
          _req: Express.Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    }),
  )
  uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const mediaUrl = `/uploads/${file.filename}`;
    const type = file.mimetype.startsWith('image/')
      ? MessageType.IMAGE
      : MessageType.FILE;
    return this.conversationsService.addMessage({
      conversationId: id,
      type,
      content: file.originalname,
      mediaUrl,
      isFromContact: false,
    });
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'List messages in a conversation' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMessages(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.conversationsService.getMessages(id, page, limit);
  }

  @Post(':id/csat')
  @ApiOperation({ summary: 'Submit CSAT score for a conversation' })
  submitCsat(
    @Param('id') id: string,
    @Query('score', ParseIntPipe) score: number,
    @Query('comment') comment?: string,
  ) {
    return this.conversationsService.submitCsat(id, score, comment);
  }
}
