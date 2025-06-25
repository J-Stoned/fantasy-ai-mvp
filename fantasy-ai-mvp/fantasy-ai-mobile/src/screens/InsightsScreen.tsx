import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Avatar,
  ActivityIndicator,
  IconButton,
  FAB,
  SegmentedButtons,
  ProgressBar,
  Badge,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { AIInsight } from '../types';
import { colors, spacing, typography, shadows, glowStyles } from '../theme';

type InsightFilter = 'all' | 'trade' | 'lineup' | 'waiver' | 'injury' | 'trend' | 'matchup';

export default function InsightsScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<InsightFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Pulse animation for high priority insights
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Fetch AI insights
  const { data: insights, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => api.getAIInsights(),
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Filter insights
  const filteredInsights = React.useMemo(() => {
    if (!insights) return [];
    if (filter === 'all') return insights;
    return insights.filter(insight => insight.type === filter);
  }, [insights, filter]);

  // Group insights by priority
  const groupedInsights = React.useMemo(() => {
    const groups = {
      high: [] as AIInsight[],
      medium: [] as AIInsight[],
      low: [] as AIInsight[],
    };

    filteredInsights.forEach(insight => {
      groups[insight.priority].push(insight);
    });

    return groups;
  }, [filteredInsights]);

  const getInsightIcon = (type: AIInsight['type']) => {
    const icons = {
      trade: 'swap-horizontal',
      lineup: 'clipboard-text',
      waiver: 'plus-circle',
      injury: 'medical-bag',
      trend: 'trending-up',
      matchup: 'sword-cross',
    };
    return icons[type] || 'lightbulb';
  };

  const getInsightColor = (type: AIInsight['type']) => {
    const typeColors = {
      trade: colors.primary,
      lineup: colors.secondary,
      waiver: colors.tertiary,
      injury: colors.error,
      trend: colors.warning,
      matchup: colors.info,
    };
    return typeColors[type] || colors.primary;
  };

  const getPriorityStyle = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high':
        return {
          borderColor: colors.error,
          borderWidth: 2,
          ...glowStyles.neonPink,
        };
      case 'medium':
        return {
          borderColor: colors.warning,
          borderWidth: 1,
        };
      case 'low':
        return {
          borderColor: colors.surfaceVariant,
          borderWidth: 1,
        };
    }
  };

  const renderInsightCard = (insight: AIInsight, isHighPriority: boolean) => {
    const isExpanded = expandedId === insight.id;
    
    return (
      <TouchableOpacity
        key={insight.id}
        onPress={() => setExpandedId(isExpanded ? null : insight.id)}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            { opacity: fadeAnim },
            isHighPriority && {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Card style={[styles.insightCard, getPriorityStyle(insight.priority), shadows.md]}>
            <Card.Content>
              <View style={styles.insightHeader}>
                <Avatar.Icon
                  size={40}
                  icon={getInsightIcon(insight.type)}
                  style={[styles.insightIcon, { backgroundColor: getInsightColor(insight.type) }]}
                />
                <View style={styles.insightHeaderInfo}>
                  <View style={styles.insightTitleRow}>
                    <Text style={styles.insightTitle} numberOfLines={isExpanded ? undefined : 1}>
                      {insight.title}
                    </Text>
                    {insight.priority === 'high' && (
                      <Badge size={8} style={styles.priorityBadge} />
                    )}
                  </View>
                  <View style={styles.insightMeta}>
                    <Chip
                      mode="flat"
                      compact
                      style={[styles.typeChip, { backgroundColor: getInsightColor(insight.type) }]}
                      textStyle={styles.chipText}
                    >
                      {insight.type.toUpperCase()}
                    </Chip>
                    <Text style={styles.confidenceText}>
                      {(insight.confidence * 100).toFixed(0)}% confident
                    </Text>
                  </View>
                </View>
                <IconButton
                  icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  onPress={() => setExpandedId(isExpanded ? null : insight.id)}
                />
              </View>

              <Text 
                style={styles.insightDescription} 
                numberOfLines={isExpanded ? undefined : 2}
              >
                {insight.description}
              </Text>

              {isExpanded && (
                <Animated.View style={styles.expandedContent}>
                  <View style={styles.impactSection}>
                    <Icon name="chart-line" size={16} color={colors.tertiary} />
                    <Text style={styles.impactLabel}>Expected Impact:</Text>
                    <Text style={styles.impactValue}>{insight.impact}</Text>
                  </View>

                  <ProgressBar
                    progress={insight.confidence}
                    color={colors.primary}
                    style={styles.confidenceBar}
                  />

                  {insight.actionable && insight.action && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        // Handle action based on type
                        switch (insight.action.type) {
                          case 'trade':
                            navigation.navigate('TradeWizard', { insight });
                            break;
                          case 'start':
                          case 'bench':
                            navigation.navigate('LineupBuilder', { insight });
                            break;
                          case 'add':
                          case 'drop':
                            navigation.navigate('WaiverWire', { insight });
                            break;
                        }
                      }}
                    >
                      <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.actionGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Icon name="rocket-launch" size={20} color={colors.text} />
                        <Text style={styles.actionText}>
                          Take Action: {insight.action.type.toUpperCase()}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {insight.expiresAt && (
                    <View style={styles.expiryInfo}>
                      <Icon name="clock-alert" size={14} color={colors.warning} />
                      <Text style={styles.expiryText}>
                        Expires in {Math.floor((new Date(insight.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))} hours
                      </Text>
                    </View>
                  )}
                </Animated.View>
              )}
            </Card.Content>
          </Card>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>Failed to load insights</Text>
        <Button mode="contained" onPress={() => refetch()} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Insights</Text>
          <Text style={styles.headerSubtitle}>
            {insights?.length || 0} Active Recommendations
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'trade', 'lineup', 'waiver', 'injury', 'trend', 'matchup'] as InsightFilter[]).map((type) => (
            <Chip
              key={type}
              mode={filter === type ? 'flat' : 'outlined'}
              onPress={() => setFilter(type)}
              style={[
                styles.filterChip,
                filter === type && styles.activeFilterChip,
              ]}
              textStyle={filter === type ? styles.activeFilterText : styles.filterText}
            >
              {type === 'all' ? 'All Insights' : type.charAt(0).toUpperCase() + type.slice(1)}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analyzing your leagues...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {filteredInsights.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="brain" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No insights available</Text>
              <Text style={styles.emptySubtext}>
                {filter !== 'all' 
                  ? `No ${filter} insights at the moment`
                  : 'Check back later for AI recommendations'}
              </Text>
            </View>
          ) : (
            <>
              {groupedInsights.high.length > 0 && (
                <View style={styles.prioritySection}>
                  <View style={styles.sectionHeader}>
                    <Icon name="alert-circle" size={24} color={colors.error} />
                    <Text style={styles.sectionTitle}>High Priority</Text>
                    <Badge size={20} style={styles.countBadge}>
                      {groupedInsights.high.length}
                    </Badge>
                  </View>
                  {groupedInsights.high.map(insight => renderInsightCard(insight, true))}
                </View>
              )}

              {groupedInsights.medium.length > 0 && (
                <View style={styles.prioritySection}>
                  <View style={styles.sectionHeader}>
                    <Icon name="information" size={24} color={colors.warning} />
                    <Text style={styles.sectionTitle}>Medium Priority</Text>
                    <Badge size={20} style={styles.countBadge}>
                      {groupedInsights.medium.length}
                    </Badge>
                  </View>
                  {groupedInsights.medium.map(insight => renderInsightCard(insight, false))}
                </View>
              )}

              {groupedInsights.low.length > 0 && (
                <View style={styles.prioritySection}>
                  <View style={styles.sectionHeader}>
                    <Icon name="lightbulb-outline" size={24} color={colors.info} />
                    <Text style={styles.sectionTitle}>FYI</Text>
                    <Badge size={20} style={styles.countBadge}>
                      {groupedInsights.low.length}
                    </Badge>
                  </View>
                  {groupedInsights.low.map(insight => renderInsightCard(insight, false))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      <FAB
        style={styles.fab}
        icon="microphone"
        onPress={() => navigation.navigate('VoiceAssistant')}
        label="Ask AI"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body1,
    color: colors.text,
    opacity: 0.8,
  },
  filterContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  filterChip: {
    marginRight: spacing.sm,
    backgroundColor: 'transparent',
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
  },
  activeFilterText: {
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  prioritySection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.surfaceVariant,
  },
  insightCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  insightIcon: {
    marginRight: spacing.md,
  },
  insightHeaderInfo: {
    flex: 1,
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
  },
  priorityBadge: {
    backgroundColor: colors.error,
    marginLeft: spacing.sm,
  },
  insightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  typeChip: {
    height: 20,
  },
  chipText: {
    fontSize: 10,
    color: colors.text,
  },
  confidenceText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  insightDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  impactSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  impactLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  impactValue: {
    ...typography.body2,
    color: colors.tertiary,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  confidenceBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceVariant,
    marginBottom: spacing.md,
  },
  actionButton: {
    marginTop: spacing.sm,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actionText: {
    ...typography.button,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  expiryText: {
    ...typography.caption,
    color: colors.warning,
    marginLeft: spacing.xs,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.h4,
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});