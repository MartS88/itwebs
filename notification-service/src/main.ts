
// Nest js
import { NestFactory } from '@nestjs/core';

// Modules
import { AppModule } from './app.module';

// Services
import { ConfigService } from '@nestjs/config';

// Microservice
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

/**
 * Initializes and starts the application.
 */
async function bootstrap() {

	const appContext = await NestFactory.createApplicationContext(AppModule);
	const configService = appContext.get(ConfigService);
	const RABBIT_URI = configService.get<string>('RABBIT_URI') || '';
	const RABBIT_URI_DEV = configService.get<string>('RABBIT_URI_DEV') || '';
	const NODE_ENV = configService.get<string>('NODE_ENV') || 'development';

	const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
		transport: Transport.RMQ,
		options: {
			urls: [NODE_ENV === 'production' ? RABBIT_URI : RABBIT_URI_DEV],
			queue: 'notification_queue',
			queueOptions: {
				durable: true,
				arguments: {
					'x-dead-letter-exchange': '',
					'x-dead-letter-routing-key': 'notification_queue_dlq',
					'x-message-ttl': 10000,
				}
			}
		}
	});

	console.log(
		`Microservice connected to RabbitMQ queue "notification_queue" in ${NODE_ENV} regime at ${new Date()}`
	);

	await app.listen();
}

bootstrap();
