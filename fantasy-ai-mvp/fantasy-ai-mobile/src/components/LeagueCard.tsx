import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export interface League {
  id: string;
  name: string;
  platform: 'Yahoo' | 'ESPN' | 'Sleeper' | 'CBS' | 'NFL' | 'Custom';
  teamName: string;
  standing: number;
  totalTeams: number;
  record: {
    wins: number;
    losses: number;
    ties?: number;
  };
  imageUrl?: string;
  isActive?: boolean;
  nextMatchup?: {
    opponent: string;
    date: Date;
  };
  unreadMessages?: number;
  pendingActions?: number;
}

interface LeagueCardProps {
  league: League;
  onPress?: (league: League) => void;
}

const LeagueCard: React.FC<LeagueCardProps> = ({ league, onPress }) => {
  const getPlatformColor = () => {
    switch (league.platform) {
      case 'Yahoo':
        return ['#7B16FF', '#5B0DBB'];
      case 'ESPN':
        return ['#D5001C', '#AA0016'];
      case 'Sleeper':
        return ['#00CEB8', '#00A092'];
      case 'CBS':
        return ['#004B87', '#003966'];
      case 'NFL':
        return ['#013369', '#001E3E'];
      default:
        return ['#00d4ff', '#0099cc'];
    }
  };

  const getStandingColor = () => {
    const percentage = (league.standing / league.totalTeams) * 100;
    if (percentage <= 25) return '#00ff00';
    if (percentage <= 50) return '#ffaa00';
    if (percentage <= 75) return '#ff6600';
    return '#ff0000';
  };

  const formatRecord = () => {
    const { wins, losses, ties } = league.record;
    return ties ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
  };

  const hasNotifications = (league.unreadMessages || 0) + (league.pendingActions || 0) > 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(league)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getPlatformColor()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={{ uri: league.imageUrl || 'https://via.placeholder.com/50' }}
              style={styles.leagueLogo}
            />
            <View style={styles.headerText}>
              <Text style={styles.leagueName} numberOfLines={1}>
                {league.name}
              </Text>
              <View style={styles.platformBadge}>
                <Text style={styles.platformText}>{league.platform}</Text>
              </View>
            </View>
          </View>
          {hasNotifications && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>
                {(league.unreadMessages || 0) + (league.pendingActions || 0)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Team</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {league.teamName}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Standing</Text>
            <View style={styles.standingContainer}>
              <Text style={[styles.statValue, { color: getStandingColor() }]}>
                {league.standing}
              </Text>
              <Text style={styles.standingTotal}>/{league.totalTeams}</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Record</Text>
            <Text style={styles.statValue}>{formatRecord()}</Text>
          </View>
        </View>

        {league.nextMatchup && (
          <View style={styles.nextMatchup}>
            <Ionicons name="calendar" size={16} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.nextMatchupText}>
              vs {league.nextMatchup.opponent} •{' '}
              {league.nextMatchup.date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          {league.unreadMessages ? (
            <View style={styles.footerItem}>
              <Ionicons name="chatbubbles" size={16} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.footerText}>{league.unreadMessages} new</Text>
            </View>
          ) : null}
          {league.pendingActions ? (
            <View style={styles.footerItem}>
              <Ionicons name="warning" size={16} color="#ffe66d" />
              <Text style={[styles.footerText, { color: '#ffe66d' }]}>
                {league.pendingActions} actions needed
              </Text>
            </View>
          ) : null}
          {!league.unreadMessages && !league.pendingActions && (
            <View style={styles.footerItem}>
              <Ionicons name="checkmark-circle" size={16} color="#00ff00" />
              <Text style={[styles.footerText, { color: '#00ff00' }]}>
                All caught up
              </Text>
            </View>
          )}
        </View>
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leagueLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  platformBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  platformText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  notificationBadge: {
    backgroundColor: '#ff0000',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  standingContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  standingTotal: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 12,
  },
  nextMatchup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  nextMatchupText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
});

export default LeagueCard;