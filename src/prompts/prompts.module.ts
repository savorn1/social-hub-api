import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptsService } from './prompts.service';
import { PromptsController } from './prompts.controller';
import { Prompt } from './entities/prompt.entity';
import { PromptVersion } from './entities/prompt-version.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Prompt, PromptVersion])],
  controllers: [PromptsController],
  providers: [PromptsService],
  exports: [PromptsService],
})
export class PromptsModule {}
