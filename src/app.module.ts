// Other packages

// Nest js
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// Modules
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { FilesModule } from './files/files.module';
import { RedisCacheModule } from './redis-cache/redis-cache.module';

// Winston
import { WinstonModule } from 'nest-winston';

// Config
import { createWinstonConfig } from './common/config/winston.config';
import { RedisConfig } from './common/config/redis.config';
import { SequelizeConfig } from './common/config/sequelize.config';

// Env
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
      isGlobal: true,
      expandVariables: true,
    }),
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createWinstonConfig,
    }), // Winston logs
    SequelizeModule.forRootAsync(SequelizeConfig), // Sequelize ORM
    CacheModule.registerAsync(RedisConfig), // Redis DB

    UsersModule,
    AuthModule,
    RabbitmqModule,
    FilesModule,
    RedisCacheModule,
  ],
  providers: [Logger],
  controllers: [],
})
export class AppModule {}
