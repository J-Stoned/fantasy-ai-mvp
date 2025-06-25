import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Text, Card, FAB, Chip, Avatar } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useVoice } from '../contexts/VoiceContext';
import { api } from '../services/api';
import { useWebSocket, useLiveScores, useInjuryAlerts } from '../hooks/useWebSocket';
import LiveScoreTicker from '../components/LiveScoreTicker';
import PlayerCard from '../components/PlayerCard';
import QuickActions from '../components/QuickActions';
import AIInsightCard from '../components/AIInsightCard';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { startListening } = useVoice();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = new Animated.Value(0);
  
  // WebSocket real-time data
  const { isConnected } = useWebSocket();
  const liveScores = useLiveScores();
  const injuryAlerts = useInjuryAlerts();

  // Fetch user's leagues
  const { data: leagues } = useQuery({
    queryKey: ['leagues'],
    queryFn: () => api.getLeagues(),
  });

  // Fetch AI insights
  const { data: insights } = useQuery({
    queryKey: ['insights'],
    queryFn: () => api.getAIInsights(),
  });

  // Fetch trending players
  const { data: trendingPlayers } = useQuery({
    queryKey: ['trending-players'],
    queryFn: () => api.getTrendingPlayers(),
  });

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Refetch all data
    await Promise.all([
      queryClient.invalidateQueries(['leagues']),
      queryClient.invalidateQueries(['insights']),
      queryClient.invalidateQueries(['trending-players']),
    ]);
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Header */}
        <LinearGradient
          colors={['#1E3A8A', '#1E40AF', '#2563EB']}
          style={styles.header}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.greeting}>
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </Text>
            <Text style={styles.subGreeting}>
              Your fantasy teams are looking strong today
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* Live Scores */}
        <LiveScoreTicker />

        {/* Quick Actions */}
        <QuickActions onActionPress={(action) => {
          switch (action) {
            case 'lineup':
              navigation.navigate('LineupBuilder');
              break;
            case 'voice':
              navigation.navigate('VoiceAssistant');
              break;
            case 'insights':
              navigation.navigate('Insights');
              break;
            case 'players':
              navigation.navigate('Players');
              break;
          }
        }} />

        {/* WebSocket Status */}
        {isConnected && (
          <View style={styles.wsStatus}>
            <Icon name="wifi" size={16} color="#10B981" />
            <Text style={styles.wsStatusText}>Live Updates Active</Text>
          </View>
        )}

        {/* Injury Alerts */}
        {injuryAlerts.length > 0 && (
          <View style={styles.alertBanner}>
            <Icon name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.alertText}>
              {injuryAlerts[0].playerName} - {injuryAlerts[0].status}
            </Text>
          </View>
        )}

        {/* AI Insights */}
        {insights && insights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="brain" size={24} color="#3B82F6" />
              <Text style={styles.sectionTitle}>AI Insights</Text>
              <Chip mode="outlined" style={styles.newBadge}>
                {insights.length} New
              </Chip>
            </View>
            {insights.slice(0, 3).map((insight, index) => (
              <AIInsightCard key={insight.id} insight={insight} />
            ))}
          </View>
        )}

        {/* Active Leagues */}
        {leagues && leagues.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="trophy" size={24} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Your Leagues</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {leagues.map((league) => (
                <Card
                  key={league.id}
                  style={styles.leagueCard}
                  onPress={() => navigation.navigate('LeagueDetail', { leagueId: league.id })}
                >
                  <Card.Content>
                    <Avatar.Text
                      size={40}
                      label={league.name.substring(0, 2).toUpperCase()}
                      style={{ backgroundColor: league.color || '#3B82F6' }}
                    />
                    <Text style={styles.leagueName}>{league.name}</Text>
                    <Text style={styles.leagueRank}>
                      Rank: {league.userRank}/{league.totalTeams}
                    </Text>
                    <Text style={styles.leaguePoints}>
                      {league.userPoints} pts
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Trending Players */}
        {trendingPlayers && trendingPlayers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="trending-up" size={24} color="#10B981" />
              <Text style={styles.sectionTitle}>Trending Players</Text>
            </View>
            {trendingPlayers.slice(0, 5).map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onPress={() => navigation.navigate('PlayerDetail', { playerId: player.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Voice Assistant FAB */}
      <FAB
        style={styles.fab}
        icon="microphone"
        onPress={() => startListening()}
        label="Hey Fantasy"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginLeft: 8,
    flex: 1,
  },
  newBadge: {
    backgroundColor: '#3B82F6',
  },
  leagueCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: '#1E293B',
  },
  leagueName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginTop: 8,
  },
  leagueRank: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  leaguePoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3B82F6',
  },
  wsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#065F46',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  wsStatusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  alertText: {
    color: '#FCA5A5',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});