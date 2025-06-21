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
  Share,
  Image,
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
  runOnJS,
} from 'react-native-reanimated';

import { FantasyAPIService } from '../services/FantasyAPIService';
import { VoiceService } from '../services/VoiceService';
import { HapticService } from '../services/HapticService';
import { AppTheme } from '../theme/AppTheme';
import { useAppStore } from '../store/AppStore';

const { width, height } = Dimensions.get('window');

interface PlayerData {
  id: string;
  name: string;
  team: string;
  position: string;
  number: number;
  age: number;
  height: string;
  weight: string;
  college?: string;
  experience: number;
  photoUrl?: string;
  status: 'healthy' | 'questionable' | 'doubtful' | 'out' | 'injured_reserve';
  
  // Fantasy Data
  fantasyData: {
    currentPoints: number;
    projectedPoints: number;
    averagePoints: number;
    ranking: number;
    ownership: number;
    trend: 'up' | 'down' | 'stable';
    startAdvice: 'start' | 'sit' | 'flex' | 'monitor';
  };

  // Performance Stats
  stats: {
    season: Record<string, number>;
    lastGame: Record<string, number>;
    last5Games: Record<string, number>;
    vsOpponent: Record<string, number>;
  };

  // Advanced Analytics
  analytics: {
    targetShare: number;
    redZoneUsage: number;
    snapCount: number;
    efficiency: number;
    consistency: number;
    ceiling: number;
    floor: number;
  };

  // Situational Data
  situational: {
    homeVsAway: { home: number; away: number };
    byQuarter: Record<string, number>;
    weatherImpact: string;
    gameScript: string;
  };

  // News & Insights
  news: Array<{
    id: string;
    title: string;
    summary: string;
    source: string;
    timestamp: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;

  // Multimedia Mentions
  multimedia: Array<{
    id: string;
    type: 'podcast' | 'youtube' | 'twitter';
    source: string;
    content: string;
    sentiment: number;
    timestamp: string;
  }>;

  // Injury History
  injuries: Array<{
    id: string;
    type: string;
    date: string;
    gamesmissed: number;
    returnDate?: string;
  }>;
}

interface PlayerScreenProps {
  route: {
    params: {
      playerId: string;
      playerName?: string;
    };
  };
  navigation: any;
}

const PlayerScreen: React.FC<PlayerScreenProps> = ({ route, navigation }) => {
  const { playerId, playerName } = route.params;
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(100);
  const tabAnim = useSharedValue(0);
  const headerScrollAnim = useSharedValue(0);

  const { isVoiceEnabled } = useAppStore();

  useEffect(() => {
    initializePlayer();
    startAnimations();
  }, [playerId]);

  const initializePlayer = async () => {
    try {
      setIsLoading(true);
      
      // Parallel data fetching for comprehensive player analysis
      const [
        basicData,
        fantasyData,
        stats,
        analytics,
        situational,
        news,
        multimedia,
        injuries
      ] = await Promise.all([
        FantasyAPIService.getPlayerBasicInfo(playerId),
        FantasyAPIService.getPlayerFantasyData(playerId),
        FantasyAPIService.getPlayerStats(playerId),
        FantasyAPIService.getPlayerAnalytics(playerId),
        FantasyAPIService.getPlayerSituationalData(playerId),
        FantasyAPIService.getPlayerNews(playerId),
        FantasyAPIService.getPlayerMultimediaInsights(playerId),
        FantasyAPIService.getPlayerInjuryHistory(playerId)
      ]);

      const completePlayerData: PlayerData = {
        ...basicData,
        fantasyData,
        stats,
        analytics,
        situational,
        news,
        multimedia,
        injuries
      };

      setPlayerData(completePlayerData);
    } catch (error) {
      console.error('Player data initialization error:', error);
      Alert.alert('Error', 'Failed to load player data');
    } finally {
      setIsLoading(false);
    }
  };

  const startAnimations = () => {
    fadeAnim.value = withTiming(1, { duration: 800 });
    slideAnim.value = withSpring(0, { damping: 20 });
    tabAnim.value = withSpring(1, { damping: 15 });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    HapticService.impact('light');
    await initializePlayer();
    setRefreshing(false);
  };

  const handleVoiceCommand = async () => {
    try {
      HapticService.impact('medium');
      const command = await VoiceService.startListening();
      
      // Process player-specific voice commands
      if (command.includes('start') || command.includes('lineup')) {
        setSelectedTab('fantasy');
      } else if (command.includes('stats') || command.includes('performance')) {
        setSelectedTab('stats');
      } else if (command.includes('news') || command.includes('injury')) {
        setSelectedTab('news');
      }
    } catch (error) {
      console.error('Voice command error:', error);
    }
  };

  const handleShare = async () => {
    if (!playerData) return;
    
    try {
      const shareText = `Check out ${playerData.name} on Fantasy.AI! 
${playerData.fantasyData.currentPoints} fantasy points this season
${playerData.fantasyData.startAdvice.toUpperCase()} recommendation
Powered by AI analysis 🤖`;

      await Share.share({
        title: `${playerData.name} - Fantasy.AI`,
        message: shareText,
      });
      HapticService.success();
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { translateY: slideAnim.value },
      { scale: interpolate(headerScrollAnim.value, [0, 100], [1, 0.95]) }
    ]
  }));

  const renderHeader = () => {
    if (!playerData) return null;

    return (
      <Animated.View style={[styles.header, animatedHeaderStyle]}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)']}
          style={styles.headerGradient}
        >
          {/* Navigation */}
          <View style={styles.navigation}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.navActions}>
              {isVoiceEnabled && (
                <TouchableOpacity
                  style={styles.voiceButton}
                  onPress={handleVoiceCommand}
                >
                  <Icon name="mic" size={20} color="white" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
              >
                <Icon name="share" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Player Info */}
          <View style={styles.playerInfo}>
            <View style={styles.playerImageContainer}>
              {playerData.photoUrl ? (
                <Image source={{ uri: playerData.photoUrl }} style={styles.playerImage} />
              ) : (
                <View style={styles.playerImagePlaceholder}>
                  <Text style={styles.playerImageText}>
                    {playerData.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
              )}
              
              <View style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(playerData.status) }
              ]}>
                <Icon name={getStatusIcon(playerData.status)} size={12} color="white" />
              </View>
            </View>

            <View style={styles.playerDetails}>
              <Text style={styles.playerName}>{playerData.name}</Text>
              <Text style={styles.playerMeta}>
                #{playerData.number} • {playerData.position} • {playerData.team}
              </Text>
              <Text style={styles.playerPhysical}>
                {playerData.height} • {playerData.weight} • {playerData.age} years old
              </Text>
              {playerData.college && (
                <Text style={styles.playerCollege}>🎓 {playerData.college}</Text>
              )}
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{playerData.fantasyData.currentPoints}</Text>
              <Text style={styles.statLabel}>Fantasy Pts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>#{playerData.fantasyData.ranking}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{playerData.fantasyData.ownership}%</Text>
              <Text style={styles.statLabel}>Owned</Text>
            </View>
            <View style={styles.statBox}>
              <View style={[
                styles.adviceBadge,
                { backgroundColor: getAdviceColor(playerData.fantasyData.startAdvice) }
              ]}>
                <Text style={styles.adviceText}>
                  {playerData.fantasyData.startAdvice.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            selectedTab === tab.id && styles.activeTab
          ]}
          onPress={() => {
            setSelectedTab(tab.id);
            HapticService.impact('light');
          }}
        >
          <Icon 
            name={tab.icon} 
            size={18} 
            color={selectedTab === tab.id ? AppTheme.colors.primary : 'rgba(255,255,255,0.6)'} 
          />
          <Text style={[
            styles.tabText,
            selectedTab === tab.id && styles.activeTabText
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTabContent = () => {
    if (!playerData) return null;

    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'fantasy':
        return renderFantasyTab();
      case 'stats':
        return renderStatsTab();
      case 'analytics':
        return renderAnalyticsTab();
      case 'news':
        return renderNewsTab();
      default:
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Fantasy Recommendation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Fantasy Recommendation</Text>
        <View style={styles.recommendationCard}>
          <LinearGradient
            colors={[getAdviceColor(playerData!.fantasyData.startAdvice) + '40', getAdviceColor(playerData!.fantasyData.startAdvice) + '20']}
            style={styles.recommendationGradient}
          >
            <Text style={styles.recommendationAdvice}>
              {getAdviceText(playerData!.fantasyData.startAdvice)}
            </Text>
            <Text style={styles.recommendationReason}>
              Based on matchup analysis, recent performance, and AI projections
            </Text>
          </LinearGradient>
        </View>
      </View>

      {/* This Week Projection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 This Week</Text>
        <View style={styles.projectionCard}>
          <View style={styles.projectionHeader}>
            <Text style={styles.projectedPoints}>{playerData!.fantasyData.projectedPoints.toFixed(1)}</Text>
            <Text style={styles.projectedLabel}>Projected Points</Text>
          </View>
          <View style={styles.projectionDetails}>
            <View style={styles.projectionStat}>
              <Text style={styles.projectionValue}>{playerData!.analytics.ceiling.toFixed(1)}</Text>
              <Text style={styles.projectionText}>Ceiling</Text>
            </View>
            <View style={styles.projectionStat}>
              <Text style={styles.projectionValue}>{playerData!.analytics.floor.toFixed(1)}</Text>
              <Text style={styles.projectionText}>Floor</Text>
            </View>
            <View style={styles.projectionStat}>
              <Text style={styles.projectionValue}>{(playerData!.analytics.consistency * 100).toFixed(0)}%</Text>
              <Text style={styles.projectionText}>Consistency</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Recent Performance</Text>
        <View style={styles.performanceGrid}>
          <View style={styles.performanceCard}>
            <Text style={styles.performanceValue}>{Object.values(playerData!.stats.lastGame)[0] || 'N/A'}</Text>
            <Text style={styles.performanceLabel}>Last Game</Text>
          </View>
          <View style={styles.performanceCard}>
            <Text style={styles.performanceValue}>{Object.values(playerData!.stats.last5Games)[0] || 'N/A'}</Text>
            <Text style={styles.performanceLabel}>Last 5 Games</Text>
          </View>
          <View style={styles.performanceCard}>
            <Text style={styles.performanceValue}>{Object.values(playerData!.stats.season)[0] || 'N/A'}</Text>
            <Text style={styles.performanceLabel}>Season Avg</Text>
          </View>
        </View>
      </View>

      {/* Key Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧠 AI Insights</Text>
        {playerData!.multimedia.slice(0, 3).map((insight, index) => (
          <View key={insight.id} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Icon name={getMultimediaIcon(insight.type)} size={16} color={AppTheme.colors.primary} />
              <Text style={styles.insightSource}>{insight.source}</Text>
              <Text style={styles.insightTime}>{insight.timestamp}</Text>
            </View>
            <Text style={styles.insightContent}>{insight.content}</Text>
            <View style={styles.insightFooter}>
              <View style={[
                styles.sentimentBadge,
                { backgroundColor: getSentimentColor(insight.sentiment) }
              ]}>
                <Text style={styles.sentimentText}>
                  {insight.sentiment > 0.6 ? 'Positive' : insight.sentiment < 0.4 ? 'Negative' : 'Neutral'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderFantasyTab = () => (
    <View style={styles.tabContent}>
      {/* Start/Sit Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Start/Sit Analysis</Text>
        <View style={styles.analysisCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.analysisGradient}
          >
            <View style={styles.analysisHeader}>
              <View style={[
                styles.adviceBadgeLarge,
                { backgroundColor: getAdviceColor(playerData!.fantasyData.startAdvice) }
              ]}>
                <Text style={styles.adviceTextLarge}>
                  {playerData!.fantasyData.startAdvice.toUpperCase()}
                </Text>
              </View>
              <View style={styles.trendIndicator}>
                <Icon 
                  name={getTrendIcon(playerData!.fantasyData.trend)} 
                  size={20} 
                  color={getTrendColor(playerData!.fantasyData.trend)} 
                />
                <Text style={[styles.trendText, { color: getTrendColor(playerData!.fantasyData.trend) }]}>
                  {playerData!.fantasyData.trend.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.analysisText}>
              {getDetailedAdvice(playerData!.fantasyData.startAdvice, playerData!)}
            </Text>
          </LinearGradient>
        </View>
      </View>

      {/* Matchup Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚔️ Matchup Analysis</Text>
        <View style={styles.matchupGrid}>
          <View style={styles.matchupStat}>
            <Text style={styles.matchupValue}>{Object.values(playerData!.stats.vsOpponent)[0] || 'N/A'}</Text>
            <Text style={styles.matchupLabel}>vs Opponent</Text>
          </View>
          <View style={styles.matchupStat}>
            <Text style={styles.matchupValue}>{playerData!.situational.weatherImpact}</Text>
            <Text style={styles.matchupLabel}>Weather</Text>
          </View>
          <View style={styles.matchupStat}>
            <Text style={styles.matchupValue}>{playerData!.situational.gameScript}</Text>
            <Text style={styles.matchupLabel}>Game Script</Text>
          </View>
        </View>
      </View>

      {/* Usage Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Usage Metrics</Text>
        <View style={styles.usageGrid}>
          <View style={styles.usageCard}>
            <Text style={styles.usageValue}>{(playerData!.analytics.targetShare * 100).toFixed(1)}%</Text>
            <Text style={styles.usageLabel}>Target Share</Text>
          </View>
          <View style={styles.usageCard}>
            <Text style={styles.usageValue}>{(playerData!.analytics.redZoneUsage * 100).toFixed(1)}%</Text>
            <Text style={styles.usageLabel}>Red Zone</Text>
          </View>
          <View style={styles.usageCard}>
            <Text style={styles.usageValue}>{playerData!.analytics.snapCount}</Text>
            <Text style={styles.usageLabel}>Snap Count</Text>
          </View>
          <View style={styles.usageCard}>
            <Text style={styles.usageValue}>{(playerData!.analytics.efficiency * 100).toFixed(0)}%</Text>
            <Text style={styles.usageLabel}>Efficiency</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStatsTab = () => (
    <View style={styles.tabContent}>
      {/* Season Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Season Statistics</Text>
        <View style={styles.statsGrid}>
          {Object.entries(playerData!.stats.season).map(([stat, value]) => (
            <View key={stat} style={styles.statCard}>
              <Text style={styles.statCardValue}>{value}</Text>
              <Text style={styles.statCardLabel}>{formatStatName(stat)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Situational Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏠 Home vs Away</Text>
        <View style={styles.situationalGrid}>
          <View style={styles.situationalCard}>
            <Text style={styles.situationalValue}>{playerData!.situational.homeVsAway.home}</Text>
            <Text style={styles.situationalLabel}>Home</Text>
          </View>
          <View style={styles.situationalCard}>
            <Text style={styles.situationalValue}>{playerData!.situational.homeVsAway.away}</Text>
            <Text style={styles.situationalLabel}>Away</Text>
          </View>
        </View>
      </View>

      {/* Quarter-by-Quarter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏱️ By Quarter</Text>
        <View style={styles.quarterGrid}>
          {Object.entries(playerData!.situational.byQuarter).map(([quarter, value]) => (
            <View key={quarter} style={styles.quarterCard}>
              <Text style={styles.quarterValue}>{value}</Text>
              <Text style={styles.quarterLabel}>{quarter}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderAnalyticsTab = () => (
    <View style={styles.tabContent}>
      {/* Advanced Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔬 Advanced Analytics</Text>
        <View style={styles.analyticsGrid}>
          {Object.entries(playerData!.analytics).map(([metric, value]) => (
            <View key={metric} style={styles.analyticsCard}>
              <Text style={styles.analyticsValue}>
                {typeof value === 'number' ? 
                  (value < 1 ? (value * 100).toFixed(1) + '%' : value.toFixed(1)) 
                  : value
                }
              </Text>
              <Text style={styles.analyticsLabel}>{formatStatName(metric)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Injury History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏥 Injury History</Text>
        {playerData!.injuries.length > 0 ? (
          playerData!.injuries.map((injury) => (
            <View key={injury.id} style={styles.injuryCard}>
              <View style={styles.injuryHeader}>
                <Text style={styles.injuryType}>{injury.type}</Text>
                <Text style={styles.injuryDate}>{injury.date}</Text>
              </View>
              <Text style={styles.injuryDetails}>
                {injury.gamesmissed} games missed
                {injury.returnDate && ` • Returned ${injury.returnDate}`}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No recent injuries 💪</Text>
        )}
      </View>
    </View>
  );

  const renderNewsTab = () => (
    <View style={styles.tabContent}>
      {/* Latest News */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📰 Latest News</Text>
        {playerData!.news.map((article) => (
          <View key={article.id} style={styles.newsCard}>
            <View style={styles.newsHeader}>
              <View style={[
                styles.impactBadge,
                { backgroundColor: getImpactColor(article.impact) }
              ]}>
                <Text style={styles.impactText}>{article.impact.toUpperCase()}</Text>
              </View>
              <Text style={styles.newsSource}>{article.source}</Text>
              <Text style={styles.newsTime}>{article.timestamp}</Text>
            </View>
            <Text style={styles.newsTitle}>{article.title}</Text>
            <Text style={styles.newsSummary}>{article.summary}</Text>
          </View>
        ))}
      </View>

      {/* Social Media Buzz */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🐦 Social Media Buzz</Text>
        {playerData!.multimedia.map((mention) => (
          <View key={mention.id} style={styles.socialCard}>
            <View style={styles.socialHeader}>
              <Icon name={getMultimediaIcon(mention.type)} size={16} color={getMultimediaColor(mention.type)} />
              <Text style={styles.socialSource}>{mention.source}</Text>
              <View style={[
                styles.sentimentIndicator,
                { backgroundColor: getSentimentColor(mention.sentiment) }
              ]} />
            </View>
            <Text style={styles.socialContent}>{mention.content}</Text>
            <Text style={styles.socialTime}>{mention.timestamp}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={AppTheme.gradients.primary} style={styles.loadingContainer}>
          <Icon name="person" size={60} color="white" />
          <Text style={styles.loadingText}>
            Loading {playerName || 'player'} analysis...
          </Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!playerData) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={AppTheme.gradients.primary} style={styles.errorContainer}>
          <Icon name="error" size={60} color="white" />
          <Text style={styles.errorText}>Failed to load player data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializePlayer}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={AppTheme.gradients.primary} style={styles.gradient}>
        {renderHeader()}
        {renderTabBar()}
        
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
          onScroll={(event) => {
            headerScrollAnim.value = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          {renderTabContent()}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

// Configuration data
const tabs = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'fantasy', label: 'Fantasy', icon: 'sports' },
  { id: 'stats', label: 'Stats', icon: 'bar-chart' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  { id: 'news', label: 'News', icon: 'article' },
];

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy': return '#4ECDC4';
    case 'questionable': return '#FFA726';
    case 'doubtful': return '#FF7043';
    case 'out': case 'injured_reserve': return '#FF6B6B';
    default: return '#9E9E9E';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy': return 'check-circle';
    case 'questionable': return 'help';
    case 'doubtful': return 'warning';
    case 'out': case 'injured_reserve': return 'cancel';
    default: return 'info';
  }
};

const getAdviceColor = (advice: string) => {
  switch (advice) {
    case 'start': return '#4ECDC4';
    case 'flex': return '#FFA726';
    case 'sit': return '#FF6B6B';
    case 'monitor': return '#9C27B0';
    default: return AppTheme.colors.primary;
  }
};

const getAdviceText = (advice: string) => {
  switch (advice) {
    case 'start': return 'Strong Start Recommendation';
    case 'flex': return 'Solid Flex Option';
    case 'sit': return 'Consider Benching';
    case 'monitor': return 'Monitor Status';
    default: return 'Analysis Pending';
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return 'trending-up';
    case 'down': return 'trending-down';
    case 'stable': return 'trending-flat';
    default: return 'trending-flat';
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'up': return '#4ECDC4';
    case 'down': return '#FF6B6B';
    case 'stable': return '#FFA726';
    default: return AppTheme.colors.primary;
  }
};

const getMultimediaIcon = (type: string) => {
  switch (type) {
    case 'podcast': return 'podcast';
    case 'youtube': return 'play-circle-filled';
    case 'twitter': return 'chat';
    default: return 'info';
  }
};

const getMultimediaColor = (type: string) => {
  switch (type) {
    case 'podcast': return '#9C27B0';
    case 'youtube': return '#FF0000';
    case 'twitter': return '#1DA1F2';
    default: return AppTheme.colors.primary;
  }
};

const getSentimentColor = (sentiment: number) => {
  if (sentiment > 0.6) return '#4ECDC4';
  if (sentiment > 0.4) return '#FFA726';
  return '#FF6B6B';
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'positive': return '#4ECDC4';
    case 'negative': return '#FF6B6B';
    case 'neutral': return '#FFA726';
    default: return AppTheme.colors.primary;
  }
};

const formatStatName = (stat: string) => {
  return stat.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const getDetailedAdvice = (advice: string, playerData: PlayerData) => {
  const reasons = [];
  
  if (playerData.fantasyData.projectedPoints > playerData.fantasyData.averagePoints) {
    reasons.push('above-average projection');
  }
  
  if (playerData.analytics.consistency > 0.7) {
    reasons.push('high consistency rating');
  }
  
  if (playerData.status === 'healthy') {
    reasons.push('full health status');
  }
  
  return `${getAdviceText(advice)} based on ${reasons.join(', ')} and comprehensive AI analysis.`;
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
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'white',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    paddingBottom: 20,
  },
  headerGradient: {
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navActions: {
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
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  playerImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  playerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  playerImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerImageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  playerMeta: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  playerPhysical: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  playerCollege: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  adviceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  adviceText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 6,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  recommendationCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  recommendationGradient: {
    padding: 20,
    alignItems: 'center',
  },
  recommendationAdvice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  recommendationReason: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  projectionCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 20,
  },
  projectionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  projectedPoints: {
    fontSize: 32,
    fontWeight: 'bold',
    color: AppTheme.colors.primary,
  },
  projectedLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  projectionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  projectionStat: {
    alignItems: 'center',
  },
  projectionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  projectionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  performanceLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightSource: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  insightTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  insightContent: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
    marginBottom: 8,
  },
  insightFooter: {
    alignItems: 'flex-start',
  },
  sentimentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sentimentText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  analysisCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  analysisGradient: {
    padding: 20,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  adviceBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adviceTextLarge: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  analysisText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
  matchupGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  matchupStat: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  matchupValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppTheme.colors.primary,
  },
  matchupLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  usageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  usageCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 16,
    width: (width - 56) / 2,
    marginBottom: 12,
    alignItems: 'center',
  },
  usageValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  usageLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 16,
    width: (width - 56) / 2,
    marginBottom: 12,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statCardLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  situationalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  situationalCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  situationalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  situationalLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  quarterGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quarterCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  quarterValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  quarterLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 16,
    width: (width - 56) / 2,
    marginBottom: 12,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  analyticsLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  injuryCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  injuryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  injuryType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  injuryDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  injuryDetails: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  noDataText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  newsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  impactText: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  newsSource: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
    flex: 1,
  },
  newsTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  newsSummary: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 16,
  },
  socialCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  socialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  socialSource: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  sentimentIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  socialContent: {
    fontSize: 12,
    color: 'white',
    lineHeight: 16,
    marginBottom: 4,
  },
  socialTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
});

export default PlayerScreen;