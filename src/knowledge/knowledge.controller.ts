import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import {
  CreateKnowledgeBaseDto,
  CreateKnowledgeItemDto,
} from './dto/create-knowledge-base.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

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

  @Get('search')
  @ApiOperation({ summary: 'Search knowledge items' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'baseId', required: false, type: String })
  search(@Query('q') q: string, @Query('baseId') baseId?: string) {
    return this.knowledgeService.searchItems(q, baseId);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete a knowledge item' })
  removeItem(@Param('id') id: string) {
    return this.knowledgeService.removeItem(id);
  }
}
