// Nest js
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

// Modules
import { WebsocketModule } from './websocket/websocket.module';

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
    WebsocketModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
