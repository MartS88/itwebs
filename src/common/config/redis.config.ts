
// Nest js
import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

export const RedisConfig: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {

    const store = await redisStore({
      socket: {
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
      },
      password: configService.get<string>('REDIS_PASSWORD'),
      ttl: configService.get<number>('REDIS_TTL'),
    });
    return {
      store: () => store,
    };
  },
  inject: [ConfigService],
};
