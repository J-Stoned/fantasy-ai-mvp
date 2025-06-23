import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useStore } from '../store';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  scheduleNotification: (notification: NotificationRequest) => Promise<string>;
  cancelNotification: (notificationId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

interface NotificationRequest {
  title: string;
  body: string;
  data?: any;
  trigger?: Notifications.NotificationTriggerInput;
  priority?: Notifications.AndroidNotificationPriority;
  sound?: boolean;
  badge?: number;
  categoryId?: string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [expoPushToken, setExpoPushToken] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  
  const { user } = useAuth();
  const { addNotification, pushEnabled } = useStore();

  useEffect(() => {
    if (pushEnabled) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          setExpoPushToken(token);
          // Send token to backend
          if (user) {
            sendPushTokenToBackend(token);
          }
        }
      });

      // Listen for incoming notifications
      notificationListener.current = Notifications.addNotificationReceivedListener(handleNotification);
      
      // Listen for notification interactions
      responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

      return () => {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      };
    }
  }, [pushEnabled, user]);

  const handleNotification = (notification: Notifications.Notification) => {
    setNotification(notification);
    
    // Add to store
    const { title, body, data } = notification.request.content;
    addNotification({
      id: notification.request.identifier,
      type: data?.type || 'general',
      title: title || 'Fantasy.AI',
      message: body || '',
      timestamp: new Date(),
      read: false,
      priority: data?.priority || 'medium',
      actionUrl: data?.url,
      data: data,
    });
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const { notification, actionIdentifier } = response;
    const { data } = notification.request.content;
    
    // Handle different action types
    switch (actionIdentifier) {
      case 'accept':
        // Handle accept action (e.g., accept trade)
        handleAcceptAction(data);
        break;
      case 'decline':
        // Handle decline action
        handleDeclineAction(data);
        break;
      case Notifications.DEFAULT_ACTION_IDENTIFIER:
        // Handle default tap action
        handleDefaultAction(data);
        break;
    }
  };

  const handleAcceptAction = async (data: any) => {
    // Implementation for accept actions
    console.log('Accept action:', data);
  };

  const handleDeclineAction = async (data: any) => {
    // Implementation for decline actions
    console.log('Decline action:', data);
  };

  const handleDefaultAction = (data: any) => {
    // Navigate based on notification type
    if (data?.url) {
      // Handle deep linking
      console.log('Navigate to:', data.url);
    }
  };

  const registerForPushNotificationsAsync = async () => {
    let token;
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  };

  const sendPushTokenToBackend = async (token: string) => {
    try {
      // Send token to your backend
      await fetch('https://api.fantasy.ai/notifications/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          token,
          platform: Platform.OS,
          deviceId: Device.deviceName,
        }),
      });
    } catch (error) {
      console.error('Failed to send push token:', error);
    }
  };

  const scheduleNotification = async (request: NotificationRequest): Promise<string> => {
    // Set notification categories for interactive notifications
    await Notifications.setNotificationCategoryAsync('trade', [
      {
        identifier: 'accept',
        buttonTitle: 'Accept',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'decline',
        buttonTitle: 'Decline',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: request.title,
        body: request.body,
        data: request.data,
        sound: request.sound !== false,
        priority: request.priority || Notifications.AndroidNotificationPriority.HIGH,
        badge: request.badge,
        categoryIdentifier: request.categoryId,
      },
      trigger: request.trigger || null,
    });

    return id;
  };

  const cancelNotification = async (notificationId: string) => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        scheduleNotification,
        cancelNotification,
        cancelAllNotifications,
        requestPermissions,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}