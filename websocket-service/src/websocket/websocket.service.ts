// Nest js
import { Injectable, Logger } from '@nestjs/common';

/**
 * WebSocket service for business logic
 * Add your custom WebSocket-related logic here
 */
@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);

  /**
   * Process incoming message
   */
  processMessage(message: string): string {
    this.logger.log(`Processing message: ${message}`);
    return `Processed: ${message}`;
  }

  /**
   * Validate room access
   */
  async validateRoomAccess(userId: number, room: string): Promise<boolean> {
    // Add your room access validation logic here
    // For example, check if user has permission to join the room
    this.logger.log(`Validating access for user ${userId} to room ${room}`);
    return true;
  }

  /**
   * Get room info
   */
  async getRoomInfo(room: string): Promise<any> {
    this.logger.log(`Getting info for room: ${room}`);
    // Add your logic to fetch room information
    return {
      room: room,
      createdAt: new Date(),
    };
  }
}
