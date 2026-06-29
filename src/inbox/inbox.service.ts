import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inbox } from './entities/inbox.entity';
import { Platform } from '../common/enums/platform.enum';
import { CreateInboxDto } from './dto/create-inbox.dto';
import { ResourceNotFoundException } from '../common/exceptions/business.exception';

@Injectable()
export class InboxService {
  constructor(
    @InjectRepository(Inbox)
    private readonly inboxRepo: Repository<Inbox>,
  ) {}

  async create(dto: CreateInboxDto): Promise<Inbox> {
    return this.inboxRepo.save(this.inboxRepo.create(dto));
  }

  async findAll(platform?: Platform): Promise<Inbox[]> {
    return this.inboxRepo.find({
      where: platform ? { platform } : {},
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Inbox> {
    const inbox = await this.inboxRepo.findOne({ where: { id } });
    if (!inbox) throw new ResourceNotFoundException('Inbox');
    return inbox;
  }

  async update(id: string, dto: Partial<CreateInboxDto>): Promise<Inbox> {
    const inbox = await this.findOne(id);
    Object.assign(inbox, dto);
    return this.inboxRepo.save(inbox);
  }

  async remove(id: string): Promise<void> {
    const inbox = await this.findOne(id);
    await this.inboxRepo.remove(inbox);
  }
}
