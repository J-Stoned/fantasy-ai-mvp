import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export function QuickActions() {
  const { theme } = useTheme();
  
  const actions = [
    { icon: 'flash', label: 'Optimize', color: '#F59E0B' },
    { icon: 'swap-horizontal', label: 'Trade', color: '#8B5CF6' },
    { icon: 'add-circle', label: 'Add Player', color: '#10B981' },
    { icon: 'analytics', label: 'Insights', color: '#3B82F6' },
  ];
  
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
    >
      <View style={styles.actions}>
        {actions.map((action, index) => (
          <TouchableOpacity key={index} style={styles.action}>
            <View style={[styles.iconContainer, { backgroundColor: `${action.color}20` }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text style={[styles.label, { color: theme.colors.text }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  action: {
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});