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
import { PromptsService } from './prompts.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
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
  findAll() {
    return this.promptsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a prompt' })
  findOne(@Param('id') id: string) {
    return this.promptsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a prompt' })
  update(@Param('id') id: string, @Body() dto: Partial<CreatePromptDto>) {
    return this.promptsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a prompt' })
  remove(@Param('id') id: string) {
    return this.promptsService.remove(id);
  }
}
