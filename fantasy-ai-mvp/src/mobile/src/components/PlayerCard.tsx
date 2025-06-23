import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  showProjection?: boolean;
  compact?: boolean;
  onPress: () => void;
}

export function PlayerCard({ player, showProjection, compact, onPress }: PlayerCardProps) {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {player.name}
        </Text>
        <Text style={[styles.details, { color: theme.colors.textSecondary }]}>
          {player.position} • {player.team}
        </Text>
      </View>
      {showProjection && (
        <View style={styles.projection}>
          <Text style={[styles.projValue, { color: theme.colors.primary }]}>
            {player.projections?.projectedPoints.toFixed(1) || '0.0'}
          </Text>
          <Text style={[styles.projLabel, { color: theme.colors.textSecondary }]}>
            proj
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  details: {
    fontSize: 14,
    marginTop: 2,
  },
  projection: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  projValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  projLabel: {
    fontSize: 12,
  },
});