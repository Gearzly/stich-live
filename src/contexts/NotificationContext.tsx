/**
 * Notification Context
 * Manages toast notifications and real-time messaging throughout the app
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { NotificationToast } from '../components/notifications/NotificationToast';
// import { useAuth } from './AuthContext';
// import { onMessage, getMessaging } from 'firebase/messaging';
// import { app } from '../lib/firebase';

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: NotificationData[];
  addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showSuccess: (title: string, message: string, options?: Partial<NotificationData>) => string;
  showError: (title: string, message: string, options?: Partial<NotificationData>) => string;
  showWarning: (title: string, message: string, options?: Partial<NotificationData>) => string;
  showInfo: (title: string, message: string, options?: Partial<NotificationData>) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  // const { user } = useAuth();

  // Generate unique notification ID
  const generateId = useCallback(() => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add notification
  const addNotification = useCallback((notificationData: Omit<NotificationData, 'id' | 'timestamp'>) => {
    const id = generateId();
    const notification: NotificationData = {
      ...notificationData,
      id,
      timestamp: new Date(),
      duration: notificationData.duration ?? 5000, // Default 5 seconds
    };

    setNotifications(prev => [notification, ...prev]);

    // Auto-remove notification after duration (unless persistent)
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }

    return id;
  }, [generateId]);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods for different notification types
  const showSuccess = useCallback((title: string, message: string, options?: Partial<NotificationData>) => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<NotificationData>) => {
    return addNotification({
      type: 'error',
      title,
      message,
      persistent: options?.persistent ?? true, // Errors persist by default
      ...options,
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<NotificationData>) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<NotificationData>) => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  // TODO: Setup Firebase messaging for push notifications
  // useEffect(() => {
  //   if (!user) return;
  //   // Firebase messaging setup
  // }, [user, addNotification]);

  // TODO: Listen for real-time events (WebSocket-like with Firebase)
  // useEffect(() => {
  //   if (!user) return;
  //   // Real-time listeners setup
  // }, [user, addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Render toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {notifications.slice(0, 5).map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>

      {/* Show count indicator if more than 5 notifications */}
      {notifications.length > 5 && (
        <div className="fixed top-4 right-4 z-40 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
          +{notifications.length - 5} more
        </div>
      )}
    </NotificationContext.Provider>
  );
}