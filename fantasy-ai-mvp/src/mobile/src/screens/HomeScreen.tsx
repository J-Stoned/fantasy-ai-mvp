import React, { useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useStore } from '../store';
import { useTheme } from '../contexts/ThemeContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useVoice } from '../contexts/VoiceContext';
import { AnimatedCard } from '../components/AnimatedCard';
import { LiveScoreTicker } from '../components/LiveScoreTicker';
import { QuickActions } from '../components/QuickActions';
import { PlayerHighlight } from '../components/PlayerHighlight';
import { FantasyNews } from '../components/FantasyNews';
import { LeagueOverview } from '../components/LeagueOverview';
import { AIInsights } from '../components/AIInsights';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { 
    user, 
    activeLeague, 
    notifications, 
    unreadCount,
    isLoading,
    setLoading 
  } = useStore();
  const { isConnected, latency } = useWebSocket();
  const { wakeWordDetected } = useVoice();
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard data
      await Promise.all([
        fetchLeagueData(),
        fetchPlayerUpdates(),
        fetchLiveScores(),
      ]);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagueData = async () => {
    // Implement API call
  };

  const fetchPlayerUpdates = async () => {
    // Implement API call
  };

  const fetchLiveScores = async () => {
    // Implement API call
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  const handleNotificationPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Notifications' as never);
  };

  const handleVoicePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('VoiceAssistant' as never);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            backgroundColor: theme.colors.card,
            paddingTop: insets.top,
          },
        ]}
      >
        <BlurView intensity={80} style={StyleSheet.absoluteFillObject} />
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Fantasy.AI
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleNotificationPress}
              style={styles.headerButton}
            >
              <Ionicons 
                name="notifications-outline" 
                size={24} 
                color={theme.colors.text} 
              />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.colors.notification }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 10 },
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Welcome Section */}
        <LinearGradient
          colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
          style={styles.welcomeSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeText}>
              Welcome back, {user?.name?.split(' ')[0]}!
            </Text>
            <Text style={styles.welcomeSubtext}>
              {activeLeague ? `${activeLeague.name} - Week ${activeLeague.currentWeek}` : 'No active league'}
            </Text>
          </View>
          
          {/* Connection Status */}
          <View style={styles.connectionStatus}>
            <View style={[
              styles.connectionDot,
              { backgroundColor: isConnected ? '#10B981' : '#EF4444' }
            ]} />
            <Text style={styles.connectionText}>
              {isConnected ? `Connected (${latency}ms)` : 'Offline'}
            </Text>
          </View>
        </LinearGradient>

        {/* Live Score Ticker */}
        <LiveScoreTicker />

        {/* Quick Actions */}
        <QuickActions />

        {/* League Overview */}
        {activeLeague && (
          <AnimatedCard delay={100}>
            <LeagueOverview league={activeLeague} />
          </AnimatedCard>
        )}

        {/* AI Insights */}
        <AnimatedCard delay={200}>
          <AIInsights />
        </AnimatedCard>

        {/* Player Highlights */}
        <AnimatedCard delay={300}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Player Highlights
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Players' as never)}>
              <Text style={[styles.seeAll, { color: theme.colors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
          <PlayerHighlight />
        </AnimatedCard>

        {/* Fantasy News */}
        <AnimatedCard delay={400}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Latest News
            </Text>
          </View>
          <FantasyNews />
        </AnimatedCard>
      </Animated.ScrollView>

      {/* Voice Assistant Button */}
      {wakeWordDetected && (
        <Animated.View
          style={[
            styles.voiceButton,
            { bottom: insets.bottom + 80 },
          ]}
        >
          <TouchableOpacity
            onPress={handleVoicePress}
            style={[
              styles.voiceButtonInner,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Ionicons name="mic" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  welcomeSection: {
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeContent: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  voiceButton: {
    position: 'absolute',
    right: 20,
    zIndex: 200,
  },
  voiceButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});