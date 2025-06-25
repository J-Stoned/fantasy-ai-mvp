import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LeaguesScreen from '../screens/LeaguesScreen';
import PlayersScreen from '../screens/PlayersScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import PlayerDetailScreen from '../screens/PlayerDetailScreen';
import LineupBuilderScreen from '../screens/LineupBuilderScreen';
import VoiceAssistantScreen from '../screens/VoiceAssistantScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { TestApiScreen } from '../screens/TestApiScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: '#1F2937',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#111827',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#F9FAFB',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
          headerTitle: 'Fantasy.AI',
        }}
      />
      <Tab.Screen
        name="Leagues"
        component={LeaguesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="trophy" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Players"
        component={PlayersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="brain" color={color} size={size} />
          ),
          tabBarBadge: 3, // AI insights available
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // You can return a loading screen here
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0F172A' },
      }}
    >
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="PlayerDetail" 
            component={PlayerDetailScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen 
            name="LineupBuilder" 
            component={LineupBuilderScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen 
            name="VoiceAssistant" 
            component={VoiceAssistantScreen}
            options={{ 
              headerShown: true,
              presentation: 'modal'
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen 
            name="TestApi" 
            component={TestApiScreen}
            options={{ 
              headerShown: true,
              title: 'API Test',
              headerStyle: { backgroundColor: '#0a0a0a' },
              headerTintColor: '#fff'
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}