import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export function PlayerHighlight() {
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
        Top performing players will appear here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
  },
});