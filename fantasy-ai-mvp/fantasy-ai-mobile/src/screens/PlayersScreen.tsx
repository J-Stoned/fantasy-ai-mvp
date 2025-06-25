import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  Text,
  Card,
  Chip,
  Avatar,
  ActivityIndicator,
  IconButton,
  Searchbar,
  Portal,
  Modal,
  Button,
  RadioButton,
  Checkbox,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { Player, PlayerFilter } from '../types';
import { colors, spacing, typography, shadows } from '../theme';

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
const TEAMS = ['ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS'];

export default function PlayersScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PlayerFilter>({
    position: [],
    team: [],
    status: [],
    available: true,
  });
  const [sortBy, setSortBy] = useState<'points' | 'ownership' | 'trends'>('points');

  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch players with filters
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['players', filters, searchQuery],
    queryFn: () => api.getPlayers({ ...filters, searchQuery }),
  });

  const players = data?.data || [];

  // Sort players
  const sortedPlayers = React.useMemo(() => {
    if (!players.length) return [];

    return [...players].sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return b.stats.averagePoints - a.stats.averagePoints;
        case 'ownership':
          return b.ownership - a.ownership;
        case 'trends':
          return b.trends.percentageChange - a.trends.percentageChange;
        default:
          return 0;
      }
    });
  }, [players, sortBy]);

  const getStatusColor = (status: Player['status']) => {
    const statusColors = {
      active: colors.tertiary,
      injured: colors.error,
      questionable: colors.warning,
      out: colors.error,
      ir: colors.textDisabled,
    };
    return statusColors[status] || colors.textSecondary;
  };

  const getPositionColor = (position: string) => {
    const positionColors = {
      QB: colors.primary,
      RB: colors.secondary,
      WR: colors.tertiary,
      TE: colors.warning,
      K: colors.info,
      DEF: colors.neonPink,
    };
    return positionColors[position] || colors.textSecondary;
  };

  const getTrendIcon = (direction: Player['trends']['direction']) => {
    const icons = {
      up: 'trending-up',
      down: 'trending-down',
      stable: 'minus',
    };
    return icons[direction];
  };

  const renderPlayer = useCallback(({ item: player }: { item: Player }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PlayerDetail', { playerId: player.id })}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Card style={[styles.playerCard, shadows.sm]}>
          <Card.Content style={styles.playerContent}>
            <View style={styles.playerHeader}>
              <Avatar.Text
                size={48}
                label={player.position}
                style={[styles.positionAvatar, { backgroundColor: getPositionColor(player.position) }]}
              />
              <View style={styles.playerInfo}>
                <View style={styles.playerNameRow}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.name}
                  </Text>
                  <Icon
                    name={getTrendIcon(player.trends.direction)}
                    size={20}
                    color={player.trends.direction === 'up' ? colors.tertiary : player.trends.direction === 'down' ? colors.error : colors.textSecondary}
                  />
                </View>
                <View style={styles.playerDetails}>
                  <Text style={styles.teamText}>{player.team}</Text>
                  <View style={styles.statusDot}>
                    <View style={[styles.dot, { backgroundColor: getStatusColor(player.status) }]} />
                    <Text style={styles.statusText}>{player.status}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.playerStats}>
                <Text style={styles.pointsValue}>{player.stats.averagePoints.toFixed(1)}</Text>
                <Text style={styles.pointsLabel}>PPG</Text>
              </View>
            </View>

            <View style={styles.playerMetrics}>
              <View style={styles.metric}>
                <Icon name="account-group" size={16} color={colors.textSecondary} />
                <Text style={styles.metricValue}>{player.ownership}%</Text>
                <Text style={styles.metricLabel}>Owned</Text>
              </View>
              <View style={styles.metric}>
                <Icon name="chart-line" size={16} color={colors.textSecondary} />
                <Text style={[
                  styles.metricValue,
                  { color: player.trends.percentageChange > 0 ? colors.tertiary : colors.error }
                ]}>
                  {player.trends.percentageChange > 0 ? '+' : ''}{player.trends.percentageChange}%
                </Text>
                <Text style={styles.metricLabel}>Trend</Text>
              </View>
              <View style={styles.metric}>
                <Icon name="brain" size={16} color={colors.textSecondary} />
                <Text style={styles.metricValue}>{player.aiScore}</Text>
                <Text style={styles.metricLabel}>AI Score</Text>
              </View>
              <View style={styles.metric}>
                <Icon name="currency-usd" size={16} color={colors.textSecondary} />
                <Text style={styles.metricValue}>#{player.adp}</Text>
                <Text style={styles.metricLabel}>ADP</Text>
              </View>
            </View>

            {player.injuryDescription && (
              <View style={styles.injuryInfo}>
                <Icon name="medical-bag" size={14} color={colors.warning} />
                <Text style={styles.injuryText}>{player.injuryDescription}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </Animated.View>
    </TouchableOpacity>
  ), [navigation, scaleAnim]);

  const renderFiltersModal = () => (
    <Portal>
      <Modal
        visible={showFilters}
        onDismiss={() => setShowFilters(false)}
        contentContainerStyle={styles.modalContent}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.modalTitle}>Filter Players</Text>

          {/* Position Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Position</Text>
            <View style={styles.chipGrid}>
              {POSITIONS.map((pos) => (
                <Chip
                  key={pos}
                  mode={filters.position?.includes(pos) ? 'flat' : 'outlined'}
                  onPress={() => {
                    const newPositions = filters.position?.includes(pos)
                      ? filters.position.filter(p => p !== pos)
                      : [...(filters.position || []), pos];
                    setFilters({ ...filters, position: newPositions });
                  }}
                  style={[
                    styles.filterChip,
                    filters.position?.includes(pos) && { backgroundColor: getPositionColor(pos) }
                  ]}
                  textStyle={styles.filterChipText}
                >
                  {pos}
                </Chip>
              ))}
            </View>
          </View>

          {/* Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.statusOptions}>
              {['active', 'questionable', 'injured'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.checkboxRow}
                  onPress={() => {
                    const newStatus = filters.status?.includes(status)
                      ? filters.status.filter(s => s !== status)
                      : [...(filters.status || []), status];
                    setFilters({ ...filters, status: newStatus });
                  }}
                >
                  <Checkbox
                    status={filters.status?.includes(status) ? 'checked' : 'unchecked'}
                    color={colors.primary}
                  />
                  <Text style={styles.checkboxLabel}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Availability Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Availability</Text>
            <RadioButton.Group
              onValueChange={(value) => setFilters({ ...filters, available: value === 'available' })}
              value={filters.available ? 'available' : 'all'}
            >
              <TouchableOpacity
                style={styles.radioRow}
                onPress={() => setFilters({ ...filters, available: true })}
              >
                <RadioButton value="available" color={colors.primary} />
                <Text style={styles.radioLabel}>Available Players Only</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioRow}
                onPress={() => setFilters({ ...filters, available: undefined })}
              >
                <RadioButton value="all" color={colors.primary} />
                <Text style={styles.radioLabel}>All Players</Text>
              </TouchableOpacity>
            </RadioButton.Group>
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setFilters({ position: [], team: [], status: [], available: true });
              }}
              style={styles.modalButton}
            >
              Clear All
            </Button>
            <Button
              mode="contained"
              onPress={() => setShowFilters(false)}
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
            >
              Apply Filters
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>Failed to load players</Text>
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
          <Text style={styles.headerTitle}>Player Search</Text>
          <Text style={styles.headerSubtitle}>
            {data?.pagination.total || 0} Players Available
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search players, teams..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          icon="magnify"
          right={() => (
            <IconButton
              icon="filter-variant"
              size={24}
              onPress={() => setShowFilters(true)}
              style={filters.position?.length || filters.status?.length ? styles.activeFilterIcon : {}}
            />
          )}
        />
      </View>

      <View style={styles.sortBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            mode={sortBy === 'points' ? 'flat' : 'outlined'}
            onPress={() => setSortBy('points')}
            style={[styles.sortChip, sortBy === 'points' && styles.activeSortChip]}
            textStyle={sortBy === 'points' ? styles.activeSortText : styles.sortText}
          >
            Points
          </Chip>
          <Chip
            mode={sortBy === 'ownership' ? 'flat' : 'outlined'}
            onPress={() => setSortBy('ownership')}
            style={[styles.sortChip, sortBy === 'ownership' && styles.activeSortChip]}
            textStyle={sortBy === 'ownership' ? styles.activeSortText : styles.sortText}
          >
            Ownership
          </Chip>
          <Chip
            mode={sortBy === 'trends' ? 'flat' : 'outlined'}
            onPress={() => setSortBy('trends')}
            style={[styles.sortChip, sortBy === 'trends' && styles.activeSortChip]}
            textStyle={sortBy === 'trends' ? styles.activeSortText : styles.sortText}
          >
            Trending
          </Chip>
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading players...</Text>
        </View>
      ) : (
        <FlashList
          data={sortedPlayers}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={200}
          drawDistance={500}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="account-search" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No players found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your filters or search terms
              </Text>
            </View>
          }
        />
      )}

      {renderFiltersModal()}
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
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  searchBar: {
    backgroundColor: colors.surface,
    elevation: 0,
  },
  searchInput: {
    color: colors.text,
  },
  activeFilterIcon: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  sortBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sortChip: {
    marginRight: spacing.sm,
    backgroundColor: 'transparent',
  },
  activeSortChip: {
    backgroundColor: colors.primary,
  },
  sortText: {
    color: colors.textSecondary,
  },
  activeSortText: {
    color: colors.text,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  playerCard: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  playerContent: {
    padding: spacing.sm,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionAvatar: {
    marginRight: spacing.md,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerName: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
  },
  playerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  teamText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginRight: spacing.md,
  },
  statusDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  playerStats: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  pointsValue: {
    ...typography.h3,
    color: colors.text,
  },
  pointsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  playerMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    ...typography.body2,
    color: colors.text,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  injuryInfo: {
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
  modalContent: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    marginBottom: spacing.xs,
  },
  filterChipText: {
    color: colors.text,
  },
  statusOptions: {
    gap: spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    ...typography.body1,
    color: colors.text,
    marginLeft: spacing.sm,
    textTransform: 'capitalize',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  radioLabel: {
    ...typography.body1,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});