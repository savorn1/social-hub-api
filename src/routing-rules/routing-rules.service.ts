import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoutingRule } from './entities/routing-rule.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { ResourceNotFoundException } from '../common/exceptions/business.exception';

@Injectable()
export class RoutingRulesService {
  constructor(
    @InjectRepository(RoutingRule)
    private readonly repo: Repository<RoutingRule>,
  ) {}

  async findAll(): Promise<RoutingRule[]> {
    return this.repo.find({ order: { priority: 'ASC', createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<RoutingRule> {
    const rule = await this.repo.findOne({ where: { id } });
    if (!rule) throw new ResourceNotFoundException('RoutingRule');
    return rule;
  }

  async create(dto: Partial<RoutingRule>): Promise<RoutingRule> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<RoutingRule>): Promise<RoutingRule> {
    const rule = await this.findOne(id);
    Object.assign(rule, dto);
    return this.repo.save(rule);
  }

  async remove(id: string): Promise<void> {
    const rule = await this.findOne(id);
    await this.repo.remove(rule);
  }

  async evaluate(conversation: Conversation): Promise<string | null> {
    const rules = await this.repo.find({
      where: { isActive: true },
      order: { priority: 'ASC' },
    });

    for (const rule of rules) {
      const matched = rule.conditions.every((cond) => {
        const actual = this.getField(conversation, cond.field);
        if (cond.operator === 'equals') return actual === cond.value;
        if (cond.operator === 'contains')
          return actual?.toLowerCase().includes(cond.value.toLowerCase()) ?? false;
        return false;
      });

      if (matched && rule.action === 'assign_agent' && rule.assignedAgentId) {
        return rule.assignedAgentId;
      }
    }

    return null;
  }

  private getField(conv: Conversation, field: string): string | undefined {
    if (field === 'platform') return conv.platform;
    if (field === 'contactId') return conv.contactId;
    return undefined;
  }
}
