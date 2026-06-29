import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prompt, PromptCategory } from './entities/prompt.entity';
import { PromptVersion } from './entities/prompt-version.entity';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { ResourceNotFoundException } from '../common/exceptions/business.exception';

@Injectable()
export class PromptsService {
  constructor(
    @InjectRepository(Prompt)
    private readonly promptsRepo: Repository<Prompt>,
    @InjectRepository(PromptVersion)
    private readonly versionsRepo: Repository<PromptVersion>,
  ) {}

  async create(dto: CreatePromptDto): Promise<Prompt> {
    return this.promptsRepo.save(this.promptsRepo.create(dto));
  }

  async findAll(category?: PromptCategory): Promise<Prompt[]> {
    const where = category ? { category } : {};
    return this.promptsRepo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Prompt> {
    const prompt = await this.promptsRepo.findOne({ where: { id } });
    if (!prompt) throw new ResourceNotFoundException('Prompt');
    return prompt;
  }

  async update(id: string, dto: Partial<CreatePromptDto>): Promise<Prompt> {
    const prompt = await this.findOne(id);

    if (dto.content && dto.content !== prompt.content) {
      await this.versionsRepo.save(
        this.versionsRepo.create({
          promptId: id,
          version: prompt.currentVersion,
          content: prompt.content,
        }),
      );
      prompt.currentVersion += 1;
    }

    Object.assign(prompt, dto);
    return this.promptsRepo.save(prompt);
  }

  async remove(id: string): Promise<void> {
    const prompt = await this.findOne(id);
    await this.promptsRepo.remove(prompt);
  }

  async findVersions(id: string): Promise<PromptVersion[]> {
    await this.findOne(id); // ensure prompt exists
    return this.versionsRepo.find({
      where: { promptId: id },
      order: { version: 'DESC' },
    });
  }

  async restore(id: string, versionId: string): Promise<Prompt> {
    const version = await this.versionsRepo.findOne({
      where: { id: versionId, promptId: id },
    });
    if (!version) throw new ResourceNotFoundException('PromptVersion');
    return this.update(id, { content: version.content });
  }

  render(template: string, variables: Record<string, string>): string {
    return template.replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => variables[key] ?? `{{${key}}}`,
    );
  }
}
