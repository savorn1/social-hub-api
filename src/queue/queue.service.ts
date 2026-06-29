import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUE_NAMES } from '../common/constants';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.MESSAGE)
    private readonly messageQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION)
    private readonly notificationQueue: Queue,
  ) {}

  async addMessageJob(platform: string, payload: unknown) {
    return this.messageQueue.add('send', { platform, payload });
  }

  async addWebhookJob(platform: string, data: unknown) {
    return this.messageQueue.add('webhook', { platform, data });
  }

  async addNotificationJob(userId: string, title: string, body?: string) {
    return this.notificationQueue.add('send', { userId, title, body });
  }
}
