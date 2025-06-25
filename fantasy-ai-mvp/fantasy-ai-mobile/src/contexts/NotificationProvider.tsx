import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  registerForPushNotifications: () => Promise<void>;
  sendLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
  scheduleNotification: (
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: any
  ) => Promise<string | undefined>;
  cancelNotification: (notificationId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  useEffect(() => {
    registerForPushNotifications();

    // Listen for notifications when app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Listen for notification interactions
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // Handle notification tap here
      const { data } = response.notification.request.content;
      if (data?.screen) {
        // Navigate to specific screen
        console.log('Navigate to:', data.screen);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  const registerForPushNotifications = async () => {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return;
      }

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

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      setExpoPushToken(token.data);
      console.log('Expo push token:', token.data);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const sendLocalNotification = async (title: string, body: string, data?: any) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Send immediately
    });
  };

  const scheduleNotification = async (
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: any
  ) => {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger,
    });
  };

  const cancelNotification = async (notificationId: string) => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        registerForPushNotifications,
        sendLocalNotification,
        scheduleNotification,
        cancelNotification,
        cancelAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Utility functions for common notification scenarios
export const notificationUtils = {
  // Send lineup reminder notification
  sendLineupReminder: async (leagueName: string, deadline: Date) => {
    const context = useContext(NotificationContext);
    if (!context) return;

    const { scheduleNotification } = context;
    const triggerDate = new Date(deadline);
    triggerDate.setHours(triggerDate.getHours() - 1); // 1 hour before deadline

    await scheduleNotification(
      'Lineup Deadline Approaching!',
      `Don't forget to set your lineup for ${leagueName}`,
      { date: triggerDate },
      { screen: 'Lineup', leagueId: leagueName }
    );
  },

  // Send player news notification
  sendPlayerNews: async (playerName: string, news: string) => {
    const context = useContext(NotificationContext);
    if (!context) return;

    const { sendLocalNotification } = context;
    await sendLocalNotification(
      `${playerName} Update`,
      news,
      { screen: 'Player', playerName }
    );
  },

  // Send trade notification
  sendTradeNotification: async (leagueName: string, tradeDetails: string) => {
    const context = useContext(NotificationContext);
    if (!context) return;

    const { sendLocalNotification } = context;
    await sendLocalNotification(
      `New Trade Proposal in ${leagueName}`,
      tradeDetails,
      { screen: 'Trade', leagueName }
    );
  },

  // Send AI insight notification
  sendAIInsight: async (insight: string, priority: 'high' | 'medium' | 'low') => {
    const context = useContext(NotificationContext);
    if (!context) return;

    const { sendLocalNotification } = context;
    const title = priority === 'high' ? '🚨 Critical AI Insight' : '💡 AI Insight';
    await sendLocalNotification(
      title,
      insight,
      { screen: 'Insights' }
    );
  },
};

export default NotificationProvider;