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
  Divider,
  ActivityIndicator,
  FAB,
  Portal,
  Modal,
  Button,
  Menu,
  IconButton,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { League } from '../types';
import { colors, spacing, typography, shadows } from '../theme';

type FilterType = 'all' | 'redraft' | 'dynasty' | 'keeper' | 'dfs';
type SortBy = 'rank' | 'points' | 'name';

export default function LeaguesScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('rank');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Fetch user's leagues
  const { data: leagues, isLoading, error, refetch } = useQuery({
    queryKey: ['leagues'],
    queryFn: () => api.getLeagues(),
  });

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Filter and sort leagues
  const processedLeagues = React.useMemo(() => {
    if (!leagues) return [];

    let filtered = leagues;
    if (filterType !== 'all') {
      filtered = leagues.filter(league => league.type === filterType);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return a.userRank - b.userRank;
        case 'points':
          return b.userPoints - a.userPoints;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [leagues, filterType, sortBy]);

  const getPlatformIcon = (platform: League['platform']) => {
    const icons = {
      yahoo: 'yahoo',
      espn: 'basketball',
      sleeper: 'sleep',
      cbs: 'television-classic',
      nfl: 'football',
      draftkings: 'crown',
      fanduel: 'cash',
    };
    return icons[platform] || 'trophy';
  };

  const getTypeColor = (type: League['type']) => {
    const typeColors = {
      redraft: colors.primary,
      dynasty: colors.secondary,
      keeper: colors.tertiary,
      bestball: colors.warning,
      dfs: colors.neonPink,
    };
    return typeColors[type] || colors.primary;
  };

  const renderLeagueCard = (league: League) => (
    <TouchableOpacity
      key={league.id}
      onPress={() => navigation.navigate('LeagueDetail', { leagueId: league.id })}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          { opacity: fadeAnim },
          {
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          },
        ]}
      >
        <Card style={[styles.leagueCard, shadows.md]}>
          <LinearGradient
            colors={[league.color || colors.primary, 'transparent']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            opacity={0.1}
          />
          
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Avatar.Icon
                size={48}
                icon={getPlatformIcon(league.platform)}
                style={[styles.avatar, { backgroundColor: league.color || colors.primary }]}
              />
              <View style={styles.headerInfo}>
                <Text style={styles.leagueName} numberOfLines={1}>
                  {league.name}
                </Text>
                <View style={styles.chipContainer}>
                  <Chip
                    mode="flat"
                    compact
                    style={[styles.typeChip, { backgroundColor: getTypeColor(league.type) }]}
                    textStyle={styles.chipText}
                  >
                    {league.type.toUpperCase()}
                  </Chip>
                  <Chip
                    mode="flat"
                    compact
                    style={styles.platformChip}
                    textStyle={styles.chipText}
                  >
                    {league.platform.toUpperCase()}
                  </Chip>
                </View>
              </View>
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => {/* Handle menu */}}
                style={styles.menuButton}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Icon name="trophy" size={20} color={colors.warning} />
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>
                    {league.userRank}/{league.totalTeams}
                  </Text>
                  <Text style={styles.statLabel}>Rank</Text>
                </View>
              </View>

              <View style={styles.statItem}>
                <Icon name="trending-up" size={20} color={colors.tertiary} />
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{league.userPoints.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
              </View>

              <View style={styles.statItem}>
                <Icon name="calendar" size={20} color={colors.info} />
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>Week {league.currentWeek}</Text>
                  <Text style={styles.statLabel}>{league.playoffs ? 'Playoffs' : 'Regular'}</Text>
                </View>
              </View>
            </View>

            {league.matchup && (
              <View style={styles.matchupPreview}>
                <Text style={styles.matchupLabel}>Current Matchup</Text>
                <View style={styles.matchupInfo}>
                  <Text style={styles.matchupScore}>
                    {league.matchup.userScore.toFixed(1)}
                  </Text>
                  <Text style={styles.matchupVs}>vs</Text>
                  <Text style={styles.matchupScore}>
                    {league.matchup.opponentScore.toFixed(1)}
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      </Animated.View>
    </TouchableOpacity>
  );

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>Failed to load leagues</Text>
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
          <Text style={styles.headerTitle}>My Leagues</Text>
          <Text style={styles.headerSubtitle}>
            {leagues?.length || 0} Active Leagues
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'redraft', 'dynasty', 'keeper', 'dfs'] as FilterType[]).map((type) => (
            <Chip
              key={type}
              mode={filterType === type ? 'flat' : 'outlined'}
              onPress={() => setFilterType(type)}
              style={[
                styles.filterChip,
                filterType === type && styles.activeFilterChip,
              ]}
              textStyle={filterType === type ? styles.activeFilterText : styles.filterText}
            >
              {type === 'all' ? 'All Leagues' : type.toUpperCase()}
            </Chip>
          ))}
        </ScrollView>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="sort"
              size={24}
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setSortBy('rank');
              setMenuVisible(false);
            }}
            title="Sort by Rank"
            leadingIcon="trophy"
          />
          <Menu.Item
            onPress={() => {
              setSortBy('points');
              setMenuVisible(false);
            }}
            title="Sort by Points"
            leadingIcon="trending-up"
          />
          <Menu.Item
            onPress={() => {
              setSortBy('name');
              setMenuVisible(false);
            }}
            title="Sort by Name"
            leadingIcon="alphabetical"
          />
        </Menu>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your leagues...</Text>
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
          {processedLeagues.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="trophy-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No leagues found</Text>
              <Text style={styles.emptySubtext}>
                {filterType !== 'all' 
                  ? `No ${filterType} leagues in your account`
                  : 'Join a league to get started'}
              </Text>
            </View>
          ) : (
            processedLeagues.map(renderLeagueCard)
          )}
        </ScrollView>
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('JoinLeague')}
        label="Join League"
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
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
  leagueCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  cardContent: {
    padding: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatar: {
    marginRight: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  leagueName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  typeChip: {
    height: 24,
  },
  platformChip: {
    height: 24,
    backgroundColor: colors.surfaceVariant,
  },
  chipText: {
    fontSize: 10,
    color: colors.text,
  },
  menuButton: {
    margin: 0,
  },
  divider: {
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statInfo: {
    marginLeft: spacing.sm,
  },
  statValue: {
    ...typography.h4,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  matchupPreview: {
    backgroundColor: colors.surfaceVariant,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: 8,
  },
  matchupLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  matchupInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchupScore: {
    ...typography.h4,
    color: colors.text,
  },
  matchupVs: {
    ...typography.body2,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
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
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});