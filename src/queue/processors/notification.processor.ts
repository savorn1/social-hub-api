import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QUEUE_NAMES } from '../../common/constants';

@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  @Process('send')
  async handleSend(job: Job) {
    this.logger.log(
      `Sending notification to user ${job.data.userId}: ${job.data.title}`,
    );
  }
}
