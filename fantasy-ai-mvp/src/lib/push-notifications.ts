/**
 * Push Notification System
 * Handles web push notifications for mobile and desktop
 */

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: any;
}

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;
  
  private constructor() {}
  
  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }
  
  /**
   * Initialize push notifications
   */
  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }
    
    try {
      // Register service worker if not already registered
      this.swRegistration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      this.pushSubscription = await this.swRegistration.pushManager.getSubscription();
      
      if (this.pushSubscription) {
        console.log('Already subscribed to push notifications');
        await this.sendSubscriptionToServer(this.pushSubscription);
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }
  
  /**
   * Request permission and subscribe to push notifications
   */
  async subscribe(): Promise<boolean> {
    if (!this.swRegistration) {
      await this.initialize();
    }
    
    if (!this.swRegistration) {
      throw new Error('Service worker not registered');
    }
    
    // Request notification permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }
    
    try {
      // Subscribe to push notifications
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }
      
      const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);
      
      this.pushSubscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      
      // Send subscription to server
      await this.sendSubscriptionToServer(this.pushSubscription);
      
      console.log('Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }
  
  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.pushSubscription) {
      return true;
    }
    
    try {
      await this.pushSubscription.unsubscribe();
      await this.removeSubscriptionFromServer();
      this.pushSubscription = null;
      
      console.log('Successfully unsubscribed from push notifications');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }
  
  /**
   * Check if user is subscribed to push notifications
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.swRegistration) {
      await this.initialize();
    }
    
    if (!this.swRegistration) {
      return false;
    }
    
    const subscription = await this.swRegistration.pushManager.getSubscription();
    return subscription !== null;
  }
  
  /**
   * Get notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }
  
  /**
   * Show a local notification (not push)
   */
  async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.swRegistration) {
      await this.initialize();
    }
    
    if (!this.swRegistration) {
      throw new Error('Service worker not registered');
    }
    
    if (this.getPermissionStatus() !== 'granted') {
      throw new Error('Notification permission not granted');
    }
    
    await this.swRegistration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/icons/icon-192x192.png',
      badge: options.badge || '/icons/badge-72x72.png',
      tag: options.tag,
      requireInteraction: options.requireInteraction,
      actions: options.actions,
      data: options.data,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    });
  }
  
  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }
  
  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }
  
  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
}

// Notification templates
export const NotificationTemplates = {
  injuryAlert: (playerName: string, status: string): NotificationOptions => ({
    title: '🚨 Injury Alert',
    body: `${playerName} is ${status}. Check your lineup!`,
    tag: 'injury-alert',
    requireInteraction: true,
    actions: [
      { action: 'view-lineup', title: 'View Lineup' },
      { action: 'find-replacement', title: 'Find Replacement' }
    ],
    data: { type: 'injury', playerName }
  }),
  
  lineupLock: (minutes: number): NotificationOptions => ({
    title: '⏰ Lineup Lock Warning',
    body: `Your lineup locks in ${minutes} minutes!`,
    tag: 'lineup-lock',
    requireInteraction: true,
    actions: [
      { action: 'edit-lineup', title: 'Edit Lineup' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    data: { type: 'lineup-lock', minutes }
  }),
  
  scoreUpdate: (team: string, score: number): NotificationOptions => ({
    title: '📊 Score Update',
    body: `${team} is now projected for ${score} points`,
    tag: 'score-update',
    data: { type: 'score', team, score }
  }),
  
  tradeOffer: (fromUser: string): NotificationOptions => ({
    title: '💼 New Trade Offer',
    body: `${fromUser} sent you a trade offer`,
    tag: 'trade-offer',
    requireInteraction: true,
    actions: [
      { action: 'view-trade', title: 'View Trade' },
      { action: 'dismiss', title: 'Later' }
    ],
    data: { type: 'trade', fromUser }
  }),
  
  aiRecommendation: (message: string): NotificationOptions => ({
    title: '🤖 AI Coach Recommendation',
    body: message,
    tag: 'ai-recommendation',
    actions: [
      { action: 'view-recommendation', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    data: { type: 'ai-recommendation' }
  })
};

// Export singleton instance
export const pushNotifications = PushNotificationManager.getInstance();