
// Clickhouse
import { createClient } from '@clickhouse/client';
import { ConfigService } from '@nestjs/config';

export function createClickHouseClient(configService: ConfigService) {
  return createClient({
    url: configService.get<string>('CLICKHOUSE_URL'),
    username: configService.get<string>('CLICKHOUSE_USER', 'default'),
    password: configService.get<string>('CLICKHOUSE_PASSWORD', ''),
  });
}

