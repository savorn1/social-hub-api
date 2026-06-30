import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import integrationsConfig from './config/integrations.config';

import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ConversationsModule } from './conversations/conversations.module';
import { InboxModule } from './inbox/inbox.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { AiModule } from './ai/ai.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { PromptsModule } from './prompts/prompts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { QueueModule } from './queue/queue.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { BusinessHoursModule } from './business-hours/business-hours.module';
import { RoutingRulesModule } from './routing-rules/routing-rules.module';
import { FacebookModule } from './integrations/facebook/facebook.module';
import { TelegramModule } from './integrations/telegram/telegram.module';
import { WhatsAppModule } from './integrations/whatsapp/whatsapp.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
} from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        redisConfig,
        integrationsConfig,
      ],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    RedisModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    ConversationsModule,
    InboxModule,
    ChatbotModule,
    AiModule,
    KnowledgeModule,
    PromptsModule,
    NotificationsModule,
    QueueModule,
    DashboardModule,
    HealthModule,
    BusinessHoursModule,
    RoutingRulesModule,
    FacebookModule,
    TelegramModule,
    WhatsAppModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
