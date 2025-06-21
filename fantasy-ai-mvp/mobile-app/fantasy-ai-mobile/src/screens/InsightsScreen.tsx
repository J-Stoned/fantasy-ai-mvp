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
  Share,
  Linking,
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

import { FantasyAPIService } from '../services/FantasyAPIService';
import { VoiceService } from '../services/VoiceService';
import { HapticService } from '../services/HapticService';
import { AppTheme } from '../theme/AppTheme';
import { useAppStore } from '../store/AppStore';

const { width, height } = Dimensions.get('window');

interface MultimediaInsight {
  id: string;
  type: 'podcast' | 'youtube' | 'twitter' | 'reddit' | 'news' | 'instagram';
  source: string;
  author: string;
  title: string;
  description: string;
  content: string;
  url: string;
  thumbnail?: string;
  timestamp: string;
  duration?: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  relevantPlayers: string[];
  fantasyImpact: 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'negative' | 'neutral';
  category: 'injury' | 'trade' | 'performance' | 'lineup' | 'general';
  aiSummary: string;
  keyQuotes: string[];
  actionable: boolean;
}

interface TrendingTopic {
  id: string;
  keyword: string;
  mentions: number;
  sentiment: number;
  trend: 'rising' | 'falling' | 'stable';
  relatedPlayers: string[];
}

const InsightsScreen: React.FC = () => {
  const [insights, setInsights] = useState<MultimediaInsight[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<MultimediaInsight | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(100);
  const filterAnim = useSharedValue(0);

  const { currentUser, isVoiceEnabled } = useAppStore();

  useEffect(() => {
    initializeInsights();
    startAnimations();
  }, []);

  const initializeInsights = async () => {
    try {
      setIsLoading(true);
      
      // Parallel data fetching for maximum speed
      const [insightsData, topicsData] = await Promise.all([
        FantasyAPIService.getMultimediaInsights(),
        FantasyAPIService.getTrendingTopics()
      ]);

      setInsights(insightsData);
      setTrendingTopics(topicsData);
    } catch (error) {
      console.error('Insights initialization error:', error);
      Alert.alert('Error', 'Failed to load insights data');
    } finally {
      setIsLoading(false);
    }
  };

  const startAnimations = () => {
    fadeAnim.value = withTiming(1, { duration: 800 });
    slideAnim.value = withSpring(0, { damping: 20 });
    filterAnim.value = withSpring(1, { damping: 15 });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    HapticService.impact('light');
    await initializeInsights();
    setRefreshing(false);
  }, []);

  const handleVoiceCommand = async () => {
    try {
      HapticService.impact('medium');
      const command = await VoiceService.startListening();
      
      // Process insights-specific voice commands
      if (command.includes('injury') || command.includes('injuries')) {
        setSelectedCategory('injury');
      } else if (command.includes('trade') || command.includes('trades')) {
        setSelectedCategory('trade');
      } else if (command.includes('lineup') || command.includes('start')) {
        setSelectedCategory('lineup');
      } else if (command.includes('refresh') || command.includes('update')) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Voice command error:', error);
    }
  };

  const handleInsightPress = (insight: MultimediaInsight) => {
    setSelectedInsight(insight);
    setShowDetail(true);
    HapticService.impact('light');
  };

  const handleShare = async (insight: MultimediaInsight) => {
    try {
      await Share.share({
        title: insight.title,
        message: `${insight.title}\n\n${insight.aiSummary}\n\nShared from Fantasy.AI`,
        url: insight.url,
      });
      HapticService.success();
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        HapticService.impact('light');
      }
    } catch (error) {
      console.error('Link opening error:', error);
    }
  };

  const filteredInsights = insights.filter(insight => 
    selectedCategory === 'all' || insight.category === selectedCategory
  );

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
            <Text style={styles.headerTitle}>🎙️ Fantasy Buzz</Text>
            <Text style={styles.headerSubtitle}>
              {insights.length} insights • Real-time analysis
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
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderTrendingTopics = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {trendingTopics.map((topic, index) => (
          <TouchableOpacity key={topic.id} style={styles.topicCard}>
            <LinearGradient
              colors={[getTrendColor(topic.trend) + '40', getTrendColor(topic.trend) + '20']}
              style={styles.topicCardGradient}
            >
              <Text style={styles.topicKeyword}>#{topic.keyword}</Text>
              <Text style={styles.topicMentions}>{topic.mentions} mentions</Text>
              <View style={styles.topicStats}>
                <Icon 
                  name={getTrendIcon(topic.trend)} 
                  size={16} 
                  color={getTrendColor(topic.trend)} 
                />
                <Text style={[styles.topicSentiment, { color: getSentimentColor(topic.sentiment) }]}>
                  {(topic.sentiment * 100).toFixed(0)}%
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFilterTabs = () => (
    <Animated.View style={[styles.filterContainer, { opacity: filterAnim.value }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.filterTab,
              selectedCategory === category.id && styles.filterTabActive
            ]}
            onPress={() => {
              setSelectedCategory(category.id);
              HapticService.impact('light');
            }}
          >
            <Icon 
              name={category.icon} 
              size={18} 
              color={selectedCategory === category.id ? 'white' : 'rgba(255,255,255,0.7)'} 
            />
            <Text style={[
              styles.filterTabText,
              selectedCategory === category.id && styles.filterTabTextActive
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderInsightCard = (insight: MultimediaInsight, index: number) => (
    <TouchableOpacity 
      key={insight.id} 
      style={styles.insightCard}
      onPress={() => handleInsightPress(insight)}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.insightCardGradient}
      >
        <View style={styles.insightHeader}>
          <View style={styles.insightMeta}>
            <Icon 
              name={getInsightTypeIcon(insight.type)} 
              size={20} 
              color={getInsightTypeColor(insight.type)} 
            />
            <Text style={styles.insightSource}>{insight.source}</Text>
            <Text style={styles.insightTime}>{insight.timestamp}</Text>
          </View>
          
          <View style={styles.insightActions}>
            <View style={[
              styles.impactBadge,
              { backgroundColor: getImpactColor(insight.fantasyImpact) }
            ]}>
              <Text style={styles.impactText}>{insight.fantasyImpact.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightDescription}>{insight.description}</Text>

        <View style={styles.aiSummaryContainer}>
          <Icon name="smart-toy" size={16} color={AppTheme.colors.primary} />
          <Text style={styles.aiSummaryText}>{insight.aiSummary}</Text>
        </View>

        {insight.keyQuotes.length > 0 && (
          <View style={styles.quotesContainer}>
            <Text style={styles.quotesTitle}>💬 Key Quotes:</Text>
            {insight.keyQuotes.slice(0, 2).map((quote, qIndex) => (
              <Text key={qIndex} style={styles.quoteText}>
                "{quote}"
              </Text>
            ))}
          </View>
        )}

        {insight.relevantPlayers.length > 0 && (
          <View style={styles.playersContainer}>
            <Text style={styles.playersTitle}>🏈 Players:</Text>
            <View style={styles.playerTags}>
              {insight.relevantPlayers.slice(0, 3).map((player, pIndex) => (
                <View key={pIndex} style={styles.playerTag}>
                  <Text style={styles.playerTagText}>{player}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.insightFooter}>
          <View style={styles.engagementStats}>
            <View style={styles.statItem}>
              <Icon name="favorite" size={14} color="#FF6B6B" />
              <Text style={styles.statText}>{formatNumber(insight.engagement.likes)}</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="comment" size={14} color="#4ECDC4" />
              <Text style={styles.statText}>{formatNumber(insight.engagement.comments)}</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="share" size={14} color="#FFA726" />
              <Text style={styles.statText}>{formatNumber(insight.engagement.shares)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => handleShare(insight)}
          >
            <Icon name="share" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderInsightsList = () => (
    <Animated.View style={[styles.sectionContainer, animatedContainerStyle]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === 'all' ? 'All Insights' : categories.find(c => c.id === selectedCategory)?.label}
        </Text>
        <Text style={styles.resultsCount}>
          {filteredInsights.length} insights
        </Text>
      </View>

      {filteredInsights.map((insight, index) => renderInsightCard(insight, index))}
    </Animated.View>
  );

  const renderDetailModal = () => (
    <Modal
      visible={showDetail}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDetail(false)}
    >
      {selectedInsight && (
        <SafeAreaView style={styles.modalContainer}>
          <LinearGradient colors={AppTheme.gradients.primary} style={styles.modalGradient}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowDetail(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleShare(selectedInsight)}
                style={styles.modalShareButton}
              >
                <Icon name="share" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedInsight.title}</Text>
              <Text style={styles.modalSource}>
                {selectedInsight.source} • {selectedInsight.author}
              </Text>

              <View style={styles.modalMeta}>
                <View style={styles.modalMetaItem}>
                  <Icon name="schedule" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.modalMetaText}>{selectedInsight.timestamp}</Text>
                </View>
                {selectedInsight.duration && (
                  <View style={styles.modalMetaItem}>
                    <Icon name="play-circle-filled" size={16} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.modalMetaText}>{selectedInsight.duration}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.modalContent}>{selectedInsight.content}</Text>

              <View style={styles.modalAiSection}>
                <Text style={styles.modalAiTitle}>🤖 AI Analysis</Text>
                <Text style={styles.modalAiText}>{selectedInsight.aiSummary}</Text>
              </View>

              {selectedInsight.keyQuotes.length > 0 && (
                <View style={styles.modalQuotesSection}>
                  <Text style={styles.modalQuotesTitle}>💬 Key Quotes</Text>
                  {selectedInsight.keyQuotes.map((quote, index) => (
                    <View key={index} style={styles.modalQuoteItem}>
                      <Text style={styles.modalQuoteText}>"{quote}"</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.openLinkButton}
                onPress={() => handleOpenLink(selectedInsight.url)}
              >
                <Icon name="open-in-new" size={20} color="white" />
                <Text style={styles.openLinkText}>View Original</Text>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </SafeAreaView>
      )}
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={AppTheme.gradients.primary} style={styles.loadingContainer}>
          <Icon name="podcasts" size={60} color="white" />
          <Text style={styles.loadingText}>Analyzing the fantasy universe...</Text>
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
          {renderTrendingTopics()}
          {renderFilterTabs()}
          {renderInsightsList()}
        </ScrollView>
        
        {renderDetailModal()}
      </LinearGradient>
    </SafeAreaView>
  );
};

// Configuration data
const categories = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'injury', label: 'Injuries', icon: 'healing' },
  { id: 'trade', label: 'Trades', icon: 'swap-horiz' },
  { id: 'performance', label: 'Performance', icon: 'trending-up' },
  { id: 'lineup', label: 'Lineups', icon: 'sports' },
  { id: 'general', label: 'News', icon: 'article' },
];

// Helper functions
const getInsightTypeIcon = (type: string) => {
  switch (type) {
    case 'podcast': return 'podcast';
    case 'youtube': return 'play-circle-filled';
    case 'twitter': return 'chat';
    case 'reddit': return 'forum';
    case 'news': return 'article';
    case 'instagram': return 'photo-camera';
    default: return 'info';
  }
};

const getInsightTypeColor = (type: string) => {
  switch (type) {
    case 'podcast': return '#9C27B0';
    case 'youtube': return '#FF0000';
    case 'twitter': return '#1DA1F2';
    case 'reddit': return '#FF4500';
    case 'news': return '#4CAF50';
    case 'instagram': return '#E4405F';
    default: return AppTheme.colors.primary;
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high': return '#FF6B6B';
    case 'medium': return '#FFA726';
    case 'low': return '#4ECDC4';
    default: return AppTheme.colors.primary;
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'rising': return 'trending-up';
    case 'falling': return 'trending-down';
    case 'stable': return 'trending-flat';
    default: return 'trending-flat';
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'rising': return '#4ECDC4';
    case 'falling': return '#FF6B6B';
    case 'stable': return '#FFA726';
    default: return AppTheme.colors.primary;
  }
};

const getSentimentColor = (sentiment: number) => {
  if (sentiment > 0.6) return '#4ECDC4';
  if (sentiment > 0.4) return '#FFA726';
  return '#FF6B6B';
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
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
  resultsCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  topicCard: {
    width: 120,
    marginRight: 12,
  },
  topicCardGradient: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 80,
  },
  topicKeyword: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  topicMentions: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  topicStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicSentiment: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  filterContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    marginRight: 12,
  },
  filterTabActive: {
    backgroundColor: AppTheme.colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 6,
  },
  filterTabTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  insightCard: {
    marginBottom: 16,
  },
  insightCardGradient: {
    padding: 16,
    borderRadius: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  insightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  impactText: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    lineHeight: 22,
  },
  insightDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
    lineHeight: 20,
  },
  aiSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  aiSummaryText: {
    fontSize: 13,
    color: 'white',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  quotesContainer: {
    marginBottom: 12,
  },
  quotesTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  quoteText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontStyle: 'italic',
    marginBottom: 4,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: AppTheme.colors.primary,
  },
  playersContainer: {
    marginBottom: 12,
  },
  playersTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  playerTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  playerTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  playerTagText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  engagementStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalGradient: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalShareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    lineHeight: 28,
  },
  modalSource: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  modalMeta: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modalMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  modalMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 6,
  },
  modalContentText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalAiSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalAiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  modalAiText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
  modalQuotesSection: {
    marginBottom: 20,
  },
  modalQuotesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  modalQuoteItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalQuoteText: {
    fontSize: 14,
    color: 'white',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  openLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  openLinkText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default InsightsScreen;