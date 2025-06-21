import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import Lottie from 'lottie-react-native';

import { FantasyAPIService } from '../services/FantasyAPIService';
import { VoiceService } from '../services/VoiceService';
import { BiometricService } from '../services/BiometricService';
import { HapticService } from '../services/HapticService';
import { AppTheme } from '../theme/AppTheme';
import { useAppStore } from '../store/AppStore';

const { width, height } = Dimensions.get('window');

interface DashboardData {
  user: {
    name: string;
    avatar: string;
    totalTeams: number;
    weeklyRank: number;
    seasonPoints: number;
  };
  todaysGames: Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    time: string;
    sport: string;
    weather?: string;
  }>;
  topPlayers: Array<{
    id: string;
    name: string;
    team: string;
    position: string;
    projectedPoints: number;
    ownership: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  injuries: Array<{
    id: string;
    playerName: string;
    team: string;
    status: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  multimediaInsights: Array<{
    id: string;
    source: string;
    title: string;
    summary: string;
    timestamp: string;
    type: 'podcast' | 'youtube' | 'twitter';
  }>;
  biometricData?: {
    sleepScore: number;
    stressLevel: number;
    readiness: number;
    heartRate: number;
  };
}

const HomeScreen: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(-100);
  const scaleAnim = useSharedValue(0.8);

  const { currentUser, isVoiceEnabled } = useAppStore();

  useEffect(() => {
    initializeDashboard();
    startAnimations();
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);
      
      // Parallel data fetching for maximum speed
      const [
        userStats,
        todaysGames,
        topPlayers,
        injuryReports,
        multimediaData,
        biometricData
      ] = await Promise.all([
        FantasyAPIService.getUserDashboardStats(),
        FantasyAPIService.getTodaysGames(),
        FantasyAPIService.getTopPlayersToday(),
        FantasyAPIService.getLatestInjuries(),
        FantasyAPIService.getMultimediaInsights(),
        BiometricService.getTodaysMetrics()
      ]);

      setDashboardData({
        user: userStats,
        todaysGames,
        topPlayers,
        injuries: injuryReports,
        multimediaInsights: multimediaData,
        biometricData
      });

    } catch (error) {
      console.error('Dashboard initialization error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const startAnimations = () => {
    fadeAnim.value = withTiming(1, { duration: 800 });
    slideAnim.value = withSpring(0, { damping: 20 });
    scaleAnim.value = withSpring(1, { damping: 15 });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    HapticService.impact('light');
    await initializeDashboard();
    setRefreshing(false);
  };

  const handleVoiceCommand = async () => {
    try {
      HapticService.impact('medium');
      await VoiceService.startListening();
    } catch (error) {
      console.error('Voice command error:', error);
    }
  };

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { translateY: slideAnim.value },
      { scale: scaleAnim.value }
    ]
  }));

  const renderHeader = () => (
    <Animated.View style={[styles.header, animatedHeaderStyle]}>
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.headerTop}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {dashboardData?.user.name?.charAt(0) || 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>
                Good {getTimeOfDay()}, {dashboardData?.user.name || 'Champion'}!
              </Text>
              <Text style={styles.subGreeting}>
                Ready to dominate today's games?
              </Text>
            </View>
          </View>
          
          {isVoiceEnabled && (
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={handleVoiceCommand}
            >
              <Icon name="mic" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.currentTime}>
          {currentTime.toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </Text>
      </LinearGradient>
    </Animated.View>
  );

  const renderQuickStats = () => (
    <View style={styles.quickStatsContainer}>
      <LinearGradient
        colors={['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)']}
        style={styles.quickStatsCard}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dashboardData?.user.totalTeams || 0}</Text>
            <Text style={styles.statLabel}>Teams</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>#{dashboardData?.user.weeklyRank || '--'}</Text>
            <Text style={styles.statLabel}>Weekly Rank</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dashboardData?.user.seasonPoints || 0}</Text>
            <Text style={styles.statLabel}>Season Pts</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderBiometricData = () => {
    if (!dashboardData?.biometricData) return null;

    const { sleepScore, stressLevel, readiness, heartRate } = dashboardData.biometricData;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>🏃‍♂️ Your Performance</Text>
        <View style={styles.biometricGrid}>
          <View style={[styles.biometricCard, { backgroundColor: getBiometricColor(sleepScore) }]}>
            <Icon name="bedtime" size={24} color="white" />
            <Text style={styles.biometricValue}>{sleepScore}%</Text>
            <Text style={styles.biometricLabel}>Sleep</Text>
          </View>
          <View style={[styles.biometricCard, { backgroundColor: getBiometricColor(100 - stressLevel) }]}>
            <Icon name="psychology" size={24} color="white" />
            <Text style={styles.biometricValue}>{stressLevel}%</Text>
            <Text style={styles.biometricLabel}>Stress</Text>
          </View>
          <View style={[styles.biometricCard, { backgroundColor: getBiometricColor(readiness) }]}>
            <Icon name="fitness-center" size={24} color="white" />
            <Text style={styles.biometricValue}>{readiness}%</Text>
            <Text style={styles.biometricLabel}>Readiness</Text>
          </View>
          <View style={styles.biometricCard}>
            <Icon name="favorite" size={24} color="#FF6B6B" />
            <Text style={styles.biometricValue}>{heartRate}</Text>
            <Text style={styles.biometricLabel}>BPM</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTodaysGames = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🏈 Today's Games</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {dashboardData?.todaysGames.map((game, index) => (
          <TouchableOpacity key={game.id} style={styles.gameCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={styles.gameCardGradient}
            >
              <Text style={styles.gameTime}>{game.time}</Text>
              <View style={styles.gameTeams}>
                <Text style={styles.teamName}>{game.awayTeam}</Text>
                <Text style={styles.atSymbol}>@</Text>
                <Text style={styles.teamName}>{game.homeTeam}</Text>
              </View>
              <Text style={styles.gameSport}>{game.sport}</Text>
              {game.weather && (
                <Text style={styles.gameWeather}>🌤️ {game.weather}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTopPlayers = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⭐ Top Plays Today</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {dashboardData?.topPlayers.slice(0, 3).map((player, index) => (
        <TouchableOpacity key={player.id} style={styles.playerCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.playerCardGradient}
          >
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerTeam}>{player.team} • {player.position}</Text>
            </View>
            
            <View style={styles.playerStats}>
              <View style={styles.playerStat}>
                <Text style={styles.statNumber}>{player.projectedPoints.toFixed(1)}</Text>
                <Text style={styles.statText}>Proj</Text>
              </View>
              <View style={styles.playerStat}>
                <Text style={styles.statNumber}>{player.ownership}%</Text>
                <Text style={styles.statText}>Own</Text>
              </View>
              <Icon 
                name={getTrendIcon(player.trend)} 
                size={20} 
                color={getTrendColor(player.trend)} 
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderInjuryAlerts = () => {
    if (!dashboardData?.injuries || dashboardData.injuries.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>🚨 Injury Alerts</Text>
        {dashboardData.injuries.slice(0, 3).map((injury, index) => (
          <TouchableOpacity key={injury.id} style={styles.injuryCard}>
            <View style={[styles.impactIndicator, { backgroundColor: getImpactColor(injury.impact) }]} />
            <View style={styles.injuryInfo}>
              <Text style={styles.injuryPlayer}>{injury.playerName}</Text>
              <Text style={styles.injuryDetails}>{injury.team} • {injury.status}</Text>
            </View>
            <Icon name="info-outline" size={20} color={AppTheme.colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMultimediaInsights = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🎙️ Latest Buzz</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>More</Text>
        </TouchableOpacity>
      </View>

      {dashboardData?.multimediaInsights.slice(0, 2).map((insight, index) => (
        <TouchableOpacity key={insight.id} style={styles.insightCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.insightCardGradient}
          >
            <View style={styles.insightHeader}>
              <Icon 
                name={getInsightIcon(insight.type)} 
                size={20} 
                color={AppTheme.colors.primary} 
              />
              <Text style={styles.insightSource}>{insight.source}</Text>
              <Text style={styles.insightTime}>{insight.timestamp}</Text>
            </View>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightSummary}>{insight.summary}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={AppTheme.gradients.primary} style={styles.loadingContainer}>
          <Lottie
            source={require('../assets/animations/loading.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
          <Text style={styles.loadingText}>Loading your fantasy empire...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={AppTheme.gradients.primary} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
              colors={[AppTheme.colors.primary]}
            />
          }
        >
          {renderHeader()}
          {renderQuickStats()}
          {renderBiometricData()}
          {renderTodaysGames()}
          {renderTopPlayers()}
          {renderInjuryAlerts()}
          {renderMultimediaInsights()}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

// Helper functions
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

const getBiometricColor = (score: number) => {
  if (score >= 80) return '#4ECDC4';
  if (score >= 60) return '#FFA726';
  return '#FF6B6B';
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return 'trending-up';
    case 'down': return 'trending-down';
    default: return 'trending-flat';
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'up': return '#4ECDC4';
    case 'down': return '#FF6B6B';
    default: return '#FFA726';
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high': return '#FF6B6B';
    case 'medium': return '#FFA726';
    default: return '#4ECDC4';
  }
};

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'podcast': return 'podcast';
    case 'youtube': return 'play-circle-filled';
    case 'twitter': return 'chat';
    default: return 'article';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 100,
    height: 100,
  },
  loadingText: {
    fontSize: 16,
    color: 'white',
    marginTop: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerGradient: {
    paddingVertical: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  subGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  quickStatsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  quickStatsCard: {
    borderRadius: 16,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  seeAllText: {
    fontSize: 14,
    color: AppTheme.colors.primary,
    fontWeight: '600',
  },
  biometricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  biometricCard: {
    width: (width - 60) / 4,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  biometricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  biometricLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  gameCard: {
    width: 140,
    marginRight: 12,
  },
  gameCardGradient: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  gameTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppTheme.colors.primary,
    marginBottom: 8,
  },
  gameTeams: {
    alignItems: 'center',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  atSymbol: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginVertical: 2,
  },
  gameSport: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
  },
  gameWeather: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  playerCard: {
    marginBottom: 12,
  },
  playerCardGradient: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  playerTeam: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerStat: {
    alignItems: 'center',
    marginRight: 16,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppTheme.colors.primary,
  },
  statText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  injuryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginBottom: 8,
  },
  impactIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  injuryInfo: {
    flex: 1,
  },
  injuryPlayer: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  injuryDetails: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  insightCard: {
    marginBottom: 12,
  },
  insightCardGradient: {
    padding: 16,
    borderRadius: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightSource: {
    fontSize: 12,
    color: AppTheme.colors.primary,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  insightTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  insightSummary: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 16,
  },
});

export default HomeScreen;