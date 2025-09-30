// Nestjs
import { ConfigService } from '@nestjs/config';

// Configs
import { createClickHouseClient } from './clickhouse.config';

// Winston
import TransportStream = require('winston-transport');

export class ClickHouseTransport extends TransportStream {
  private client;

  constructor(configService: ConfigService) {
    super();
    this.client = createClickHouseClient(configService);
  }

  log(info: any, callback: () => void) {
    const { level, message, context = 'Application' } = info;

    this.client.insert({
      table: 'logs',
      values: [
        {
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          level,
          message,
          context,
        },
      ],
      format: 'JSONEachRow',
    }).then(() => {
      callback();
    }).catch((err: any) => {
      console.error('ClickHouse log insert error:', err);
      callback();
    });
  }
}
