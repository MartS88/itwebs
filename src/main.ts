// Other packages
import * as cookieParser from 'cookie-parser';

// Nest js
import {NestFactory} from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

// Module
import {AppModule} from './app.module';

// Services
import {ConfigService} from '@nestjs/config';

// Winston
import {WINSTON_MODULE_NEST_PROVIDER} from 'nest-winston';

/**
 * Initializes and starts the application.
 * Configures global middleware, Swagger, and application settings.
 */
async function bootstrap() {

  // Initialize app
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Client
  const origins = configService
      .get<string>('FRONTEND_ORIGIN')
      ?.split(',')
      .map(origin => origin.trim());

  // For nginx or another proxy
  app.set('trust proxy', true);

  // For upload limit - configure body parser limits
  app.use((req, res, next) => {
    // Set body size limits
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 5 * 1024 * 1024) {
      return res.status(413).json({ message: 'Payload too large' });
    }
    next();
  });

  // Prefix
  app.setGlobalPrefix('/api/v1');

  // Cookies and cors
  app.use(cookieParser());
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    optionsSuccessStatus: 204,
  });

  // Using Winston logger for NestJS system logs
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Using Winston logger for manual logging
  const logger = app.get(Logger);
  const PORT = configService.get<number>('PORT') || 5000;
  const NODE_ENV = configService.get<string>('NODE_ENV');

  // Validation
  app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
  );

  // App starts
  await app.listen(PORT, () => {
    logger.log(`Server started on port ${PORT} in ${NODE_ENV} regime at ${new Date()}`);
  });
}

bootstrap();

