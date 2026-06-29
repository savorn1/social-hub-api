import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prompt } from './entities/prompt.entity';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { ResourceNotFoundException } from '../common/exceptions/business.exception';

@Injectable()
export class PromptsService {
  constructor(
    @InjectRepository(Prompt)
    private readonly promptsRepo: Repository<Prompt>,
  ) {}

  async create(dto: CreatePromptDto): Promise<Prompt> {
    return this.promptsRepo.save(this.promptsRepo.create(dto));
  }

  async findAll(): Promise<Prompt[]> {
    return this.promptsRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Prompt> {
    const prompt = await this.promptsRepo.findOne({ where: { id } });
    if (!prompt) throw new ResourceNotFoundException('Prompt');
    return prompt;
  }

  async update(id: string, dto: Partial<CreatePromptDto>): Promise<Prompt> {
    const prompt = await this.findOne(id);
    Object.assign(prompt, dto);
    return this.promptsRepo.save(prompt);
  }

  async remove(id: string): Promise<void> {
    const prompt = await this.findOne(id);
    await this.promptsRepo.remove(prompt);
  }

  render(template: string, variables: Record<string, string>): string {
    return template.replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => variables[key] ?? `{{${key}}}`,
    );
  }
}
