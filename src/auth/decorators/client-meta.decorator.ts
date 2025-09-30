
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ClientMeta {
  ipAddress: string;
  userAgent: string;
}

export const ClientMeta = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ClientMeta => {
    const request = ctx.switchToHttp().getRequest();
    const ipAddress =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.socket?.remoteAddress ||
      request.ip;
    const userAgent = request.headers['user-agent'] || 'Unknown';
    console.log('ClientMeta request.headers', request.headers);
    return { ipAddress, userAgent };
  },
);
