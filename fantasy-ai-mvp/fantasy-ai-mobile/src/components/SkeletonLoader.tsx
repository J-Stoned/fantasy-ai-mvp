import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ViewStyle,
} from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { colors, spacing } from '../theme';

const { width } = Dimensions.get('window');

interface SkeletonLoaderProps {
  type: 'player' | 'league' | 'insight' | 'lineup' | 'custom';
  count?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type,
  count = 3,
  style,
  children,
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'player':
        return <PlayerSkeleton />;
      case 'league':
        return <LeagueSkeleton />;
      case 'insight':
        return <InsightSkeleton />;
      case 'lineup':
        return <LineupSkeleton />;
      case 'custom':
        return children;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonPlaceholder
          key={index}
          backgroundColor={colors.surface}
          highlightColor={colors.surfaceVariant}
          speed={1200}
        >
          {renderSkeleton()}
        </SkeletonPlaceholder>
      ))}
    </View>
  );
};

const PlayerSkeleton = () => (
  <View style={styles.playerCard}>
    <View style={styles.playerHeader}>
      <View style={styles.playerAvatar} />
      <View style={styles.playerInfo}>
        <View style={styles.playerName} />
        <View style={styles.playerDetails} />
      </View>
      <View style={styles.playerStats} />
    </View>
    <View style={styles.playerMetrics}>
      <View style={styles.metric} />
      <View style={styles.metric} />
      <View style={styles.metric} />
      <View style={styles.metric} />
    </View>
  </View>
);

const LeagueSkeleton = () => (
  <View style={styles.leagueCard}>
    <View style={styles.leagueAvatar} />
    <View style={styles.leagueName} />
    <View style={styles.leagueStats} />
  </View>
);

const InsightSkeleton = () => (
  <View style={styles.insightCard}>
    <View style={styles.insightHeader}>
      <View style={styles.insightIcon} />
      <View style={styles.insightTitle} />
    </View>
    <View style={styles.insightContent} />
    <View style={styles.insightAction} />
  </View>
);

const LineupSkeleton = () => (
  <View style={styles.lineupContainer}>
    {Array.from({ length: 9 }).map((_, index) => (
      <View key={index} style={styles.lineupSlot}>
        <View style={styles.positionLabel} />
        <View style={styles.playerSlot} />
      </View>
    ))}
  </View>
);

// Animated skeleton for loading states
export const AnimatedSkeleton: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SkeletonPlaceholder
      backgroundColor={colors.surface}
      highlightColor={colors.surfaceVariant}
      speed={1200}
    >
      {children}
    </SkeletonPlaceholder>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Player skeleton
  playerCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.sm,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    width: 120,
    height: 20,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  playerDetails: {
    width: 80,
    height: 16,
    borderRadius: 4,
  },
  playerStats: {
    width: 50,
    height: 40,
    borderRadius: 8,
  },
  playerMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  metric: {
    width: 40,
    height: 30,
    borderRadius: 4,
  },
  // League skeleton
  leagueCard: {
    width: 150,
    height: 180,
    marginRight: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  leagueAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: spacing.sm,
  },
  leagueName: {
    width: 100,
    height: 20,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  leagueStats: {
    width: 80,
    height: 16,
    borderRadius: 4,
  },
  // Insight skeleton
  insightCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  insightIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  insightTitle: {
    width: 200,
    height: 20,
    borderRadius: 4,
  },
  insightContent: {
    width: '100%',
    height: 60,
    borderRadius: 4,
    marginVertical: spacing.sm,
  },
  insightAction: {
    width: 100,
    height: 36,
    borderRadius: 18,
    alignSelf: 'flex-end',
  },
  // Lineup skeleton
  lineupContainer: {
    padding: spacing.md,
  },
  lineupSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  positionLabel: {
    width: 30,
    height: 20,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  playerSlot: {
    flex: 1,
    height: 60,
    borderRadius: 8,
  },
});