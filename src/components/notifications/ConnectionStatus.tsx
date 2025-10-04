/**
 * Connection Status Indicator
 * Shows real-time connection status to users
 */

import React from 'react';
import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useConnectionStatus } from '../../hooks/useRealtime';

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
  variant?: 'minimal' | 'detailed';
}

export function ConnectionStatus({ 
  className, 
  showText = false, 
  variant = 'minimal' 
}: ConnectionStatusProps) {
  const { isConnected, connectionState } = useConnectionStatus();

  const getStatusInfo = () => {
    switch (connectionState) {
      case 'connecting':
        return {
          icon: Loader2,
          text: 'Connecting...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        };
      case 'open':
        return {
          icon: Wifi,
          text: 'Connected',
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'closing':
        return {
          icon: AlertCircle,
          text: 'Disconnecting...',
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
        };
      case 'closed':
      default:
        return {
          icon: WifiOff,
          text: 'Disconnected',
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center space-x-1', className)}>
        <Icon 
          className={cn(
            'w-4 h-4',
            statusInfo.color,
            connectionState === 'connecting' && 'animate-spin'
          )} 
        />
        {showText && (
          <span className={cn('text-sm font-medium', statusInfo.color)}>
            {statusInfo.text}
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'flex items-center space-x-2 px-3 py-2 rounded-lg border',
        statusInfo.bgColor,
        statusInfo.borderColor,
        className
      )}
    >
      <Icon 
        className={cn(
          'w-4 h-4',
          statusInfo.color,
          connectionState === 'connecting' && 'animate-spin'
        )} 
      />
      <div className="flex flex-col">
        <span className={cn('text-sm font-medium', statusInfo.color)}>
          {statusInfo.text}
        </span>
        {variant === 'detailed' && (
          <span className="text-xs text-gray-500">
            Real-time updates {isConnected ? 'active' : 'inactive'}
          </span>
        )}
      </div>
    </div>
  );
}

// Connection status badge for navigation/header
export function ConnectionBadge({ className }: { className?: string }) {
  const { isConnected } = useConnectionStatus();

  return (
    <div 
      className={cn(
        'w-3 h-3 rounded-full border-2 border-white',
        isConnected ? 'bg-green-500' : 'bg-red-500',
        className
      )}
      title={isConnected ? 'Connected to real-time updates' : 'Disconnected from real-time updates'}
    />
  );
}

// Detailed connection panel
export function ConnectionPanel({ className }: { className?: string }) {
  const { isConnected, connectionState } = useConnectionStatus();

  return (
    <div className={cn('p-4 bg-white rounded-lg border', className)}>
      <h3 className="text-lg font-semibold mb-3">Connection Status</h3>
      
      <div className="space-y-3">
        <ConnectionStatus variant="detailed" showText />
        
        <div className="text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Real-time Updates:</span>
            <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
              {isConnected ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Connection State:</span>
            <span className="capitalize">{connectionState}</span>
          </div>
        </div>

        {!isConnected && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Real-time updates are currently unavailable. You may need to refresh the page to restore connection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}