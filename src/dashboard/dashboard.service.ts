import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Message } from '../conversations/entities/message.entity';
import { User } from '../users/entities/user.entity';
import { ConversationStatus } from '../common/enums/status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationsRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async getStats() {
    const [
      totalConversations,
      openConversations,
      resolvedConversations,
      totalMessages,
      totalAgents,
    ] = await Promise.all([
      this.conversationsRepo.count(),
      this.conversationsRepo.count({ where: { status: ConversationStatus.OPEN } }),
      this.conversationsRepo.count({ where: { status: ConversationStatus.RESOLVED } }),
      this.messagesRepo.count(),
      this.usersRepo.count(),
    ]);

    const csatAvg = await this.conversationsRepo
      .createQueryBuilder('c')
      .select('AVG(c.csatScore)', 'avg')
      .where('c.csatScore IS NOT NULL')
      .getRawOne<{ avg: string }>();

    return {
      totalConversations,
      openConversations,
      resolvedConversations,
      totalMessages,
      totalAgents,
      csatAverage: csatAvg?.avg ? Math.round(parseFloat(csatAvg.avg) * 10) / 10 : null,
    };
  }

  async getConversationsByPlatform() {
    return this.conversationsRepo
      .createQueryBuilder('c')
      .select('c.platform', 'platform')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.platform')
      .getRawMany();
  }

  async getRecentActivity(limit = 10) {
    return this.conversationsRepo.find({
      order: { updatedAt: 'DESC' },
      take: limit,
      relations: ['assignedAgent'],
    });
  }

  async getDailyStats(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.conversationsRepo
      .createQueryBuilder('c')
      .select("DATE_TRUNC('day', c.createdAt)", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('c.createdAt >= :since', { since })
      .groupBy("DATE_TRUNC('day', c.createdAt)")
      .orderBy("DATE_TRUNC('day', c.createdAt)", 'ASC')
      .getRawMany<{ day: string; count: string }>();

    // Fill in missing days with 0
    const map = new Map(rows.map((r) => [r.day.slice(0, 10), +r.count]));
    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: map.get(key) ?? 0 });
    }
    return result;
  }

  async getAgentStats() {
    const rows = await this.conversationsRepo
      .createQueryBuilder('c')
      .leftJoin('c.assignedAgent', 'agent')
      .select('agent.id', 'agentId')
      .addSelect("CONCAT(agent.firstName, ' ', agent.lastName)", 'agentName')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        `SUM(CASE WHEN c.status = 'resolved' THEN 1 ELSE 0 END)`,
        'resolved',
      )
      .addSelect('AVG(c.csatScore)', 'avgCsat')
      .where('agent.id IS NOT NULL')
      .groupBy('agent.id')
      .addGroupBy('agent.firstName')
      .addGroupBy('agent.lastName')
      .orderBy('total', 'DESC')
      .getRawMany<{
        agentId: string;
        agentName: string;
        total: string;
        resolved: string;
        avgCsat: string;
      }>();

    return rows.map((r) => ({
      agentId: r.agentId,
      agentName: r.agentName,
      total: +r.total,
      resolved: +r.resolved,
      avgCsat: r.avgCsat ? Math.round(parseFloat(r.avgCsat) * 10) / 10 : null,
    }));
  }
}
