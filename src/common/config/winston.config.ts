
// Winston
import {  WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

// Clickhouse
import { ClickHouseTransport } from './clickhouse/clickhouse.transport';
import { ConfigService } from '@nestjs/config';


export async function createWinstonConfig(configService: ConfigService): Promise<WinstonModuleOptions> {
  return {
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, context }) => {
            return `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
          }),
        ),
      }),
      new winston.transports.DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'info',
      }),
      // new ClickHouseTransport(configService),
    ],
  };
}
