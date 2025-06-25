import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  TabView,
  SegmentedButtons,
  Chip,
  List,
  DataTable,
  ProgressBar,
  IconButton,
  Button,
  Card,
  Avatar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart, BarChart } from 'react-native-chart-kit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PlayerStats {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
}

interface GameLog {
  date: string;
  opponent: string;
  result: string;
  points: number;
  rebounds: number;
  assists: number;
  minutes: string;
}

const PlayerDetailScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('season');

  // Mock player data
  const player = {
    id: '1',
    name: 'LeBron James',
    team: 'Lakers',
    position: 'SF',
    number: '23',
    age: 38,
    height: "6'9\"",
    weight: '250 lbs',
    imageUrl: 'https://example.com/lebron.jpg',
    status: 'Healthy',
    fantasyPoints: 45.8,
    ownership: 94.5,
    rank: 3,
    projection: 48.5,
  };

  const seasonStats: PlayerStats = {
    points: 25.4,
    rebounds: 7.8,
    assists: 7.2,
    steals: 1.2,
    blocks: 0.8,
    turnovers: 3.1,
    fieldGoalPercentage: 50.2,
    threePointPercentage: 38.1,
    freeThrowPercentage: 73.4,
  };

  const recentGames: GameLog[] = [
    { date: '12/25', opponent: '@BOS', result: 'W 126-115', points: 35, rebounds: 8, assists: 5, minutes: '35:12' },
    { date: '12/23', opponent: 'OKC', result: 'L 120-129', points: 40, rebounds: 7, assists: 7, minutes: '38:45' },
    { date: '12/21', opponent: '@MIN', result: 'W 108-106', points: 26, rebounds: 6, assists: 9, minutes: '36:30' },
    { date: '12/19', opponent: 'NYK', result: 'W 113-105', points: 24, rebounds: 5, assists: 8, minutes: '34:20' },
    { date: '12/18', opponent: '@CHI', result: 'W 124-108', points: 38, rebounds: 6, assists: 5, minutes: '33:15' },
  ];

  const chartData = {
    labels: ['12/18', '12/19', '12/21', '12/23', '12/25'],
    datasets: [
      {
        data: [38, 24, 26, 40, 35],
        color: (opacity = 1) => theme.colors.primary,
        strokeWidth: 2,
      },
    ],
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      <Surface style={styles.statsCard} elevation={2}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Season Averages
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium">{seasonStats.points}</Text>
            <Text variant="bodySmall">PPG</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium">{seasonStats.rebounds}</Text>
            <Text variant="bodySmall">RPG</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium">{seasonStats.assists}</Text>
            <Text variant="bodySmall">APG</Text>
          </View>
        </View>
        <View style={styles.shootingStats}>
          <View style={styles.shootingStatItem}>
            <Text variant="bodyMedium">FG%</Text>
            <ProgressBar
              progress={seasonStats.fieldGoalPercentage / 100}
              style={styles.progressBar}
            />
            <Text variant="bodySmall">{seasonStats.fieldGoalPercentage}%</Text>
          </View>
          <View style={styles.shootingStatItem}>
            <Text variant="bodyMedium">3P%</Text>
            <ProgressBar
              progress={seasonStats.threePointPercentage / 100}
              style={styles.progressBar}
            />
            <Text variant="bodySmall">{seasonStats.threePointPercentage}%</Text>
          </View>
          <View style={styles.shootingStatItem}>
            <Text variant="bodyMedium">FT%</Text>
            <ProgressBar
              progress={seasonStats.freeThrowPercentage / 100}
              style={styles.progressBar}
            />
            <Text variant="bodySmall">{seasonStats.freeThrowPercentage}%</Text>
          </View>
        </View>
      </Surface>

      <Surface style={styles.aiInsightCard} elevation={2}>
        <View style={styles.aiHeader}>
          <Icon name="brain" size={24} color={theme.colors.primary} />
          <Text variant="titleMedium" style={styles.aiTitle}>
            AI Insights
          </Text>
        </View>
        <List.Item
          title="Hot Streak"
          description="Averaging 33.8 PPG over last 5 games"
          left={props => <List.Icon {...props} icon="fire" color={theme.colors.error} />}
        />
        <List.Item
          title="Matchup Advantage"
          description="Next opponent allows 115.2 PPG (28th in NBA)"
          left={props => <List.Icon {...props} icon="trending-up" color={theme.colors.primary} />}
        />
        <List.Item
          title="Rest Advantage"
          description="2 days rest before next game"
          left={props => <List.Icon {...props} icon="sleep" color={theme.colors.tertiary} />}
        />
      </Surface>

      <Surface style={styles.projectionCard} elevation={2}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Next Game Projection
        </Text>
        <View style={styles.projectionContent}>
          <View style={styles.projectionMain}>
            <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
              {player.projection}
            </Text>
            <Text variant="bodyMedium">Fantasy Points</Text>
          </View>
          <View style={styles.projectionDetails}>
            <Text variant="bodySmall">vs Warriors</Text>
            <Text variant="bodySmall">Thu 8:00 PM</Text>
            <Chip icon="television" compact>National TV</Chip>
          </View>
        </View>
      </Surface>
    </ScrollView>
  );

  const renderStatsTab = () => (
    <ScrollView style={styles.tabContent}>
      <SegmentedButtons
        value={selectedTimeRange}
        onValueChange={setSelectedTimeRange}
        buttons={[
          { value: 'last5', label: 'Last 5' },
          { value: 'last10', label: 'Last 10' },
          { value: 'month', label: 'Month' },
          { value: 'season', label: 'Season' },
        ]}
        style={styles.timeRangeSelector}
      />

      <Surface style={styles.chartCard} elevation={2}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Points Trend
        </Text>
        <LineChart
          data={chartData}
          width={SCREEN_WIDTH - 60}
          height={200}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => theme.colors.primary,
            labelColor: (opacity = 1) => theme.colors.onSurface,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: theme.colors.primary,
            },
          }}
          bezier
          style={styles.chart}
        />
      </Surface>

      <Surface style={styles.detailedStatsCard} elevation={2}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Detailed Statistics
        </Text>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Category</DataTable.Title>
            <DataTable.Title numeric>Season</DataTable.Title>
            <DataTable.Title numeric>Last 5</DataTable.Title>
            <DataTable.Title numeric>Trend</DataTable.Title>
          </DataTable.Header>

          <DataTable.Row>
            <DataTable.Cell>Points</DataTable.Cell>
            <DataTable.Cell numeric>25.4</DataTable.Cell>
            <DataTable.Cell numeric>33.8</DataTable.Cell>
            <DataTable.Cell numeric>
              <Icon name="trending-up" size={16} color={theme.colors.primary} />
            </DataTable.Cell>
          </DataTable.Row>

          <DataTable.Row>
            <DataTable.Cell>Rebounds</DataTable.Cell>
            <DataTable.Cell numeric>7.8</DataTable.Cell>
            <DataTable.Cell numeric>6.4</DataTable.Cell>
            <DataTable.Cell numeric>
              <Icon name="trending-down" size={16} color={theme.colors.error} />
            </DataTable.Cell>
          </DataTable.Row>

          <DataTable.Row>
            <DataTable.Cell>Assists</DataTable.Cell>
            <DataTable.Cell numeric>7.2</DataTable.Cell>
            <DataTable.Cell numeric>6.8</DataTable.Cell>
            <DataTable.Cell numeric>
              <Icon name="trending-neutral" size={16} color={theme.colors.outline} />
            </DataTable.Cell>
          </DataTable.Row>

          <DataTable.Row>
            <DataTable.Cell>FG%</DataTable.Cell>
            <DataTable.Cell numeric>50.2%</DataTable.Cell>
            <DataTable.Cell numeric>55.3%</DataTable.Cell>
            <DataTable.Cell numeric>
              <Icon name="trending-up" size={16} color={theme.colors.primary} />
            </DataTable.Cell>
          </DataTable.Row>
        </DataTable>
      </Surface>
    </ScrollView>
  );

  const renderGameLogTab = () => (
    <ScrollView style={styles.tabContent}>
      <Surface style={styles.gameLogCard} elevation={2}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Recent Games
        </Text>
        {recentGames.map((game, index) => (
          <Card key={index} style={styles.gameCard} mode="outlined">
            <Card.Content>
              <View style={styles.gameHeader}>
                <View>
                  <Text variant="titleMedium">{game.opponent}</Text>
                  <Text variant="bodySmall">{game.date}</Text>
                </View>
                <Chip
                  mode="flat"
                  compact
                  style={[
                    styles.resultChip,
                    { backgroundColor: game.result.startsWith('W') ? theme.colors.primaryContainer : theme.colors.errorContainer }
                  ]}
                >
                  {game.result}
                </Chip>
              </View>
              <View style={styles.gameStats}>
                <View style={styles.gameStatItem}>
                  <Text variant="titleLarge">{game.points}</Text>
                  <Text variant="bodySmall">PTS</Text>
                </View>
                <View style={styles.gameStatItem}>
                  <Text variant="titleLarge">{game.rebounds}</Text>
                  <Text variant="bodySmall">REB</Text>
                </View>
                <View style={styles.gameStatItem}>
                  <Text variant="titleLarge">{game.assists}</Text>
                  <Text variant="bodySmall">AST</Text>
                </View>
                <View style={styles.gameStatItem}>
                  <Text variant="titleMedium">{game.minutes}</Text>
                  <Text variant="bodySmall">MIN</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </Surface>
    </ScrollView>
  );

  const renderNewsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Surface style={styles.newsCard} elevation={2}>
        <List.Item
          title="LeBron drops 40 in Christmas Day victory"
          description="2 hours ago • ESPN"
          left={props => <Avatar.Icon {...props} icon="newspaper" size={40} />}
          onPress={() => {}}
        />
        <List.Item
          title="Injury Report: LeBron probable for Thursday"
          description="5 hours ago • Lakers.com"
          left={props => <Avatar.Icon {...props} icon="medical-bag" size={40} />}
          onPress={() => {}}
        />
        <List.Item
          title="LeBron's efficiency at 38: Breaking down the numbers"
          description="1 day ago • The Athletic"
          left={props => <Avatar.Icon {...props} icon="chart-line" size={40} />}
          onPress={() => {}}
        />
        <List.Item
          title="Trade Rumors: Lakers exploring deadline moves"
          description="2 days ago • Woj"
          left={props => <Avatar.Icon {...props} icon="swap-horizontal" size={40} />}
          onPress={() => {}}
        />
      </Surface>
    </ScrollView>
  );

  const tabs = [
    { key: 'overview', title: 'Overview', icon: 'view-dashboard' },
    { key: 'stats', title: 'Stats', icon: 'chart-line' },
    { key: 'gamelog', title: 'Game Log', icon: 'calendar' },
    { key: 'news', title: 'News', icon: 'newspaper' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          Player Details
        </Text>
        <IconButton
          icon="share-variant"
          size={24}
          onPress={() => {}}
        />
      </View>

      <Surface style={styles.playerHeader} elevation={2}>
        <View style={styles.playerInfo}>
          <Avatar.Text size={60} label="LJ" />
          <View style={styles.playerDetails}>
            <Text variant="headlineSmall">{player.name}</Text>
            <Text variant="bodyLarge">
              {player.team} • {player.position} • #{player.number}
            </Text>
            <View style={styles.playerMetadata}>
              <Chip icon="trending-up" compact style={styles.rankChip}>
                #{player.rank} Rank
              </Chip>
              <Chip icon="account-group" compact>
                {player.ownership}% Owned
              </Chip>
            </View>
          </View>
        </View>
        <View style={styles.playerActions}>
          <Button mode="contained" icon="plus" onPress={() => {}}>
            Add to Team
          </Button>
          <Button mode="outlined" icon="bell" onPress={() => {}}>
            Set Alert
          </Button>
        </View>
      </Surface>

      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <IconButton
            key={tab.key}
            icon={tab.icon}
            size={24}
            selected={selectedTab === tab.key}
            onPress={() => setSelectedTab(tab.key)}
            style={[
              styles.tabButton,
              selectedTab === tab.key && styles.selectedTabButton,
            ]}
          />
        ))}
      </View>

      {selectedTab === 'overview' && renderOverviewTab()}
      {selectedTab === 'stats' && renderStatsTab()}
      {selectedTab === 'gamelog' && renderGameLogTab()}
      {selectedTab === 'news' && renderNewsTab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  playerHeader: {
    margin: 15,
    padding: 15,
    borderRadius: 12,
  },
  playerInfo: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  playerDetails: {
    flex: 1,
    marginLeft: 15,
  },
  playerMetadata: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  rankChip: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  playerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
  },
  selectedTabButton: {
    backgroundColor: 'rgba(103, 80, 164, 0.2)',
  },
  tabContent: {
    flex: 1,
  },
  statsCard: {
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: 15,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  shootingStats: {
    gap: 10,
  },
  shootingStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  aiInsightCard: {
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  aiTitle: {
    fontWeight: 'bold',
  },
  projectionCard: {
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  projectionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectionMain: {
    alignItems: 'center',
  },
  projectionDetails: {
    alignItems: 'flex-end',
    gap: 5,
  },
  timeRangeSelector: {
    margin: 15,
  },
  chartCard: {
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  detailedStatsCard: {
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  gameLogCard: {
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  gameCard: {
    marginBottom: 10,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultChip: {
    minWidth: 80,
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gameStatItem: {
    alignItems: 'center',
  },
  newsCard: {
    margin: 15,
    padding: 10,
    borderRadius: 12,
  },
});

export default PlayerDetailScreen;