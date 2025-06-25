import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  Button,
  Chip,
  IconButton,
  FAB,
  Searchbar,
  List,
  Avatar,
  Badge,
  Portal,
  Modal,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  imageUrl?: string;
  points: number;
  salary?: number;
  status: 'healthy' | 'questionable' | 'out';
  projection: number;
}

interface LineupSlot {
  position: string;
  player: Player | null;
  isRequired: boolean;
}

const LineupBuilderScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [lineup, setLineup] = useState<LineupSlot[]>([
    { position: 'PG', player: null, isRequired: true },
    { position: 'SG', player: null, isRequired: true },
    { position: 'SF', player: null, isRequired: true },
    { position: 'PF', player: null, isRequired: true },
    { position: 'C', player: null, isRequired: true },
    { position: 'G', player: null, isRequired: true },
    { position: 'F', player: null, isRequired: true },
    { position: 'UTIL', player: null, isRequired: true },
    { position: 'BENCH', player: null, isRequired: false },
    { position: 'BENCH', player: null, isRequired: false },
  ]);

  // Mock available players
  const availablePlayers: Player[] = [
    { id: '1', name: 'LeBron James', position: 'SF', team: 'LAL', points: 45.8, salary: 11200, status: 'healthy', projection: 48.5 },
    { id: '2', name: 'Nikola Jokic', position: 'C', team: 'DEN', points: 55.2, salary: 12000, status: 'healthy', projection: 58.0 },
    { id: '3', name: 'Luka Doncic', position: 'PG', team: 'DAL', points: 52.3, salary: 11800, status: 'questionable', projection: 50.0 },
    { id: '4', name: 'Jayson Tatum', position: 'SF', team: 'BOS', points: 43.1, salary: 10500, status: 'healthy', projection: 45.0 },
    { id: '5', name: 'Damian Lillard', position: 'PG', team: 'MIL', points: 42.5, salary: 10200, status: 'healthy', projection: 44.0 },
    { id: '6', name: 'Anthony Edwards', position: 'SG', team: 'MIN', points: 38.7, salary: 9800, status: 'healthy', projection: 40.0 },
    { id: '7', name: 'Joel Embiid', position: 'C', team: 'PHI', points: 51.2, salary: 11500, status: 'out', projection: 0 },
    { id: '8', name: 'Shai Gilgeous-Alexander', position: 'SG', team: 'OKC', points: 44.8, salary: 10800, status: 'healthy', projection: 46.0 },
  ];

  const totalSalary = lineup.reduce((sum, slot) => {
    return sum + (slot.player?.salary || 0);
  }, 0);

  const totalProjection = lineup.reduce((sum, slot) => {
    return sum + (slot.player?.projection || 0);
  }, 0);

  const salaryCap = 50000;
  const remainingSalary = salaryCap - totalSalary;

  const handleSlotPress = (index: number) => {
    setSelectedSlotIndex(index);
    setShowPlayerPicker(true);
  };

  const handlePlayerSelect = (player: Player) => {
    if (selectedSlotIndex !== null) {
      const newLineup = [...lineup];
      newLineup[selectedSlotIndex].player = player;
      setLineup(newLineup);
    }
    setShowPlayerPicker(false);
    setSelectedSlotIndex(null);
  };

  const handleRemovePlayer = (index: number) => {
    const newLineup = [...lineup];
    newLineup[index].player = null;
    setLineup(newLineup);
  };

  const handleOptimizeLineup = () => {
    // Mock AI optimization
    console.log('Optimizing lineup...');
  };

  const handleSaveLineup = () => {
    console.log('Saving lineup...');
    navigation.goBack();
  };

  const canPlayerFillSlot = (player: Player, slot: LineupSlot): boolean => {
    if (slot.position === 'UTIL') return true;
    if (slot.position === 'BENCH') return true;
    if (slot.position === 'G' && ['PG', 'SG'].includes(player.position)) return true;
    if (slot.position === 'F' && ['SF', 'PF'].includes(player.position)) return true;
    return player.position === slot.position;
  };

  const filteredPlayers = availablePlayers.filter(player => {
    if (selectedPosition !== 'ALL' && player.position !== selectedPosition) return false;
    if (searchQuery && !player.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedSlotIndex !== null && !canPlayerFillSlot(player, lineup[selectedSlotIndex])) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return theme.colors.primary;
      case 'questionable': return theme.colors.tertiary;
      case 'out': return theme.colors.error;
      default: return theme.colors.outline;
    }
  };

  const renderLineupSlot = (slot: LineupSlot, index: number) => (
    <TouchableOpacity key={index} onPress={() => handleSlotPress(index)}>
      <Surface style={styles.lineupSlot} elevation={1}>
        <View style={styles.slotPosition}>
          <Text variant="titleMedium" style={styles.positionText}>
            {slot.position}
          </Text>
        </View>
        {slot.player ? (
          <View style={styles.playerInSlot}>
            <Avatar.Text size={40} label={slot.player.name.split(' ').map(n => n[0]).join('')} />
            <View style={styles.playerSlotInfo}>
              <Text variant="titleMedium">{slot.player.name}</Text>
              <View style={styles.playerSlotMeta}>
                <Text variant="bodySmall">{slot.player.team}</Text>
                <Chip
                  compact
                  mode="flat"
                  style={{ backgroundColor: getStatusColor(slot.player.status) + '20' }}
                >
                  {slot.player.projection} proj
                </Chip>
              </View>
            </View>
            <IconButton
              icon="close"
              size={20}
              onPress={() => handleRemovePlayer(index)}
            />
          </View>
        ) : (
          <View style={styles.emptySlot}>
            <Icon name="plus-circle-outline" size={30} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={styles.emptySlotText}>
              Add Player
            </Text>
          </View>
        )}
      </Surface>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          Lineup Builder
        </Text>
        <IconButton
          icon="content-save"
          size={24}
          onPress={handleSaveLineup}
        />
      </View>

      <Surface style={styles.statsBar} elevation={1}>
        <View style={styles.statItem}>
          <Text variant="bodySmall">Salary Used</Text>
          <Text variant="titleMedium" style={{ color: remainingSalary < 0 ? theme.colors.error : theme.colors.primary }}>
            ${totalSalary.toLocaleString()}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="bodySmall">Remaining</Text>
          <Text variant="titleMedium" style={{ color: remainingSalary < 0 ? theme.colors.error : theme.colors.primary }}>
            ${remainingSalary.toLocaleString()}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="bodySmall">Projection</Text>
          <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
            {totalProjection.toFixed(1)}
          </Text>
        </View>
      </Surface>

      <ScrollView style={styles.lineupContainer}>
        {lineup.map((slot, index) => renderLineupSlot(slot, index))}
      </ScrollView>

      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          icon="auto-fix"
          onPress={handleOptimizeLineup}
          style={styles.actionButton}
        >
          AI Optimize
        </Button>
        <Button
          mode="outlined"
          icon="broom"
          onPress={() => setLineup(lineup.map(slot => ({ ...slot, player: null })))}
          style={styles.actionButton}
        >
          Clear All
        </Button>
      </View>

      <Portal>
        <Modal
          visible={showPlayerPicker}
          onDismiss={() => setShowPlayerPicker(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Select Player
          </Text>

          <Searchbar
            placeholder="Search players..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          <SegmentedButtons
            value={selectedPosition}
            onValueChange={setSelectedPosition}
            buttons={[
              { value: 'ALL', label: 'All' },
              { value: 'PG', label: 'PG' },
              { value: 'SG', label: 'SG' },
              { value: 'SF', label: 'SF' },
              { value: 'PF', label: 'PF' },
              { value: 'C', label: 'C' },
            ]}
            style={styles.positionFilter}
          />

          <ScrollView style={styles.playerList}>
            {filteredPlayers.map(player => (
              <TouchableOpacity
                key={player.id}
                onPress={() => handlePlayerSelect(player)}
              >
                <Surface style={styles.playerItem} elevation={1}>
                  <Avatar.Text size={40} label={player.name.split(' ').map(n => n[0]).join('')} />
                  <View style={styles.playerItemInfo}>
                    <Text variant="titleMedium">{player.name}</Text>
                    <View style={styles.playerItemMeta}>
                      <Text variant="bodySmall">{player.position} - {player.team}</Text>
                      <View style={styles.playerItemStats}>
                        <Chip compact mode="flat" style={styles.salaryChip}>
                          ${player.salary?.toLocaleString()}
                        </Chip>
                        <Chip
                          compact
                          mode="flat"
                          style={{ backgroundColor: getStatusColor(player.status) + '20' }}
                        >
                          {player.projection} proj
                        </Chip>
                      </View>
                    </View>
                  </View>
                  <Icon
                    name={player.status === 'healthy' ? 'check-circle' : player.status === 'questionable' ? 'help-circle' : 'close-circle'}
                    size={24}
                    color={getStatusColor(player.status)}
                  />
                </Surface>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>
      </Portal>
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
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    margin: 15,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  lineupContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  lineupSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
  },
  slotPosition: {
    width: 50,
    alignItems: 'center',
    marginRight: 15,
  },
  positionText: {
    fontWeight: 'bold',
  },
  playerInSlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerSlotInfo: {
    flex: 1,
    marginLeft: 10,
  },
  playerSlotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  emptySlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptySlotText: {
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  searchBar: {
    marginBottom: 15,
  },
  positionFilter: {
    marginBottom: 15,
  },
  playerList: {
    maxHeight: 400,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
  },
  playerItemInfo: {
    flex: 1,
    marginLeft: 10,
  },
  playerItemMeta: {
    marginTop: 2,
  },
  playerItemStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 5,
  },
  salaryChip: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
});

export default LineupBuilderScreen;