import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { PromptsService } from './prompts.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { PromptCategory } from './entities/prompt.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Prompts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prompts')
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a prompt template' })
  create(@Body() dto: CreatePromptDto) {
    return this.promptsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all prompts' })
  @ApiQuery({ name: 'category', required: false, enum: PromptCategory })
  findAll(@Query('category') category?: PromptCategory) {
    return this.promptsService.findAll(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a prompt' })
  findOne(@Param('id') id: string) {
    return this.promptsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a prompt (saves previous content as a version)',
  })
  update(@Param('id') id: string, @Body() dto: Partial<CreatePromptDto>) {
    return this.promptsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a prompt' })
  remove(@Param('id') id: string) {
    return this.promptsService.remove(id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List version history for a prompt' })
  findVersions(@Param('id') id: string) {
    return this.promptsService.findVersions(id);
  }

  @Post(':id/versions/:versionId/restore')
  @ApiOperation({ summary: 'Restore a previous version of a prompt' })
  restore(@Param('id') id: string, @Param('versionId') versionId: string) {
    return this.promptsService.restore(id, versionId);
  }
}
