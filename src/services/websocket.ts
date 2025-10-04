/**
 * WebSocket Service
 * Handles real-time connections for live updates and notifications
 */

import { NotificationData } from '../contexts/NotificationContext';

export interface WebSocketMessage {
  type: 'generation_update' | 'deployment_update' | 'notification' | 'ping' | 'pong';
  data: any;
  timestamp: string;
  userId?: string;
}

export interface GenerationUpdate {
  generationId: string;
  status: 'initializing' | 'blueprint' | 'generating' | 'reviewing' | 'completed' | 'failed' | 'cancelled';
  progress: {
    stage: string;
    percentage: number;
    message: string;
  };
  files?: Array<{
    name: string;
    path: string;
    content?: string;
  }>;
  error?: string;
}

export interface DeploymentUpdate {
  deploymentId: string;
  appId: string;
  status: 'preparing' | 'building' | 'deploying' | 'completed' | 'failed';
  progress: {
    stage: string;
    percentage: number;
    message: string;
  };
  url?: string;
  error?: string;
}

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: Event) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private pingInterval: NodeJS.Timeout | null = null;
  private isManualClose = false;

  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private disconnectionHandlers: Set<ConnectionHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();

  constructor(private url: string, private userId?: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection
        if (this.ws) {
          this.disconnect();
        }

        // Build WebSocket URL with user ID if available
        const wsUrl = this.userId ? `${this.url}?userId=${this.userId}` : this.url;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.startPing();
          this.connectionHandlers.forEach(handler => handler());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.stopPing();
          this.disconnectionHandlers.forEach(handler => handler());

          // Attempt to reconnect unless manually closed
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.errorHandlers.forEach(handler => handler(error));
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isManualClose = true;
    this.stopPing();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: Omit<WebSocketMessage, 'timestamp'>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: new Date().toISOString(),
      };
      this.ws.send(JSON.stringify(fullMessage));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  // Message handling
  private handleMessage(message: WebSocketMessage): void {
    // Handle special message types
    switch (message.type) {
      case 'ping':
        this.send({ type: 'pong', data: null });
        break;
      case 'pong':
        // Ping response received
        break;
      default:
        // Forward to registered handlers
        this.messageHandlers.forEach(handler => handler(message));
    }
  }

  // Connection management
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isManualClose) {
        this.connect().catch(error => {
          console.error('Reconnect failed:', error);
        });
      }
    }, delay);
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping', data: null });
    }, 30000); // Ping every 30 seconds
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Event listeners
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onConnect(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectionHandlers.add(handler);
    return () => this.disconnectionHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  // Connection status
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'closed';
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService(
  process.env.NODE_ENV === 'development' 
    ? 'ws://localhost:8080/ws' 
    : 'wss://api.stich.live/ws'
);

// Utility functions for common operations
export const subscribeToGenerationUpdates = (
  generationId: string,
  onUpdate: (update: GenerationUpdate) => void
): (() => void) => {
  return webSocketService.onMessage((message) => {
    if (message.type === 'generation_update' && message.data.generationId === generationId) {
      onUpdate(message.data);
    }
  });
};

export const subscribeToDeploymentUpdates = (
  deploymentId: string,
  onUpdate: (update: DeploymentUpdate) => void
): (() => void) => {
  return webSocketService.onMessage((message) => {
    if (message.type === 'deployment_update' && message.data.deploymentId === deploymentId) {
      onUpdate(message.data);
    }
  });
};

export const subscribeToNotifications = (
  onNotification: (notification: NotificationData) => void
): (() => void) => {
  return webSocketService.onMessage((message) => {
    if (message.type === 'notification') {
      onNotification(message.data);
    }
  });
};