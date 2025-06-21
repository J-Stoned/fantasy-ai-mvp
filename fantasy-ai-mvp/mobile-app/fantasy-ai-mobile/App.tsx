import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Voice from '@react-native-voice/voice';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import VoiceScreen from './src/screens/VoiceScreen';
import LeaguesScreen from './src/screens/LeaguesScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import PlayerScreen from './src/screens/PlayerScreen';
import ARCameraScreen from './src/screens/ARCameraScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

// Services
import { VoiceService } from './src/services/VoiceService';
import { BiometricService } from './src/services/BiometricService';
import { NotificationService } from './src/services/NotificationService';
import { FantasyAPIService } from './src/services/FantasyAPIService';

// Store
import { useAppStore } from './src/store/AppStore';

// Theme
import { AppTheme } from './src/theme/AppTheme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: AppTheme.colors.surface,
          borderTopWidth: 0,
          elevation: 8,
          shadowOpacity: 0.1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
        },
        tabBarActiveTintColor: AppTheme.colors.primary,
        tabBarInactiveTintColor: AppTheme.colors.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Voice':
              iconName = 'mic';
              break;
            case 'Leagues':
              iconName = 'sports-football';
              break;
            case 'Insights':
              iconName = 'insights';
              break;
            case 'Camera':
              iconName = 'camera-alt';
              break;
            default:
              iconName = 'help';
          }

          return (
            <View style={[
              styles.tabIconContainer,
              focused && styles.tabIconFocused
            ]}>
              <Icon name={iconName} size={size} color={color} />
              {focused && <View style={styles.tabIndicator} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Voice" 
        component={VoiceScreen}
        options={{ 
          tabBarLabel: 'Hey Fantasy',
          tabBarBadge: '🎤'
        }}
      />
      <Tab.Screen 
        name="Leagues" 
        component={LeaguesScreen}
        options={{ tabBarLabel: 'Leagues' }}
      />
      <Tab.Screen 
        name="Insights" 
        component={InsightsScreen}
        options={{ tabBarLabel: 'Insights' }}
      />
      <Tab.Screen 
        name="Camera" 
        component={ARCameraScreen}
        options={{ 
          tabBarLabel: 'AR Live',
          tabBarBadge: 'AR'
        }}
      />
    </Tab.Navigator>
  );
}

function App(): React.JSX.Element {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const { 
    isVoiceEnabled, 
    setVoiceEnabled,
    initializeApp,
    isInitialized 
  } = useAppStore();

  useEffect(() => {
    initializeAppServices();
  }, []);

  const initializeAppServices = async () => {
    try {
      // Request permissions
      await requestPermissions();
      
      // Initialize services
      await Promise.all([
        VoiceService.initialize(),
        BiometricService.initialize(),
        NotificationService.initialize(),
        FantasyAPIService.initialize(),
      ]);

      // Initialize app store
      await initializeApp();

      // Set up voice recognition
      if (isVoiceEnabled) {
        await setupVoiceRecognition();
      }

      setIsReady(true);
    } catch (error) {
      console.error('App initialization error:', error);
      Alert.alert('Initialization Error', 'Failed to initialize the app. Please restart.');
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        PermissionsAndroid.PERMISSIONS.BODY_SENSORS,
      ];

      await PermissionsAndroid.requestMultiple(permissions);
    }
  };

  const setupVoiceRecognition = async () => {
    try {
      Voice.onSpeechStart = () => console.log('Speech started');
      Voice.onSpeechEnd = () => console.log('Speech ended');
      Voice.onSpeechError = (error) => console.error('Speech error:', error);
      Voice.onSpeechResults = (event) => {
        const command = event.value?.[0];
        if (command) {
          VoiceService.processCommand(command);
        }
      };

      // Start continuous listening for "Hey Fantasy"
      await VoiceService.startWakeWordDetection();
    } catch (error) {
      console.error('Voice setup error:', error);
      setVoiceEnabled(false);
    }
  };

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <LinearGradient
          colors={AppTheme.gradients.primary}
          style={styles.loadingContainer}
        >
          <StatusBar
            barStyle="light-content"
            backgroundColor="transparent"
            translucent
          />
          <Text style={styles.loadingTitle}>🎙️ Fantasy.AI</Text>
          <Text style={styles.loadingSubtitle}>
            Initializing voice-powered fantasy dominance...
          </Text>
          <View style={styles.loadingAnimation}>
            {/* Add loading animation component */}
          </View>
        </LinearGradient>
      </SafeAreaProvider>
    );
  }

  if (showOnboarding && !isInitialized) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen 
              name="Player" 
              component={PlayerScreen}
              options={{
                presentation: 'modal',
                gestureEnabled: true,
              }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{
                presentation: 'card',
                gestureEnabled: true,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  loadingAnimation: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppTheme.colors.primary,
    marginTop: 4,
  },
});

export default App;