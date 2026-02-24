import { Inject, Injectable, OnModuleDestroy, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private redis: Redis | null = null;

  constructor(
    private readonly configService: ConfigService,
    @Inject('REDIS_ENABLED') private readonly redisEnabled: boolean,
  ) {
    if (this.redisEnabled) {
      this.initializeRedis();
    }
  }

  private initializeRedis() {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD', ''),
      db: this.configService.get('REDIS_DB', 0),
    });
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }

  private checkRedisConnection() {
    if (!this.redisEnabled) {
      console.warn('Redis is disabled. Enable it by setting REDIS_ENABLED=true in your environment variables.');
      return false;
    }
    
    if (!this.redis) {
      this.initializeRedis();
    }
    
    return true;
  }

  async get(key: string): Promise<string | null> {
    if (!this.checkRedisConnection()) return null;
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.checkRedisConnection()) return;
    
    if (ttl) {
      await this.redis.set(key, value, 'EX', ttl);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.checkRedisConnection()) return;
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.checkRedisConnection()) return false;
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    if (!this.checkRedisConnection()) return -2;
    return this.redis.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.checkRedisConnection()) return [];
    return this.redis.keys(pattern);
  }
} 