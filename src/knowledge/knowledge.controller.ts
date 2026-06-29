import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import {
  CreateKnowledgeBaseDto,
  CreateKnowledgeItemDto,
} from './dto/create-knowledge-base.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

const ALLOWED_MIMETYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

@ApiTags('Knowledge')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post('bases')
  @ApiOperation({ summary: 'Create a knowledge base' })
  createBase(@Body() dto: CreateKnowledgeBaseDto) {
    return this.knowledgeService.createBase(dto);
  }

  @Get('bases')
  @ApiOperation({ summary: 'List knowledge bases' })
  findAllBases() {
    return this.knowledgeService.findAllBases();
  }

  @Get('bases/:id')
  @ApiOperation({ summary: 'Get knowledge base with items' })
  findOneBase(@Param('id') id: string) {
    return this.knowledgeService.findOneBase(id);
  }

  @Post('bases/:id/items')
  @ApiOperation({ summary: 'Add item to knowledge base' })
  addItem(@Param('id') id: string, @Body() dto: CreateKnowledgeItemDto) {
    return this.knowledgeService.addItem(id, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update a knowledge item' })
  updateItem(@Param('id') id: string, @Body() dto: Partial<CreateKnowledgeItemDto>) {
    return this.knowledgeService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete a knowledge item' })
  removeItem(@Param('id') id: string) {
    return this.knowledgeService.removeItem(id);
  }

  @Post('bases/:id/upload')
  @ApiOperation({ summary: 'Upload a PDF, DOCX, or TXT file and parse into knowledge items' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_MIMETYPES.has(file.mimetype) && !file.originalname.match(/\.(pdf|docx|txt)$/i)) {
      throw new BadRequestException('Only PDF, DOCX, and TXT files are supported');
    }
    return this.knowledgeService.uploadDocument(id, file);
  }

  @Get('search')
  @ApiOperation({ summary: 'Semantic + text search across knowledge items' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'baseId', required: false, type: String })
  search(@Query('q') q: string, @Query('baseId') baseId?: string) {
    return this.knowledgeService.searchItems(q, baseId);
  }
}
