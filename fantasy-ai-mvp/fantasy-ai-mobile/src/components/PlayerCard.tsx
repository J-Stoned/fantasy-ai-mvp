import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  imageUrl?: string;
  points?: number;
  projectedPoints?: number;
  status?: 'healthy' | 'questionable' | 'doubtful' | 'out';
  trend?: 'up' | 'down' | 'stable';
  stats?: {
    [key: string]: number | string;
  };
}

interface PlayerCardProps {
  player: Player;
  onPress?: (player: Player) => void;
  showStats?: boolean;
  style?: ViewStyle;
  compact?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onPress,
  showStats = true,
  style,
  compact = false,
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return '#00ff00';
      case 'questionable':
        return '#ffaa00';
      case 'doubtful':
        return '#ff6600';
      case 'out':
        return '#ff0000';
      default:
        return '#00ff00';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return '#00ff00';
      case 'down':
        return '#ff0000';
      default:
        return '#666';
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, style]}
        onPress={() => onPress?.(player)}
        activeOpacity={0.8}
      >
        <View style={styles.compactLeft}>
          <Image
            source={{ uri: player.imageUrl || 'https://via.placeholder.com/40' }}
            style={styles.compactImage}
          />
          <View style={styles.compactInfo}>
            <Text style={styles.compactName} numberOfLines={1}>
              {player.name}
            </Text>
            <Text style={styles.compactDetails}>
              {player.position} • {player.team}
            </Text>
          </View>
        </View>
        <View style={styles.compactRight}>
          {player.points !== undefined && (
            <Text style={styles.compactPoints}>{player.points.toFixed(1)}</Text>
          )}
          <Ionicons
            name={getTrendIcon(player.trend)}
            size={16}
            color={getTrendColor(player.trend)}
          />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onPress?.(player)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#2a2a2a', '#1a1a1a']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Image
            source={{ uri: player.imageUrl || 'https://via.placeholder.com/60' }}
            style={styles.image}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {player.name}
            </Text>
            <View style={styles.detailsRow}>
              <Text style={styles.position}>{player.position}</Text>
              <Text style={styles.team}>{player.team}</Text>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(player.status) },
                ]}
              />
            </View>
          </View>
          <Ionicons
            name={getTrendIcon(player.trend)}
            size={24}
            color={getTrendColor(player.trend)}
          />
        </View>

        {showStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Points</Text>
              <Text style={styles.statValue}>
                {player.points?.toFixed(1) || '0.0'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Projected</Text>
              <Text style={styles.statValue}>
                {player.projectedPoints?.toFixed(1) || '0.0'}
              </Text>
            </View>
            {player.stats && Object.keys(player.stats).length > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>
                    {Object.keys(player.stats)[0]}
                  </Text>
                  <Text style={styles.statValue}>
                    {Object.values(player.stats)[0]}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  position: {
    fontSize: 14,
    color: '#00d4ff',
    fontWeight: '600',
    marginRight: 8,
  },
  team: {
    fontSize: 14,
    color: '#888',
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#333',
    marginHorizontal: 16,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  compactInfo: {
    marginLeft: 12,
    flex: 1,
  },
  compactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  compactDetails: {
    fontSize: 12,
    color: '#888',
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
});

export default PlayerCard;