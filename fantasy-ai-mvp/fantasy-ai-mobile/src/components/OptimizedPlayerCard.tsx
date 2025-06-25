import React, { memo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Text, Card } from 'react-native-paper';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'react-native-linear-gradient';
import { Player } from '../types';
import { colors, spacing, typography, shadows } from '../theme';

interface OptimizedPlayerCardProps {
  player: Player;
  onPress?: () => void;
  compact?: boolean;
}

const { width } = Dimensions.get('window');

const OptimizedPlayerCard = memo(({ player, onPress, compact = false }: OptimizedPlayerCardProps) => {
  const getHealthColor = (status: Player['status']) => {
    const statusColors = {
      active: colors.tertiary,
      injured: colors.error,
      questionable: colors.warning,
      out: colors.error,
      ir: colors.textDisabled,
    };
    return statusColors[status] || colors.textSecondary;
  };

  const getTrendIcon = (direction: Player['trends']['direction']) => {
    const icons = {
      up: 'trending-up',
      down: 'trending-down',
      stable: 'minus',
    };
    return icons[direction];
  };

  const getTrendColor = (direction: Player['trends']['direction']) => {
    const trendColors = {
      up: colors.tertiary,
      down: colors.error,
      stable: colors.textSecondary,
    };
    return trendColors[direction];
  };

  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Card style={styles.compactCard}>
          <View style={styles.compactContent}>
            <FastImage
              style={styles.compactImage}
              source={{
                uri: player.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=1E293B&color=fff`,
                priority: FastImage.priority.normal,
              }}
              resizeMode={FastImage.resizeMode.cover}
            />
            <View style={styles.compactInfo}>
              <Text style={styles.compactName} numberOfLines={1}>
                {player.name}
              </Text>
              <View style={styles.compactDetails}>
                <Text style={styles.positionTeam}>
                  {player.position} - {player.team}
                </Text>
                <View style={[styles.healthDot, { backgroundColor: getHealthColor(player.status) }]} />
              </View>
            </View>
            <View style={styles.compactStats}>
              <Text style={styles.compactPoints}>{player.stats.averagePoints.toFixed(1)}</Text>
              <Text style={styles.ppgLabel}>PPG</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={[styles.card, shadows.md]}>
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <View style={styles.cardContent}>
            <View style={styles.header}>
              <FastImage
                style={styles.playerImage}
                source={{
                  uri: player.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=1E293B&color=fff`,
                  priority: FastImage.priority.normal,
                  cache: FastImage.cacheControl.immutable,
                }}
                resizeMode={FastImage.resizeMode.cover}
              />
              <View style={styles.playerInfo}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.name}
                </Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.position}>{player.position}</Text>
                  <Text style={styles.team}>{player.team}</Text>
                  <View style={[styles.statusIndicator, { backgroundColor: getHealthColor(player.status) }]} />
                </View>
              </View>
              <View style={styles.statsContainer}>
                <Text style={styles.points}>{player.stats.averagePoints.toFixed(1)}</Text>
                <Text style={styles.pointsLabel}>PPG</Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{player.stats.projected?.toFixed(1) || '--'}</Text>
                <Text style={styles.metricLabel}>Proj</Text>
              </View>
              <View style={styles.metric}>
                <Icon
                  name={getTrendIcon(player.trends.direction)}
                  size={16}
                  color={getTrendColor(player.trends.direction)}
                />
                <Text style={[styles.metricValue, { color: getTrendColor(player.trends.direction) }]}>
                  {player.trends.percentageChange > 0 ? '+' : ''}{player.trends.percentageChange}%
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{player.ownership}%</Text>
                <Text style={styles.metricLabel}>Own</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{player.aiScore}</Text>
                <Text style={styles.metricLabel}>AI</Text>
              </View>
            </View>

            {player.injuryDescription && (
              <View style={styles.injuryRow}>
                <Icon name="medical-bag" size={14} color={colors.warning} />
                <Text style={styles.injuryText} numberOfLines={1}>
                  {player.injuryDescription}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Card>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.player.id === nextProps.player.id &&
    prevProps.player.stats.averagePoints === nextProps.player.stats.averagePoints &&
    prevProps.player.status === nextProps.player.status &&
    prevProps.player.trends.percentageChange === nextProps.player.trends.percentageChange &&
    prevProps.compact === nextProps.compact
  );
});

OptimizedPlayerCard.displayName = 'OptimizedPlayerCard';

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  gradientBackground: {
    borderRadius: 12,
  },
  cardContent: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.sm,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  position: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  team: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsContainer: {
    alignItems: 'center',
  },
  points: {
    ...typography.h2,
    color: colors.text,
  },
  pointsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  injuryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  injuryText: {
    ...typography.caption,
    color: colors.warning,
    marginLeft: spacing.xs,
    flex: 1,
  },
  // Compact styles
  compactCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  compactImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  compactDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  positionTeam: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: spacing.xs,
  },
  compactStats: {
    alignItems: 'center',
  },
  compactPoints: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  ppgLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

export default OptimizedPlayerCard;