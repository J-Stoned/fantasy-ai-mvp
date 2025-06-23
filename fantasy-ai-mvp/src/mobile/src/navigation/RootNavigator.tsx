import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LineupScreen from '../screens/LineupScreen';
import ScoresScreen from '../screens/ScoresScreen';
import PlayersScreen from '../screens/PlayersScreen';
import LeaguesScreen from '../screens/LeaguesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PlayerDetailScreen from '../screens/PlayerDetailScreen';
import ARCameraScreen from '../screens/ARCameraScreen';
import VoiceAssistantScreen from '../screens/VoiceAssistantScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import WidgetConfigScreen from '../screens/WidgetConfigScreen';

// Hooks and Store
import { useStore } from '../store';
import { useTheme } from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Main Tab Navigator
function TabNavigator() {
  const { theme } = useTheme();
  
  const tabBarOptions = {
    activeTintColor: theme.colors.primary,
    inactiveTintColor: theme.colors.textSecondary,
    style: {
      backgroundColor: theme.colors.background,
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      paddingTop: 5,
      paddingBottom: Platform.OS === 'ios' ? 20 : 5,
      height: Platform.OS === 'ios' ? 85 : 65,
    },
    labelStyle: {
      fontSize: 12,
      fontWeight: '600',
    },
  };

  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        switch (route.name) {
          case 'Home':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Lineup':
            iconName = focused ? 'people' : 'people-outline';
            break;
          case 'Scores':
            iconName = focused ? 'football' : 'football-outline';
            break;
          case 'Players':
            iconName = focused ? 'person' : 'person-outline';
            break;
          case 'Leagues':
            iconName = focused ? 'trophy' : 'trophy-outline';
            break;
          default:
            iconName = 'alert-circle-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      tabBarStyle: {
        backgroundColor: theme.colors.card,
        borderTopColor: theme.colors.border,
        borderTopWidth: 1,
        paddingTop: 5,
        paddingBottom: Platform.OS === 'ios' ? 20 : 5,
        height: Platform.OS === 'ios' ? 85 : 65,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
      headerShown: false,
    })}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen 
        name="Lineup" 
        component={LineupScreen}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen 
        name="Scores" 
        component={ScoresScreen}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen 
        name="Players" 
        component={PlayersScreen}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen 
        name="Leagues" 
        component={LeaguesScreen}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
    </Tab.Navigator>
  );
}

// Drawer Navigator with Tab Navigator
function DrawerNavigator() {
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        drawerStyle: {
          backgroundColor: theme.colors.background,
          width: 280,
        },
        drawerContentStyle: {
          backgroundColor: theme.colors.background,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
        headerShown: false,
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={TabNavigator}
        options={{
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Voice Assistant" 
        component={VoiceAssistantScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="mic-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="AR Camera" 
        component={ARCameraScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="camera-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Widget Config" 
        component={WidgetConfigScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

// Root Stack Navigator
export function RootNavigator() {
  const { isAuthenticated, user } = useStore();
  const { theme } = useTheme();
  const isFirstLaunch = !user; // Check if user needs onboarding

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
        presentation: 'card',
        gestureEnabled: true,
        cardOverlayEnabled: true,
        animationTypeForReplace: isAuthenticated ? 'push' : 'pop',
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          options={{
            animationEnabled: true,
            gestureEnabled: false,
          }}
        />
      ) : (
        <>
          <Stack.Screen 
            name="Main" 
            component={DrawerNavigator}
            options={{
              animationEnabled: false,
            }}
          />
          <Stack.Screen 
            name="PlayerDetail" 
            component={PlayerDetailScreen}
            options={{
              presentation: 'modal',
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />
          <Stack.Screen 
            name="ARCamera" 
            component={ARCameraScreen}
            options={{
              presentation: 'fullScreenModal',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="VoiceAssistant" 
            component={VoiceAssistantScreen}
            options={{
              presentation: 'modal',
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}