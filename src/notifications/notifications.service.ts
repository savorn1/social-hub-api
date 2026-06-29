import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationStatus } from '../common/enums/status.enum';
import { getPaginationParams, paginate } from '../common/utils/pagination.util';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string,
    data?: Record<string, unknown>,
  ): Promise<Notification> {
    return this.notificationsRepo.save(
      this.notificationsRepo.create({ userId, type, title, body, data }),
    );
  }

  async findForUser(userId: string, page = 1, limit = 20) {
    const { skip, take } = getPaginationParams(page, limit);
    const [data, total] = await this.notificationsRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return paginate(data, total, page, limit);
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notificationsRepo.update(
      { id, userId },
      { status: NotificationStatus.READ },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepo.update(
      { userId },
      { status: NotificationStatus.READ },
    );
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationsRepo.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });
  }
}
