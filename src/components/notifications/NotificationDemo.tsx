/**
 * Notification Demo Component
 * Demonstrates the notification system features
 */

import React, { useState } from 'react';
import { Bell, Wifi, Settings, Play } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useNotifications } from '../../contexts/NotificationContext';
import { useRealtime, useGenerationUpdates } from '../../hooks/useRealtime';
import { ConnectionStatus, ConnectionBadge } from './ConnectionStatus';
import { NotificationSettings } from './NotificationSettings';

export function NotificationDemo() {
  const [showSettings, setShowSettings] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  
  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo, 
    clearAllNotifications 
  } = useNotifications();
  
  const { connect, disconnect, isConnected } = useRealtime({ autoConnect: false });
  const { generation, progress } = useGenerationUpdates(generationId);

  const demoNotifications = [
    {
      type: 'success' as const,
      title: 'Success Notification',
      message: 'Your app has been generated successfully!',
    },
    {
      type: 'error' as const,
      title: 'Error Notification',
      message: 'Failed to deploy application. Please try again.',
    },
    {
      type: 'warning' as const,
      title: 'Warning Notification',
      message: 'Your storage quota is almost full.',
    },
    {
      type: 'info' as const,
      title: 'Info Notification',
      message: 'New features are now available in the dashboard.',
    },
  ];

  const showDemoNotification = (demo: typeof demoNotifications[0]) => {
    const showFn = {
      success: showSuccess,
      error: showError,
      warning: showWarning,
      info: showInfo,
    }[demo.type];

    showFn(demo.title, demo.message, {
      action: {
        label: 'View Details',
        onClick: () => console.log('Demo action clicked'),
      },
    });
  };

  const simulateGeneration = () => {
    const mockId = `gen_${Date.now()}`;
    setGenerationId(mockId);
    
    // Simulate generation progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      
      if (progress <= 100) {
        showInfo(
          'Generation Progress',
          `App generation is ${progress}% complete`,
          { duration: 2000 }
        );
      }
      
      if (progress >= 100) {
        clearInterval(interval);
        showSuccess(
          'Generation Complete',
          'Your app has been generated successfully!'
        );
        setGenerationId(null);
      }
    }, 1000);
  };

  if (showSettings) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notification Settings</CardTitle>
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
            >
              Back to Demo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <NotificationSettings />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Real-time Notifications Demo</span>
              <ConnectionBadge />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </CardTitle>
          <CardDescription>
            Test the notification system and real-time updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <ConnectionStatus variant="detailed" showText />
            <div className="space-x-2">
              {!isConnected ? (
                <Button onClick={connect} size="sm">
                  <Wifi className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              ) : (
                <Button onClick={disconnect} variant="outline" size="sm">
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Test Notifications</CardTitle>
          <CardDescription>
            Click the buttons below to test different notification types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {demoNotifications.map((demo, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => showDemoNotification(demo)}
                className="h-auto p-4 flex flex-col items-start space-y-1"
              >
                <span className="font-medium">{demo.title}</span>
                <span className="text-sm text-gray-500 text-left">
                  {demo.message}
                </span>
              </Button>
            ))}
          </div>
          
          <div className="mt-6 flex justify-between">
            <Button
              onClick={simulateGeneration}
              disabled={!!generationId}
            >
              <Play className="w-4 h-4 mr-2" />
              Simulate App Generation
            </Button>
            
            <Button
              variant="outline"
              onClick={clearAllNotifications}
            >
              Clear All Notifications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Updates */}
      {generation && (
        <Card>
          <CardHeader>
            <CardTitle>Real-time Generation Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <span className="capitalize">{generation.status}</span>
              </div>
              {progress && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Progress:</span>
                    <span>{progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{progress.message}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}