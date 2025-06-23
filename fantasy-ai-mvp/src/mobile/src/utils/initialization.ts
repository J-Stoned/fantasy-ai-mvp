import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const BACKGROUND_FETCH_TASK = 'fantasy-ai-background-fetch';
const BACKGROUND_NOTIFICATION_TASK = 'fantasy-ai-background-notification';

export async function initializeApp() {
  // Configure notifications
  await configureNotifications();
  
  // Register background tasks
  await registerBackgroundTasks();
  
  // Check authentication capabilities
  await checkAuthenticationCapabilities();
  
  // Initialize other services
  await initializeServices();
}

async function configureNotifications() {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Configure notification channels for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('lineup', {
      name: 'Lineup Alerts',
      description: 'Urgent lineup notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 500, 500],
      lightColor: '#FF0000',
      sound: 'lineup_alert.wav',
    });

    await Notifications.setNotificationChannelAsync('scores', {
      name: 'Score Updates',
      description: 'Live score notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
      lightColor: '#00FF00',
    });

    await Notifications.setNotificationChannelAsync('trades', {
      name: 'Trade Offers',
      description: 'Trade and waiver notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250],
      lightColor: '#0000FF',
    });
  }

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
    {
      identifier: 'counter',
      buttonTitle: 'Counter',
      options: {
        opensAppToForeground: true,
      },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('lineup', [
    {
      identifier: 'set',
      buttonTitle: 'Set Lineup',
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: 'optimize',
      buttonTitle: 'Auto-Optimize',
      options: {
        opensAppToForeground: false,
      },
    },
  ]);
}

async function registerBackgroundTasks() {
  // Register background fetch task
  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
      // Fetch latest data
      const response = await fetch('https://api.fantasy.ai/sync/updates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth token from secure storage
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Process updates
        if (data.lineupAlerts) {
          await scheduleLineupNotifications(data.lineupAlerts);
        }
        
        if (data.injuryUpdates) {
          await scheduleInjuryNotifications(data.injuryUpdates);
        }
        
        if (data.scoreUpdates) {
          await processScoreUpdates(data.scoreUpdates);
        }
        
        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
      
      return BackgroundFetch.BackgroundFetchResult.NoData;
    } catch (error) {
      console.error('Background fetch error:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });

  // Register background notification task
  TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
    if (error) {
      console.error('Background notification error:', error);
      return;
    }
    
    if (data) {
      // Handle notification data
      console.log('Background notification received:', data);
    }
  });

  // Register background fetch
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (error) {
    console.error('Background fetch registration error:', error);
  }
}

async function checkAuthenticationCapabilities() {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    console.log('Authentication capabilities:', {
      hasHardware,
      supportedTypes,
      isEnrolled,
    });
    
    return {
      hasHardware,
      supportedTypes,
      isEnrolled,
    };
  } catch (error) {
    console.error('Authentication check error:', error);
    return {
      hasHardware: false,
      supportedTypes: [],
      isEnrolled: false,
    };
  }
}

async function initializeServices() {
  // Initialize analytics
  // Initialize crash reporting
  // Initialize performance monitoring
  // Initialize remote config
  
  console.log('Services initialized');
}

async function scheduleLineupNotifications(alerts: any[]) {
  for (const alert of alerts) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Lineup Alert!',
        body: alert.message,
        data: {
          type: 'lineup',
          leagueId: alert.leagueId,
          week: alert.week,
        },
        categoryIdentifier: 'lineup',
      },
      trigger: {
        seconds: 1,
        channelId: 'lineup',
      },
    });
  }
}

async function scheduleInjuryNotifications(updates: any[]) {
  for (const update of updates) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚑 Injury Update',
        body: `${update.playerName} - ${update.status}`,
        data: {
          type: 'injury',
          playerId: update.playerId,
          status: update.status,
        },
      },
      trigger: {
        seconds: 1,
        channelId: 'default',
      },
    });
  }
}

async function processScoreUpdates(updates: any[]) {
  // Process and potentially show score update notifications
  for (const update of updates) {
    if (update.significant) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏈 Score Update',
          body: update.message,
          data: {
            type: 'score',
            matchupId: update.matchupId,
          },
        },
        trigger: {
          seconds: 1,
          channelId: 'scores',
        },
      });
    }
  }
}