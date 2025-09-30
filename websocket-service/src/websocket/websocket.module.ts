// Nest js
import { Module } from '@nestjs/common';

// Gateway
import { WebsocketGateway } from './websocket.gateway';

// Services
import { WebsocketService } from './websocket.service';

@Module({
  providers: [WebsocketGateway, WebsocketService],
  exports: [WebsocketGateway, WebsocketService],
})
export class WebsocketModule {}
