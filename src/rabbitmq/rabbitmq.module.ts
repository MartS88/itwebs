
// Nest js
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Services
import { RabbitmqService } from './rabbitmq.service';
import { RabbitmqNames } from './types';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: RabbitmqNames.NOTIFICATION_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          return {
            transport: Transport.RMQ,
            options: {
              urls: [
                configService.get<string>('NODE_ENV') === 'production'
                  ? configService.get<string>('RABBIT_URI')
                  : configService.get<string>('RABBIT_URI_DEV'),
              ],
              queue: 'notification_queue',
              queueOptions: {
                durable: true,
                arguments: {
                  'x-dead-letter-exchange': '', // default exchange
                  'x-dead-letter-routing-key': 'notification_queue_dlq',
                  'x-message-ttl': 10000,
                },
              },
            },
          };
        },
      },
      {
        name: RabbitmqNames.NOTIFICATION_SERVICE_DLQ,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('NODE_ENV') === 'production'
                ? configService.get<string>('RABBIT_URI')
                : configService.get<string>('RABBIT_URI_DEV'),
            ],
            queue: 'notification_queue_dlq',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
      {
        name: RabbitmqNames.BILLING_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          return {
            transport: Transport.RMQ,
            options: {
              urls: [
                configService.get<string>('NODE_ENV') === 'production'
                  ? configService.get<string>('RABBIT_URI')
                  : configService.get<string>('RABBIT_URI_DEV'),
              ],
              queue: 'billing_queue',
              queueOptions: {
                durable: true,
                arguments: {
                  'x-dead-letter-exchange': '', // default exchange
                  'x-dead-letter-routing-key': 'billing_queue_dlq',
                  'x-message-ttl': 10000,
                },
              },
            },
          };
        },
      },
    ]),
  ],
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
