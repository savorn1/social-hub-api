import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QUEUE_NAMES } from '../../common/constants';

@Processor(QUEUE_NAMES.MESSAGE)
export class MessageProcessor {
  private readonly logger = new Logger(MessageProcessor.name);

  @Process('send')
  async handleSend(job: Job) {
    this.logger.log(`Processing message job ${job.id}`);
    const { platform, payload } = job.data;
    this.logger.log(`Sending ${platform} message: ${JSON.stringify(payload)}`);
  }

  @Process('webhook')
  async handleWebhook(job: Job) {
    this.logger.log(
      `Processing webhook job ${job.id}: ${JSON.stringify(job.data)}`,
    );
  }
}
