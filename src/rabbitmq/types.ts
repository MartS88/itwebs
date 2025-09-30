export enum RabbitmqNames {
  NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE',
  BILLING_SERVICE = 'BILLING_SERVICE',
  NOTIFICATION_SERVICE_DLQ = 'NOTIFICATION_SERVICE_DLQ',
  BILLING_SERVICE_DLQ = 'BILLING_SERVICE_DLQ',
}

export interface SendPasswordCodePayload {
  email: string;
  code: string;
  username: string;
}

export interface SendWelcomeMessage {
  email: string;
  username: string;
}
