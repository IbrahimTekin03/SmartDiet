import { DynamicModule, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({})
export class RedisModule {
  static register(options?: { isGlobal?: boolean }): DynamicModule {
    const isGlobal = options?.isGlobal || false;
    
    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'REDIS_ENABLED',
          useFactory: (configService: ConfigService) => {
            return configService.get('REDIS_ENABLED', 'false') === 'true';
          },
          inject: [ConfigService],
        },
        RedisService,
      ],
      exports: [RedisService, 'REDIS_ENABLED'],
      global: isGlobal,
    };
  }
} 