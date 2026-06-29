import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { ConversationNote } from './entities/conversation-note.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ResourceNotFoundException } from '../common/exceptions/business.exception';
import { getPaginationParams, paginate } from '../common/utils/pagination.util';
import { ConversationStatus } from '../common/enums/status.enum';
import { MessageType, Platform } from '../common/enums/platform.enum';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationsRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
    @InjectRepository(ConversationNote)
    private readonly notesRepo: Repository<ConversationNote>,
  ) {}

  async create(dto: CreateConversationDto): Promise<Conversation> {
    return this.conversationsRepo.save(this.conversationsRepo.create(dto));
  }

  async findByContact(params: {
    platform: string;
    contactId: string;
    pageId?: string;
    externalId?: string;
  }): Promise<Conversation | null> {
    return this.conversationsRepo.findOne({
      where: {
        platform: params.platform as Platform,
        contactId: params.contactId,
        ...(params.pageId ? { pageId: params.pageId } : {}),
        ...(params.externalId !== undefined
          ? { externalId: params.externalId }
          : {}),
      },
    });
  }

  async updateMetadata(
    id: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.conversationsRepo.update(id, { metadata } as Parameters<
      typeof this.conversationsRepo.update
    >[1]);
  }

  async findAll(
    page = 1,
    limit = 20,
    platform?: string,
    search?: string,
    status?: string,
    priority?: string,
    isArchived = false,
  ) {
    const { skip, take } = getPaginationParams(page, limit);
    const qb = this.conversationsRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.assignedAgent', 'agent')
      .orderBy('c.updatedAt', 'DESC')
      .skip(skip)
      .take(take);
    qb.andWhere('c.isArchived = :isArchived', { isArchived });
    if (platform) qb.andWhere('c.platform = :platform', { platform });
    if (status) qb.andWhere('c.status = :status', { status });
    if (priority) qb.andWhere('c.priority = :priority', { priority });
    if (search) {
      qb.andWhere(
        '(LOWER(c.contactName) LIKE :search OR LOWER(c.contactId) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<Conversation> {
    const conversation = await this.conversationsRepo.findOne({
      where: { id },
      relations: ['messages', 'assignedAgent'],
    });
    if (!conversation) throw new ResourceNotFoundException('Conversation');
    return conversation;
  }

  async update(id: string, dto: UpdateConversationDto): Promise<Conversation> {
    const conversation = await this.findOne(id);
    const wasResolved =
      conversation.status !== ConversationStatus.RESOLVED &&
      dto.status === ConversationStatus.RESOLVED;

    Object.assign(conversation, dto);
    const saved = await this.conversationsRepo.save(conversation);

    if (wasResolved && !saved.csatSentAt) {
      await this.messagesRepo.save(
        this.messagesRepo.create({
          conversationId: saved.id,
          type: MessageType.TEXT,
          content:
            '⭐ How satisfied are you with our support? Reply with a number 1–5 (1 = very unsatisfied, 5 = very satisfied).',
          isFromContact: false,
        }),
      );
      await this.conversationsRepo.update(id, { csatSentAt: new Date() });
    }

    return saved;
  }

  async submitCsat(
    id: string,
    score: number,
    comment?: string,
  ): Promise<Conversation> {
    const conversation = await this.findOne(id);
    conversation.csatScore = score;
    conversation.csatComment = comment;
    return this.conversationsRepo.save(conversation);
  }

  async addMessage(dto: CreateMessageDto): Promise<Message> {
    const conversation = await this.conversationsRepo.findOne({
      where: { id: dto.conversationId },
    });
    if (!conversation) throw new ResourceNotFoundException('Conversation');
    const message = this.messagesRepo.create(dto);
    const saved = await this.messagesRepo.save(message);
    await this.conversationsRepo.update(dto.conversationId, {
      updatedAt: new Date(),
    });
    return saved;
  }

  async getContacts(page = 1, limit = 20) {
    const { skip, take } = getPaginationParams(page, limit);
    const rows = await this.conversationsRepo
      .createQueryBuilder('c')
      .select('c.contactId', 'contactId')
      .addSelect('c.contactName', 'contactName')
      .addSelect('c.platform', 'platform')
      .addSelect('COUNT(*)', 'total')
      .addSelect('MAX(c.updatedAt)', 'lastActivity')
      .where('c.contactId IS NOT NULL')
      .groupBy('c.contactId')
      .addGroupBy('c.contactName')
      .addGroupBy('c.platform')
      .orderBy('MAX(c.updatedAt)', 'DESC')
      .offset(skip)
      .limit(take)
      .getRawMany<{
        contactId: string;
        contactName: string;
        platform: string;
        total: string;
        lastActivity: string;
      }>();

    const countResult = await this.conversationsRepo
      .createQueryBuilder('c')
      .select('COUNT(DISTINCT c.contactId)', 'count')
      .where('c.contactId IS NOT NULL')
      .getRawOne<{ count: string }>();

    const total = +(countResult?.count ?? 0);
    const data = rows.map((r) => ({
      contactId: r.contactId,
      contactName: r.contactName,
      platform: r.platform,
      conversationCount: +r.total,
      lastActivity: r.lastActivity,
    }));

    return paginate(data, total, page, limit);
  }

  async getMessages(conversationId: string, page = 1, limit = 50) {
    const { skip, take } = getPaginationParams(page, limit);
    const [data, total] = await this.messagesRepo.findAndCount({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return paginate(data, total, page, limit);
  }

  async getNotes(conversationId: string): Promise<ConversationNote[]> {
    return this.notesRepo.find({
      where: { conversationId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async addNote(
    conversationId: string,
    content: string,
    authorId?: string,
  ): Promise<ConversationNote> {
    await this.findOne(conversationId);
    return this.notesRepo.save(
      this.notesRepo.create({ conversationId, content, authorId }),
    );
  }

  async deleteNote(id: string): Promise<void> {
    const note = await this.notesRepo.findOne({ where: { id } });
    if (!note) throw new ResourceNotFoundException('ConversationNote');
    await this.notesRepo.remove(note);
  }
}
