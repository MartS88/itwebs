
// Modules
import { Module } from '@nestjs/common';

// Services & controllers
import { RedisCacheService } from './redis-cache.service';
import { RedisCacheInterceptor } from './interceptor/redis-cache.interceptor';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Io Redis
import Redis from 'ioredis';

@Module({
  imports: [ConfigModule],
  providers: [
    RedisCacheService,
    RedisCacheInterceptor,
    {
      provide: 'REAL_REDIS',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [RedisCacheService, RedisCacheInterceptor],
})
export class RedisCacheModule {}

