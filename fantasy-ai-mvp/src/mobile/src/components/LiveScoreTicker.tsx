import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export function LiveScoreTicker() {
  const { theme } = useTheme();
  
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
    >
      <View style={[styles.ticker, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.text, { color: theme.colors.text }]}>Live scores coming soon...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  ticker: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
  },
  text: {
    fontSize: 14,
  },
});