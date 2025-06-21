import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

import { FantasyAPIService } from '../services/FantasyAPIService';
import { VoiceService } from '../services/VoiceService';
import { HapticService } from '../services/HapticService';
import { AppTheme } from '../theme/AppTheme';
import { useAppStore } from '../store/AppStore';

const { width, height } = Dimensions.get('window');

interface League {
  id: string;
  name: string;
  platform: 'yahoo' | 'espn' | 'sleeper' | 'cbs' | 'nfl' | 'draftkings' | 'fanduel';
  sport: 'football' | 'basketball' | 'baseball' | 'hockey';
  teamName: string;
  standing: number;
  totalTeams: number;
  record: {
    wins: number;
    losses: number;
    ties?: number;
  };
  points: {
    current: number;
    projected: number;
    weekHigh: number;
  };
  nextOpponent: string;
  playoffChance: number;
  status: 'active' | 'draft' | 'completed';
  lastUpdate: string;
  settings: {
    scoringType: string;
    rosterSize: number;
    playoffTeams: number;
  };
}

interface PlatformConnection {
  platform: string;
  icon: string;
  color: string;
  connected: boolean;
  leagues: number;
  lastSync: string;
}

const LeaguesScreen: React.FC = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [platformConnections, setPlatformConnections] = useState<PlatformConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(100);

  const { currentUser, isVoiceEnabled } = useAppStore();

  useEffect(() => {
    initializeLeagues();
    startAnimations();
  }, []);

  const initializeLeagues = async () => {
    try {
      setIsLoading(true);
      
      const [leaguesData, connectionsData] = await Promise.all([
        FantasyAPIService.getAllUserLeagues(),
        FantasyAPIService.getPlatformConnections()
      ]);

      setLeagues(leaguesData);
      setPlatformConnections(connectionsData);
    } catch (error) {
      console.error('Leagues initialization error:', error);
      Alert.alert('Error', 'Failed to load leagues data');
    } finally {
      setIsLoading(false);
    }
  };

  const startAnimations = () => {
    fadeAnim.value = withSpring(1, { damping: 20 });
    slideAnim.value = withSpring(0, { damping: 15 });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    HapticService.impact('light');
    await initializeLeagues();
    setRefreshing(false);
  }, []);

  const handleConnectPlatform = async (platform: string) => {
    try {
      setSelectedPlatform(platform);
      setShowAddModal(true);
      HapticService.impact('medium');
    } catch (error) {
      console.error('Platform connection error:', error);
    }
  };

  const handleAddLeague = async () => {
    try {
      if (!credentials.username || !credentials.password) {
        Alert.alert('Error', 'Please enter your credentials');
        return;
      }

      HapticService.impact('medium');
      
      const result = await FantasyAPIService.connectToPlatform(
        selectedPlatform,
        credentials.username,
        credentials.password
      );

      if (result.success) {
        Alert.alert('Success', `Connected to ${selectedPlatform}! Found ${result.leagues.length} leagues.`);
        setShowAddModal(false);
        setCredentials({ username: '', password: '' });
        await initializeLeagues();
        HapticService.success();
      } else {
        Alert.alert('Error', result.error || 'Failed to connect to platform');
        HapticService.error();
      }
    } catch (error) {
      console.error('Add league error:', error);
      Alert.alert('Error', 'Failed to add league');
      HapticService.error();
    }
  };

  const handleVoiceCommand = async () => {
    try {
      HapticService.impact('medium');
      const command = await VoiceService.startListening();
      
      // Process league-specific voice commands
      if (command.includes('sync') || command.includes('refresh')) {
        await onRefresh();
      } else if (command.includes('add league') || command.includes('connect')) {
        setShowAddModal(true);
      }
    } catch (error) {
      console.error('Voice command error:', error);
    }
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }]
  }));

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>🏈 My Leagues</Text>
            <Text style={styles.headerSubtitle}>
              {leagues.length} active leagues • {getTotalPlatforms()} platforms
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            {isVoiceEnabled && (
              <TouchableOpacity
                style={styles.voiceButton}
                onPress={handleVoiceCommand}
              >
                <Icon name="mic" size={20} color="white" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Icon name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderPlatformConnections = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Platform Connections</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {platforms.map((platform, index) => {
          const connection = platformConnections.find(c => c.platform === platform.id);
          return (
            <TouchableOpacity
              key={platform.id}
              style={[
                styles.platformCard,
                { backgroundColor: platform.color + '20' }
              ]}
              onPress={() => handleConnectPlatform(platform.id)}
            >
              <LinearGradient
                colors={[platform.color + '40', platform.color + '20']}
                style={styles.platformCardGradient}
              >
                <Icon name={platform.icon} size={32} color={platform.color} />
                <Text style={styles.platformName}>{platform.name}</Text>
                
                {connection?.connected ? (
                  <View style={styles.connectionStatus}>
                    <Icon name="check-circle" size={16} color="#4ECDC4" />
                    <Text style={styles.connectionText}>
                      {connection.leagues} leagues
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.connectButton}>
                    <Text style={styles.connectButtonText}>Connect</Text>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderLeaguesList = () => (
    <Animated.View style={[styles.sectionContainer, animatedContainerStyle]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Leagues</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Icon name="sync" size={20} color={AppTheme.colors.primary} />
        </TouchableOpacity>
      </View>

      {leagues.map((league, index) => (
        <TouchableOpacity key={league.id} style={styles.leagueCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.leagueCardGradient}
          >
            <View style={styles.leagueHeader}>
              <View style={styles.leagueInfo}>
                <View style={styles.leagueTitleRow}>
                  <Text style={styles.leagueName}>{league.name}</Text>
                  <View style={[
                    styles.platformBadge,
                    { backgroundColor: getPlatformColor(league.platform) }
                  ]}>
                    <Text style={styles.platformBadgeText}>
                      {league.platform.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.leagueTeam}>{league.teamName}</Text>
                <Text style={styles.leagueRecord}>
                  {league.record.wins}-{league.record.losses}
                  {league.record.ties ? `-${league.record.ties}` : ''} • 
                  #{league.standing} of {league.totalTeams}
                </Text>
              </View>

              <View style={styles.leaguePoints}>
                <Text style={styles.pointsValue}>{league.points.current.toFixed(1)}</Text>
                <Text style={styles.pointsLabel}>Points</Text>
              </View>
            </View>

            <View style={styles.leagueStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Projected</Text>
                <Text style={styles.statValue}>{league.points.projected.toFixed(1)}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Week High</Text>
                <Text style={styles.statValue}>{league.points.weekHigh.toFixed(1)}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Playoffs</Text>
                <Text style={[
                  styles.statValue,
                  { color: getPlayoffColor(league.playoffChance) }
                ]}>
                  {league.playoffChance}%
                </Text>
              </View>
            </View>

            <View style={styles.leagueFooter}>
              <Text style={styles.nextOpponent}>
                Next: vs {league.nextOpponent}
              </Text>
              <Text style={styles.lastUpdate}>
                Updated {league.lastUpdate}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );

  const renderAddLeagueModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={AppTheme.gradients.primary}
            style={styles.modalGradient}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Connect to {selectedPlatform?.toUpperCase()}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Username/Email</Text>
              <TextInput
                style={styles.textInput}
                value={credentials.username}
                onChangeText={(text) => setCredentials({ ...credentials, username: text })}
                placeholder="Enter your username or email"
                placeholderTextColor="rgba(255,255,255,0.5)"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.textInput}
                value={credentials.password}
                onChangeText={(text) => setCredentials({ ...credentials, password: text })}
                placeholder="Enter your password"
                placeholderTextColor="rgba(255,255,255,0.5)"
                secureTextEntry
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.connectButtonLarge}
                  onPress={handleAddLeague}
                >
                  <Text style={styles.connectButtonLargeText}>Connect</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.securityNote}>
                🔒 Your credentials are encrypted and never stored permanently
              </Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={AppTheme.gradients.primary} style={styles.loadingContainer}>
          <Icon name="sports-football" size={60} color="white" />
          <Text style={styles.loadingText}>Loading your leagues...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={AppTheme.gradients.primary} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
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
          {renderPlatformConnections()}
          {renderLeaguesList()}
        </ScrollView>
        
        {renderAddLeagueModal()}
      </LinearGradient>
    </SafeAreaView>
  );
};

// Platform configurations
const platforms = [
  { id: 'yahoo', name: 'Yahoo', icon: 'sports', color: '#6001D2' },
  { id: 'espn', name: 'ESPN', icon: 'sports-football', color: '#FF0000' },
  { id: 'sleeper', name: 'Sleeper', icon: 'bedtime', color: '#58CC92' },
  { id: 'cbs', name: 'CBS', icon: 'tv', color: '#0066CC' },
  { id: 'nfl', name: 'NFL.com', icon: 'sports', color: '#013369' },
  { id: 'draftkings', name: 'DraftKings', icon: 'casino', color: '#F15A29' },
  { id: 'fanduel', name: 'FanDuel', icon: 'star', color: '#1E3A8A' },
];

// Helper functions
const getTotalPlatforms = () => {
  return new Set(platforms.map(p => p.id)).size;
};

const getPlatformColor = (platform: string) => {
  const platformData = platforms.find(p => p.id === platform);
  return platformData?.color || AppTheme.colors.primary;
};

const getPlayoffColor = (chance: number) => {
  if (chance >= 70) return '#4ECDC4';
  if (chance >= 40) return '#FFA726';
  return '#FF6B6B';
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
  loadingText: {
    fontSize: 16,
    color: 'white',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  platformCard: {
    width: 120,
    marginRight: 12,
  },
  platformCardGradient: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  platformName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  connectionText: {
    fontSize: 10,
    color: 'white',
    marginLeft: 4,
  },
  connectButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  connectButtonText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  leagueCard: {
    marginBottom: 16,
  },
  leagueCardGradient: {
    padding: 16,
    borderRadius: 12,
  },
  leagueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  platformBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  platformBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  leagueTeam: {
    fontSize: 14,
    color: AppTheme.colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  leagueRecord: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  leaguePoints: {
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppTheme.colors.primary,
  },
  pointsLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  leagueStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  leagueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextOpponent: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  lastUpdate: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: 'white',
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  connectButtonLarge: {
    flex: 1,
    backgroundColor: AppTheme.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  connectButtonLargeText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LeaguesScreen;