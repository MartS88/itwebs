
// Nest js
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

// Services
import { NotificationService } from './notification.service';

// Types
import { SendPasswordCodePayload } from './types';

@Controller('notification')
export class NotificationController {

	constructor(private readonly notificationService: NotificationService) {
	}

	@MessagePattern('send-welcome-message')
	async sendWelcome(@Payload() payload: SendPasswordCodePayload) {
		console.log('payload',payload)
		return await this.notificationService.sendWelcomeMessage(payload);
	}

	@MessagePattern('send-password-recovery-code')
	async sendPassword(@Payload() payload: SendPasswordCodePayload) {
		console.log('payload',payload)
		return await this.notificationService.sendPasswordRecoveryCode(payload);
	}


}
