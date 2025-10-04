/**
 * Real-time Updates Hook
 * Custom hook for managing real-time connections and live updates
 */

import { useEffect, useCallback, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  webSocketService, 
  WebSocketMessage, 
  GenerationUpdate, 
  DeploymentUpdate,
  subscribeToGenerationUpdates,
  subscribeToDeploymentUpdates,
  subscribeToNotifications
} from '../services/websocket';

export interface UseRealtimeOptions {
  autoConnect?: boolean;
  userId?: string;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { autoConnect = true, userId } = options;
  const { addNotification } = useNotifications();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'open' | 'closing' | 'closed'>('closed');
  const [error, setError] = useState<string | null>(null);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    try {
      setError(null);
      setConnectionState('connecting');
      
      // Update userId if provided
      if (userId) {
        (webSocketService as any).userId = userId;
      }
      
      await webSocketService.connect();
      setIsConnected(true);
      setConnectionState('open');
      
      addNotification({
        type: 'success',
        title: 'Connected',
        message: 'Real-time updates are now active',
        duration: 3000,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
      setConnectionState('closed');
      
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: 'Unable to connect to real-time updates',
        persistent: true,
      });
    }
  }, [userId, addNotification]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setIsConnected(false);
    setConnectionState('closed');
  }, []);

  // Send message
  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    webSocketService.send(message);
  }, []);

  // Setup connection handlers
  useEffect(() => {
    const unsubscribeConnect = webSocketService.onConnect(() => {
      setIsConnected(true);
      setConnectionState(webSocketService.connectionState);
    });

    const unsubscribeDisconnect = webSocketService.onDisconnect(() => {
      setIsConnected(false);
      setConnectionState(webSocketService.connectionState);
    });

    const unsubscribeError = webSocketService.onError((_error) => {
      setError('Connection error occurred');
      addNotification({
        type: 'warning',
        title: 'Connection Issue',
        message: 'Real-time connection interrupted',
        duration: 5000,
      });
    });

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeError();
    };
  }, [addNotification]);

  // Setup notification handler
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notification) => {
      addNotification(notification);
    });

    return unsubscribe;
  }, [addNotification]);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && userId && !isConnected) {
      connect();
    }

    return () => {
      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, userId, isConnected, connect, disconnect]);

  return {
    isConnected,
    connectionState,
    error,
    connect,
    disconnect,
    sendMessage,
  };
}

// Hook for generation updates
export function useGenerationUpdates(generationId: string | null) {
  const [generation, setGeneration] = useState<GenerationUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!generationId) {
      setGeneration(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeToGenerationUpdates(generationId, (update) => {
      setGeneration(update);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [generationId]);

  return {
    generation,
    isLoading,
    isCompleted: generation?.status === 'completed',
    isFailed: generation?.status === 'failed',
    isCancelled: generation?.status === 'cancelled',
    progress: generation?.progress,
  };
}

// Hook for deployment updates
export function useDeploymentUpdates(deploymentId: string | null) {
  const [deployment, setDeployment] = useState<DeploymentUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!deploymentId) {
      setDeployment(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeToDeploymentUpdates(deploymentId, (update) => {
      setDeployment(update);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [deploymentId]);

  return {
    deployment,
    isLoading,
    isCompleted: deployment?.status === 'completed',
    isFailed: deployment?.status === 'failed',
    progress: deployment?.progress,
    url: deployment?.url,
  };
}

// Hook for connection status
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(webSocketService.isConnected);
  const [connectionState, setConnectionState] = useState(webSocketService.connectionState);

  useEffect(() => {
    const updateStatus = () => {
      setIsConnected(webSocketService.isConnected);
      setConnectionState(webSocketService.connectionState);
    };

    const unsubscribeConnect = webSocketService.onConnect(updateStatus);
    const unsubscribeDisconnect = webSocketService.onDisconnect(updateStatus);

    // Check initial status
    updateStatus();

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
    };
  }, []);

  return {
    isConnected,
    connectionState,
  };
}