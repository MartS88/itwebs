
export interface MessagePayload {
  text: string;
  userId?: number;
  metadata?: Record<string, any>;
}

export interface BroadcastPayload {
  message: string;
  type?: string;
  metadata?: Record<string, any>;
}

export interface RoomPayload {
  room: string;
  userId?: number;
}

export interface RoomMessagePayload {
  room: string;
  text: string;
  userId?: number;
  metadata?: Record<string, any>;
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId?: number;
  metadata?: Record<string, any>;
}
