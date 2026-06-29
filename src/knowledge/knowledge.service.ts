import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeBase } from './entities/knowledge-base.entity';
import { KnowledgeItem } from './entities/knowledge-item.entity';
import {
  CreateKnowledgeBaseDto,
  CreateKnowledgeItemDto,
} from './dto/create-knowledge-base.dto';
import { ResourceNotFoundException } from '../common/exceptions/business.exception';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(KnowledgeBase)
    private readonly kbRepo: Repository<KnowledgeBase>,
    @InjectRepository(KnowledgeItem)
    private readonly itemRepo: Repository<KnowledgeItem>,
  ) {}

  async createBase(dto: CreateKnowledgeBaseDto): Promise<KnowledgeBase> {
    return this.kbRepo.save(this.kbRepo.create(dto));
  }

  async findAllBases(): Promise<KnowledgeBase[]> {
    return this.kbRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOneBase(id: string): Promise<KnowledgeBase> {
    const kb = await this.kbRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!kb) throw new ResourceNotFoundException('KnowledgeBase');
    return kb;
  }

  async addItem(
    knowledgeBaseId: string,
    dto: CreateKnowledgeItemDto,
  ): Promise<KnowledgeItem> {
    const kb = await this.kbRepo.findOne({ where: { id: knowledgeBaseId } });
    if (!kb) throw new ResourceNotFoundException('KnowledgeBase');
    return this.itemRepo.save(
      this.itemRepo.create({ ...dto, knowledgeBaseId }),
    );
  }

  async searchItems(
    query: string,
    knowledgeBaseId?: string,
  ): Promise<KnowledgeItem[]> {
    const qb = this.itemRepo
      .createQueryBuilder('item')
      .where('item.isActive = true')
      .andWhere(
        '(LOWER(item.question) LIKE :q OR LOWER(item.answer) LIKE :q)',
        {
          q: `%${query.toLowerCase()}%`,
        },
      );
    if (knowledgeBaseId)
      qb.andWhere('item.knowledgeBaseId = :knowledgeBaseId', {
        knowledgeBaseId,
      });
    return qb.limit(10).getMany();
  }

  async removeItem(id: string): Promise<void> {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new ResourceNotFoundException('KnowledgeItem');
    await this.itemRepo.remove(item);
  }
}
