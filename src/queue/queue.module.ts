import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from '../common/constants';
import { QueueService } from './queue.service';
import { MessageProcessor } from './processors/message.processor';
import { NotificationProcessor } from './processors/notification.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password'),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.MESSAGE },
      { name: QUEUE_NAMES.NOTIFICATION },
    ),
  ],
  providers: [QueueService, MessageProcessor, NotificationProcessor],
  exports: [QueueService],
})
export class QueueModule {}
