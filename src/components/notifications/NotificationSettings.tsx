/**
 * Notification Settings Component
 * Allows users to manage their notification preferences
 */

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Monitor, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useNotifications } from '../../contexts/NotificationContext';
import { requestNotificationPermission, firebaseMessagingService } from '../../services/messaging';

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  generationUpdates: boolean;
  deploymentUpdates: boolean;
  systemNotifications: boolean;
  marketingEmails: boolean;
  sound: boolean;
  desktop: boolean;
}

const defaultSettings: NotificationSettings = {
  pushNotifications: false,
  emailNotifications: true,
  generationUpdates: true,
  deploymentUpdates: true,
  systemNotifications: true,
  marketingEmails: false,
  sound: true,
  desktop: false,
};

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const { showSuccess, showError, showInfo } = useNotifications();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    setPermissionStatus(firebaseMessagingService.permissionStatus);
  }, []);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('notification-settings');
      if (saved) {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      setIsLoading(true);
      
      // Save to localStorage
      localStorage.setItem('notification-settings', JSON.stringify(newSettings));
      setSettings(newSettings);

      // TODO: Save to backend/user profile
      // await api.updateUserNotificationSettings(newSettings);

      showSuccess('Settings Saved', 'Your notification preferences have been updated.');
    } catch (error) {
      showError('Save Failed', 'Unable to save notification settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const handleRequestPermission = async () => {
    try {
      setIsLoading(true);
      const granted = await requestNotificationPermission();
      
      if (granted) {
        setPermissionStatus('granted');
        setSettings(prev => ({ ...prev, pushNotifications: true }));
        showSuccess('Permission Granted', 'Push notifications are now enabled.');
      } else {
        setPermissionStatus('denied');
        showError('Permission Denied', 'Push notifications could not be enabled.');
      }
    } catch (error) {
      showError('Permission Error', 'Unable to request notification permission.');
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = () => {
    showInfo('Test Notification', 'This is a test notification to show how they appear.');
  };

  const getPermissionStatusInfo = () => {
    switch (permissionStatus) {
      case 'granted':
        return {
          icon: Bell,
          text: 'Notifications enabled',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'denied':
        return {
          icon: BellOff,
          text: 'Notifications blocked',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        };
      default:
        return {
          icon: Bell,
          text: 'Notifications not configured',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const permissionInfo = getPermissionStatusInfo();
  const PermissionIcon = permissionInfo.icon;

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PermissionIcon className="w-5 h-5" />
            <span>Notification Permissions</span>
          </CardTitle>
          <CardDescription>
            Manage browser notification permissions and test notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={cn('p-3 rounded-lg flex items-center justify-between', permissionInfo.bgColor)}>
            <div className="flex items-center space-x-2">
              <PermissionIcon className={cn('w-4 h-4', permissionInfo.color)} />
              <span className={cn('text-sm font-medium', permissionInfo.color)}>
                {permissionInfo.text}
              </span>
            </div>
            
            {permissionStatus !== 'granted' && (
              <Button 
                onClick={handleRequestPermission}
                disabled={isLoading}
                size="sm"
                variant="outline"
              >
                Enable Notifications
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            <Button onClick={testNotification} variant="outline" size="sm">
              Test Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">App Generation Updates</p>
                  <p className="text-xs text-gray-500">Get notified about generation progress</p>
                </div>
              </div>
              <Switch
                checked={settings.generationUpdates}
                onCheckedChange={() => handleToggle('generationUpdates')}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Monitor className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Deployment Updates</p>
                  <p className="text-xs text-gray-500">Get notified when apps are deployed</p>
                </div>
              </div>
              <Switch
                checked={settings.deploymentUpdates}
                onCheckedChange={() => handleToggle('deploymentUpdates')}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">System Notifications</p>
                  <p className="text-xs text-gray-500">Important system updates and maintenance</p>
                </div>
              </div>
              <Switch
                checked={settings.systemNotifications}
                onCheckedChange={() => handleToggle('systemNotifications')}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Methods</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Push Notifications</p>
                  <p className="text-xs text-gray-500">Browser push notifications</p>
                </div>
              </div>
              <Switch
                checked={settings.pushNotifications && permissionStatus === 'granted'}
                onCheckedChange={() => handleToggle('pushNotifications')}
                disabled={isLoading || permissionStatus !== 'granted'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-gray-500">Important updates via email</p>
                </div>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={() => handleToggle('emailNotifications')}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Monitor className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Desktop Notifications</p>
                  <p className="text-xs text-gray-500">Show notifications on desktop</p>
                </div>
              </div>
              <Switch
                checked={settings.desktop}
                onCheckedChange={() => handleToggle('desktop')}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Marketing */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy & Marketing</CardTitle>
          <CardDescription>
            Control promotional and marketing communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium">Marketing Emails</p>
                <p className="text-xs text-gray-500">Product updates and promotional content</p>
              </div>
            </div>
            <Switch
              checked={settings.marketingEmails}
              onCheckedChange={() => handleToggle('marketingEmails')}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}