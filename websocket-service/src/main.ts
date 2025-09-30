// Nest js
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

// Modules
import { AppModule } from './app.module';

// Services
import { ConfigService } from '@nestjs/config';

/**
 * Initializes and starts the WebSocket server.
 * Runs on a separate port from the main API server.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('WebSocketService');

  const PORT = configService.get<number>('WEBSOCKET_PORT') || 5001;
  const NODE_ENV = configService.get<string>('NODE_ENV') || 'development';

  // CORS for WebSocket
  const origins = configService
    .get<string>('FRONTEND_ORIGIN')
    ?.split(',')
    .map(origin => origin.trim());

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  await app.listen(PORT, () => {
    logger.log(`WebSocket server started on port ${PORT} in ${NODE_ENV} regime at ${new Date()}`);
  });
}

bootstrap();
