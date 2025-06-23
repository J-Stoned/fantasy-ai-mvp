import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';

import { useStore } from '../store';
import { useTheme } from '../contexts/ThemeContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { LineupSlot, Player } from '../types';
import { PlayerCard } from '../components/PlayerCard';
import { LineupOptimizer } from '../components/LineupOptimizer';
import { BenchPlayers } from '../components/BenchPlayers';
import { LineupStats } from '../components/LineupStats';

const { width, height } = Dimensions.get('window');

interface DraggablePlayer extends LineupSlot {
  key: string;
}

export default function LineupScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { activeLineup, setActiveLineup, activeLeague } = useStore();
  const { emit, subscribe, unsubscribe } = useWebSocket();
  
  const [lineup, setLineup] = useState<DraggablePlayer[]>([]);
  const [bench, setBench] = useState<DraggablePlayer[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (activeLineup) {
      const starters = activeLineup.starters.map((slot, index) => ({
        ...slot,
        key: `starter-${index}`,
      }));
      const benchPlayers = activeLineup.bench.map((slot, index) => ({
        ...slot,
        key: `bench-${index}`,
      }));
      
      setLineup(starters);
      setBench(benchPlayers);
    }
    
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeLineup]);

  useEffect(() => {
    // Subscribe to lineup updates
    const handleLineupUpdate = (data: any) => {
      if (data.leagueId === activeLeague?.id) {
        // Update lineup with real-time changes
        console.log('Lineup update:', data);
      }
    };

    subscribe('lineup:update', handleLineupUpdate);

    return () => {
      unsubscribe('lineup:update', handleLineupUpdate);
    };
  }, [activeLeague]);

  const handlePlayerSwap = (fromIndex: number, toIndex: number, fromList: 'lineup' | 'bench') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (fromList === 'lineup') {
      const newLineup = [...lineup];
      const [removed] = newLineup.splice(fromIndex, 1);
      newLineup.splice(toIndex, 0, removed);
      setLineup(newLineup);
    } else {
      const newBench = [...bench];
      const [removed] = newBench.splice(fromIndex, 1);
      newBench.splice(toIndex, 0, removed);
      setBench(newBench);
    }
    
    setIsDirty(true);
  };

  const handlePlayerMove = (player: DraggablePlayer, from: 'lineup' | 'bench', to: 'lineup' | 'bench') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (from === to) return;
    
    if (from === 'lineup' && to === 'bench') {
      // Move from lineup to bench
      setLineup(prev => prev.filter(p => p.key !== player.key));
      setBench(prev => [...prev, player]);
    } else if (from === 'bench' && to === 'lineup') {
      // Check position eligibility
      const canAdd = checkPositionEligibility(player.position);
      if (!canAdd) {
        Alert.alert('Position Full', 'This position is already filled in your lineup.');
        return;
      }
      
      setBench(prev => prev.filter(p => p.key !== player.key));
      setLineup(prev => [...prev, player]);
    }
    
    setIsDirty(true);
  };

  const checkPositionEligibility = (position: string): boolean => {
    // Check if position can be added to lineup
    const positionCounts: Record<string, number> = {};
    lineup.forEach(slot => {
      positionCounts[slot.position] = (positionCounts[slot.position] || 0) + 1;
    });
    
    // Define position limits based on league settings
    const limits: Record<string, number> = {
      QB: 1,
      RB: 2,
      WR: 3,
      TE: 1,
      FLEX: 1,
      K: 1,
      DEF: 1,
    };
    
    return (positionCounts[position] || 0) < (limits[position] || 0);
  };

  const handleOptimizeLineup = async () => {
    setIsOptimizing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      // Call optimization API
      const response = await fetch('https://api.fantasy.ai/lineup/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: activeLeague?.id,
          week: activeLeague?.currentWeek,
          currentLineup: lineup,
          bench: bench,
        }),
      });
      
      if (response.ok) {
        const optimized = await response.json();
        setLineup(optimized.starters.map((s: any, i: number) => ({ ...s, key: `starter-${i}` })));
        setBench(optimized.bench.map((s: any, i: number) => ({ ...s, key: `bench-${i}` })));
        setIsDirty(true);
      }
    } catch (error) {
      console.error('Optimization error:', error);
      Alert.alert('Error', 'Failed to optimize lineup');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSaveLineup = async () => {
    if (!isDirty) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      emit('lineup:save', {
        leagueId: activeLeague?.id,
        week: activeLeague?.currentWeek,
        starters: lineup,
        bench: bench,
      });
      
      setIsDirty(false);
      Alert.alert('Success', 'Lineup saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save lineup');
    }
  };

  const renderLineupItem = ({ item, drag, isActive }: RenderItemParams<DraggablePlayer>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.lineupSlot,
            {
              backgroundColor: theme.colors.card,
              opacity: isActive ? 0.8 : 1,
            },
          ]}
        >
          <View style={styles.positionBadge}>
            <Text style={styles.positionText}>{item.position}</Text>
          </View>
          
          {item.player ? (
            <PlayerCard
              player={item.player}
              showProjection
              compact
              onPress={() => {}}
            />
          ) : (
            <View style={styles.emptySlot}>
              <Ionicons name="person-add-outline" size={24} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Empty Slot
              </Text>
            </View>
          )}
          
          <View style={styles.projectedPoints}>
            <Text style={[styles.pointsLabel, { color: theme.colors.textSecondary }]}>
              Proj
            </Text>
            <Text style={[styles.pointsValue, { color: theme.colors.primary }]}>
              {item.projectedPoints.toFixed(1)}
            </Text>
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.card,
            paddingTop: insets.top,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Week {activeLeague?.currentWeek} Lineup
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowOptimizer(!showOptimizer)}
              style={styles.headerButton}
            >
              <Ionicons name="options-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOptimizeLineup}
              style={styles.headerButton}
              disabled={isOptimizing}
            >
              {isOptimizing ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons name="flash-outline" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
            {isDirty && (
              <TouchableOpacity
                onPress={handleSaveLineup}
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <LineupStats lineup={lineup} />
      </Animated.View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Starting Lineup */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Starting Lineup
          </Text>
          
          <DraggableFlatList
            data={lineup}
            renderItem={renderLineupItem}
            keyExtractor={(item) => item.key}
            onDragEnd={({ data }) => {
              setLineup(data);
              setIsDirty(true);
            }}
            scrollEnabled={false}
          />
        </View>

        {/* Bench */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Bench
          </Text>
          
          <BenchPlayers
            players={bench}
            onPlayerMove={(player) => handlePlayerMove(player, 'bench', 'lineup')}
          />
        </View>
      </ScrollView>

      {/* Lineup Optimizer Modal */}
      {showOptimizer && (
        <LineupOptimizer
          visible={showOptimizer}
          onClose={() => setShowOptimizer(false)}
          lineup={lineup}
          bench={bench}
          onOptimize={(optimized) => {
            setLineup(optimized.starters);
            setBench(optimized.bench);
            setIsDirty(true);
            setShowOptimizer(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  lineupSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  positionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  emptySlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  projectedPoints: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  pointsLabel: {
    fontSize: 12,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});