/**
 * Notification Toast Component
 * Custom toast component for the notification system
 */

import { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

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

interface NotificationToastProps {
  notification: NotificationData;
  onClose: () => void;
}

const toastVariants = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info,
    iconColor: 'text-blue-500',
  },
};

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const variant = toastVariants[notification.type];
  const Icon = variant.icon;

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Handle close with animation
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  return (
    <div
      className={cn(
        'relative max-w-sm w-full bg-white border rounded-lg shadow-lg p-4 transition-all duration-200 transform',
        variant.container,
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        isExiting && '-translate-x-full opacity-0'
      )}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start space-x-3">
        {/* Icon */}
        <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', variant.iconColor)} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium mb-1">{notification.title}</h4>
          <p className="text-sm opacity-90">{notification.message}</p>

          {/* Action button */}
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-2 text-xs font-medium underline hover:no-underline transition-all"
            >
              {notification.action.label}
            </button>
          )}

          {/* Timestamp */}
          <div className="mt-2 text-xs opacity-70">
            {notification.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Progress bar for timed notifications */}
      {!notification.persistent && notification.duration && notification.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-current opacity-50 animate-pulse"
            style={{
              width: '100%',
              transition: `width ${notification.duration}ms linear`,
              animationDuration: `${notification.duration}ms`,
            }}
          />
        </div>
      )}
    </div>
  );
}