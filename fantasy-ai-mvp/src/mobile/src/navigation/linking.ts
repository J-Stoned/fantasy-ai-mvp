import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

export const linking = {
  prefixes: [prefix, 'fantasyai://', 'https://fantasy.ai', 'https://*.fantasy.ai'],
  config: {
    screens: {
      Main: {
        screens: {
          MainTabs: {
            screens: {
              Home: 'home',
              Lineup: 'lineup',
              Scores: 'scores',
              Players: 'players',
              Leagues: 'leagues',
            },
          },
          Profile: 'profile',
          Notifications: 'notifications',
          Settings: 'settings',
          VoiceAssistant: 'voice',
          ARCamera: 'ar',
          WidgetConfig: 'widgets',
        },
      },
      PlayerDetail: {
        path: 'player/:id',
        parse: {
          id: (id: string) => id,
        },
      },
      Onboarding: 'onboarding',
      
      // Deep linking for notifications
      LineupAlert: {
        path: 'lineup-alert/:leagueId/:week',
        parse: {
          leagueId: (id: string) => id,
          week: (week: string) => parseInt(week, 10),
        },
      },
      TradeOffer: {
        path: 'trade/:tradeId',
        parse: {
          tradeId: (id: string) => id,
        },
      },
      InjuryUpdate: {
        path: 'injury/:playerId',
        parse: {
          playerId: (id: string) => id,
        },
      },
      ScoreUpdate: {
        path: 'score/:matchupId',
        parse: {
          matchupId: (id: string) => id,
        },
      },
    },
  },
  
  // Handle notification data
  async getInitialURL() {
    // Check if app was opened from a notification
    const url = await Linking.getInitialURL();
    if (url != null) {
      return url;
    }
    
    // Check if there's a notification to handle
    const notificationResponse = await getLastNotificationResponse();
    if (notificationResponse?.notification?.request?.content?.data?.url) {
      return notificationResponse.notification.request.content.data.url;
    }
    
    return null;
  },
  
  subscribe(listener: (url: string) => void) {
    const urlListener = Linking.addEventListener('url', (event) => {
      listener(event.url);
    });
    
    // Listen for notification responses
    const notificationListener = addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (url) {
        listener(url);
      }
    });
    
    return () => {
      urlListener.remove();
      notificationListener.remove();
    };
  },
};

// Helper functions (these would be imported from expo-notifications)
function getLastNotificationResponse(): any {
  // Placeholder - would import from expo-notifications
  return null;
}

function addNotificationResponseReceivedListener(callback: (response: any) => void): any {
  // Placeholder - would import from expo-notifications
  return { remove: () => {} };
}