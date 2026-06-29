import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
import * as mammoth from 'mammoth';
import { KnowledgeBase } from './entities/knowledge-base.entity';
import { KnowledgeItem } from './entities/knowledge-item.entity';
import {
  CreateKnowledgeBaseDto,
  CreateKnowledgeItemDto,
} from './dto/create-knowledge-base.dto';
import { ResourceNotFoundException } from '../common/exceptions/business.exception';
import { AiService } from '../ai/ai.service';

const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 100;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + CHUNK_SIZE).trim());
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks.filter((c) => c.length > 40);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    @InjectRepository(KnowledgeBase)
    private readonly kbRepo: Repository<KnowledgeBase>,
    @InjectRepository(KnowledgeItem)
    private readonly itemRepo: Repository<KnowledgeItem>,
    @Inject(forwardRef(() => AiService))
    private readonly aiService: AiService,
  ) {}

  async createBase(dto: CreateKnowledgeBaseDto): Promise<KnowledgeBase> {
    return this.kbRepo.save(this.kbRepo.create(dto));
  }

  async findAllBases(): Promise<KnowledgeBase[]> {
    return this.kbRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOneBase(id: string): Promise<KnowledgeBase> {
    const kb = await this.kbRepo.findOne({ where: { id }, relations: ['items'] });
    if (!kb) throw new ResourceNotFoundException('KnowledgeBase');
    return kb;
  }

  async addItem(knowledgeBaseId: string, dto: CreateKnowledgeItemDto): Promise<KnowledgeItem> {
    const kb = await this.kbRepo.findOne({ where: { id: knowledgeBaseId } });
    if (!kb) throw new ResourceNotFoundException('KnowledgeBase');
    const embedding = await this.aiService.generateEmbedding(
      `${dto.question} ${dto.answer}`,
    );
    return this.itemRepo.save(
      this.itemRepo.create({ ...dto, knowledgeBaseId, embedding: embedding.length ? embedding : undefined }),
    );
  }

  async updateItem(id: string, dto: Partial<CreateKnowledgeItemDto>): Promise<KnowledgeItem> {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new ResourceNotFoundException('KnowledgeItem');
    Object.assign(item, dto);
    if (dto.question || dto.answer) {
      const embedding = await this.aiService.generateEmbedding(
        `${item.question} ${item.answer}`,
      );
      if (embedding.length) item.embedding = embedding;
    }
    return this.itemRepo.save(item);
  }

  async uploadDocument(
    knowledgeBaseId: string,
    file: Express.Multer.File,
  ): Promise<{ inserted: number }> {
    const kb = await this.kbRepo.findOne({ where: { id: knowledgeBaseId } });
    if (!kb) throw new ResourceNotFoundException('KnowledgeBase');

    const sourceType = this.detectType(file.mimetype, file.originalname);
    const rawText = await this.extractText(file.buffer, sourceType);
    const chunks = chunkText(rawText);

    let inserted = 0;
    for (const chunk of chunks) {
      const preview = chunk.slice(0, 120).replace(/\s+/g, ' ');
      const embedding = await this.aiService.generateEmbedding(chunk);
      await this.itemRepo.save(
        this.itemRepo.create({
          knowledgeBaseId,
          question: preview,
          answer: chunk,
          source: file.originalname,
          sourceType,
          embedding: embedding.length ? embedding : undefined,
        }),
      );
      inserted++;
    }
    this.logger.log(`Inserted ${inserted} chunks from ${file.originalname}`);
    return { inserted };
  }

  async searchItems(query: string, knowledgeBaseId?: string): Promise<KnowledgeItem[]> {
    const queryEmbedding = await this.aiService.generateEmbedding(query);

    if (queryEmbedding.length) {
      // semantic search — load items and rank by cosine similarity
      const qb = this.itemRepo
        .createQueryBuilder('item')
        .where('item.isActive = true')
        .andWhere('item.embedding IS NOT NULL');
      if (knowledgeBaseId)
        qb.andWhere('item.knowledgeBaseId = :knowledgeBaseId', { knowledgeBaseId });
      const items = await qb.getMany();

      return items
        .map((item) => ({ item, score: cosineSimilarity(queryEmbedding, item.embedding ?? []) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .filter((r) => r.score > 0.25)
        .map((r) => r.item);
    }

    // fallback — text search
    const qb = this.itemRepo
      .createQueryBuilder('item')
      .where('item.isActive = true')
      .andWhere('(LOWER(item.question) LIKE :q OR LOWER(item.answer) LIKE :q)', {
        q: `%${query.toLowerCase()}%`,
      });
    if (knowledgeBaseId)
      qb.andWhere('item.knowledgeBaseId = :knowledgeBaseId', { knowledgeBaseId });
    return qb.limit(10).getMany();
  }

  async removeItem(id: string): Promise<void> {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new ResourceNotFoundException('KnowledgeItem');
    await this.itemRepo.remove(item);
  }

  private detectType(mimetype: string, filename: string): string {
    if (mimetype === 'application/pdf' || filename.endsWith('.pdf')) return 'pdf';
    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filename.endsWith('.docx')
    )
      return 'docx';
    return 'txt';
  }

  private async extractText(buffer: Buffer, type: string): Promise<string> {
    if (type === 'pdf') {
      const result = await pdfParse(buffer);
      return result.text;
    }
    if (type === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    return buffer.toString('utf-8');
  }
}
