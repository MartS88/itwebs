
// Nest js
import { ConfigModule } from '@nestjs/config';

// Modules
import { Module } from '@nestjs/common';
import { NotificationModule } from './notification/notification.module';

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
    NotificationModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {
}

