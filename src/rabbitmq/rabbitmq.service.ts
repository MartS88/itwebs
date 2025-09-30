
// Nest js
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

// Types
import { RabbitmqNames } from './types';

@Injectable()
export class RabbitmqService {
  constructor(
    @Inject(RabbitmqNames.NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy,
    @Inject(RabbitmqNames.BILLING_SERVICE)
    private readonly billingClient: ClientProxy,
  ) {}

  getClientByName(name: RabbitmqNames): ClientProxy {
    switch (name) {
      case RabbitmqNames.NOTIFICATION_SERVICE:
        return this.notificationClient;
      case RabbitmqNames.BILLING_SERVICE:
        return this.billingClient;

      default:
        throw new Error(`Unknown RabbitMQ client: ${name}`);
    }
  }

  async emit(name: RabbitmqNames, pattern: string, data: any) {
    const client = this.getClientByName(name);
    return client.emit(pattern, data);
  }

  async send(name: RabbitmqNames, pattern: string, data: any) {
    const client = this.getClientByName(name);
    return client.send(pattern, data);
  }
}
