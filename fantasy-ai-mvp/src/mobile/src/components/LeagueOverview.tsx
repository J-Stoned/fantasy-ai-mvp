import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { League } from '../types';

export function LeagueOverview({ league }: { league: League }) {
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {league.name}
      </Text>
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
        Week {league.currentWeek} • {league.teams} teams
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
  },
});