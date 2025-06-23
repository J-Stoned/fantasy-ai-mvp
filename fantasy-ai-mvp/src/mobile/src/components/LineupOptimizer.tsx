import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface LineupOptimizerProps {
  visible: boolean;
  onClose: () => void;
  lineup: any[];
  bench: any[];
  onOptimize: (result: any) => void;
}

export function LineupOptimizer({ visible, onClose, lineup, bench, onOptimize }: LineupOptimizerProps) {
  const { theme } = useTheme();
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Lineup Optimizer
          </Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            Optimization settings and controls will appear here
          </Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    padding: 24,
    borderRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});