/**
 * Firebase Messaging Service
 * Handles push notifications and Firebase Cloud Messaging
 */

// TODO: Uncomment when Firebase is properly configured
// import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
// import { app } from '../lib/firebase';

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class FirebaseMessagingService {
  private messaging: any = null;
  private token: string | null = null;
  private isSupported = false;

  constructor() {
    this.checkSupport();
  }

  private checkSupport(): void {
    this.isSupported = 
      'serviceWorker' in navigator && 
      'PushManager' in window && 
      'Notification' in window;
  }

  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // TODO: Uncomment when Firebase is configured
      // this.messaging = getMessaging(app);
      
      // Register service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
      }

      return true;
    } catch (error) {
      console.error('Error initializing Firebase messaging:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.messaging || this.token) {
      return this.token;
    }

    try {
      // TODO: Uncomment when Firebase is configured
      // const token = await getToken(this.messaging, {
      //   vapidKey: process.env.VITE_FIREBASE_VAPID_KEY
      // });
      
      // this.token = token;
      // console.log('FCM Token:', token);
      // return token;

      // Placeholder for now
      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async subscribeToTopic(topic: string): Promise<boolean> {
    const token = await this.getToken();
    if (!token) {
      return false;
    }

    try {
      // Send token to server to subscribe to topic
      const response = await fetch('/api/messaging/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          topic,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }

  async unsubscribeFromTopic(topic: string): Promise<boolean> {
    const token = await this.getToken();
    if (!token) {
      return false;
    }

    try {
      // Send token to server to unsubscribe from topic
      const response = await fetch('/api/messaging/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          topic,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return false;
    }
  }

  onMessage(callback: (payload: any) => void): (() => void) | null {
    if (!this.messaging) {
      return null;
    }

    try {
      // TODO: Uncomment when Firebase is configured
      // const unsubscribe = onMessage(this.messaging, callback);
      // return unsubscribe;

      // Placeholder for now
      return () => {};
    } catch (error) {
      console.error('Error setting up message listener:', error);
      return null;
    }
  }

  // Show local notification (for development/testing)
  async showLocalNotification(data: PushNotificationData): Promise<boolean> {
    if (!this.isSupported || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: data.badge,
        data: data.data,
        tag: 'stich-notification',
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return true;
    } catch (error) {
      console.error('Error showing local notification:', error);
      return false;
    }
  }

  get permissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  get isNotificationSupported(): boolean {
    return this.isSupported;
  }
}

// Export singleton instance
export const firebaseMessagingService = new FirebaseMessagingService();

// Utility functions
export const requestNotificationPermission = async (): Promise<boolean> => {
  return await firebaseMessagingService.requestPermission();
};

export const initializeMessaging = async (): Promise<boolean> => {
  return await firebaseMessagingService.initialize();
};

export const subscribeToUserNotifications = async (userId: string): Promise<boolean> => {
  return await firebaseMessagingService.subscribeToTopic(`user_${userId}`);
};

export const subscribeToGenerationNotifications = async (generationId: string): Promise<boolean> => {
  return await firebaseMessagingService.subscribeToTopic(`generation_${generationId}`);
};

export const subscribeToDeploymentNotifications = async (deploymentId: string): Promise<boolean> => {
  return await firebaseMessagingService.subscribeToTopic(`deployment_${deploymentId}`);
};