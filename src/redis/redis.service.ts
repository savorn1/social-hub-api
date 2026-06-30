import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30; // 30 days in seconds
const PERMISSIONS_TTL = 60 * 60 * 24 * 30;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.config.get<string>('redis.host'),
      port: this.config.get<number>('redis.port'),
      password: this.config.get<string>('redis.password') || undefined,
      retryStrategy: (times) => Math.min(times * 500, 10_000),
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err: Error) =>
      this.logger.error(`Redis error: ${err.message}`),
    );
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async setRefreshToken(userId: string, token: string): Promise<void> {
    await this.client.set(
      `refresh_token:${userId}`,
      token,
      'EX',
      REFRESH_TOKEN_TTL,
    );
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    return this.client.get(`refresh_token:${userId}`);
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    await this.client.del(`refresh_token:${userId}`);
  }

  async setPermissions(userId: string, permissions: string[]): Promise<void> {
    await this.client.set(
      `permissions:${userId}`,
      JSON.stringify(permissions),
      'EX',
      PERMISSIONS_TTL,
    );
  }

  async getPermissions(userId: string): Promise<string[] | null> {
    const data = await this.client.get(`permissions:${userId}`);
    return data ? (JSON.parse(data) as string[]) : null;
  }

  async deletePermissions(userId: string): Promise<void> {
    await this.client.del(`permissions:${userId}`);
  }
}
