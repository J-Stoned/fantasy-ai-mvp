import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { enableScreens } from 'react-native-screens';

import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { VoiceProvider } from './src/contexts/VoiceContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { WebSocketProvider } from './src/contexts/WebSocketContext';
import { useStore } from './src/store';
import { initializeApp } from './src/utils/initialization';
import { linking } from './src/navigation/linking';

// Enable screens for better performance
enableScreens();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

export default function App() {
  const { initialize, setAuthenticated } = useStore();

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Initialize app services
        await initializeApp();

        // Check biometric authentication
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (hasHardware && isEnrolled) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to access Fantasy.AI',
            fallbackLabel: 'Use passcode',
          });
          
          if (result.success) {
            setAuthenticated(true);
          }
        } else {
          // Skip biometric for development/testing
          setAuthenticated(true);
        }

        // Initialize store
        await initialize();
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        // Hide splash screen
        await SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <WebSocketProvider>
                  <VoiceProvider>
                    <NavigationContainer linking={linking}>
                      <StatusBar style="light" />
                      <RootNavigator />
                    </NavigationContainer>
                  </VoiceProvider>
                </WebSocketProvider>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}