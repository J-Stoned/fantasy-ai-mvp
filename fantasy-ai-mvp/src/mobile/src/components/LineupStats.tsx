import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface LineupStatsProps {
  lineup: any[];
}

export function LineupStats({ lineup }: LineupStatsProps) {
  const { theme } = useTheme();
  
  const totalProjected = lineup.reduce((sum, slot) => sum + (slot.projectedPoints || 0), 0);
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.stat}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Projected Points
        </Text>
        <Text style={[styles.value, { color: theme.colors.primary }]}>
          {totalProjected.toFixed(1)}
        </Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Players Set
        </Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>
          {lineup.filter(s => s.player).length}/{lineup.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  stat: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
});