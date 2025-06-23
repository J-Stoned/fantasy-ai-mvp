import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface BenchPlayersProps {
  players: any[];
  onPlayerMove: (player: any) => void;
}

export function BenchPlayers({ players, onPlayerMove }: BenchPlayersProps) {
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      {players.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>
          No players on bench
        </Text>
      ) : (
        players.map((player, index) => (
          <TouchableOpacity
            key={player.key}
            style={[styles.player, { backgroundColor: theme.colors.card }]}
            onPress={() => onPlayerMove(player)}
          >
            <Text style={[styles.playerName, { color: theme.colors.text }]}>
              {player.player?.name || 'Empty'}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  player: {
    padding: 16,
    borderRadius: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
  },
});