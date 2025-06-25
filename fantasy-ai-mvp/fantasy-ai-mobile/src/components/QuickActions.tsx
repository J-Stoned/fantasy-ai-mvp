import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradientColors: [string, string];
  onPress: () => void;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  columns?: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions, columns = 4 }) => {
  const defaultActions: QuickAction[] = [
    {
      id: '1',
      title: 'Set Lineup',
      icon: 'people',
      color: '#00d4ff',
      gradientColors: ['#00d4ff', '#0099cc'],
      onPress: () => console.log('Set Lineup'),
    },
    {
      id: '2',
      title: 'Trade',
      icon: 'swap-horizontal',
      color: '#ff6b6b',
      gradientColors: ['#ff6b6b', '#ee5a24'],
      onPress: () => console.log('Trade'),
    },
    {
      id: '3',
      title: 'Waivers',
      icon: 'add-circle',
      color: '#4ecdc4',
      gradientColors: ['#4ecdc4', '#44a3aa'],
      onPress: () => console.log('Waivers'),
    },
    {
      id: '4',
      title: 'AI Advice',
      icon: 'bulb',
      color: '#ffe66d',
      gradientColors: ['#ffe66d', '#ffd93d'],
      onPress: () => console.log('AI Advice'),
    },
    {
      id: '5',
      title: 'Stats',
      icon: 'stats-chart',
      color: '#a8e6cf',
      gradientColors: ['#a8e6cf', '#7fcdbb'],
      onPress: () => console.log('Stats'),
    },
    {
      id: '6',
      title: 'News',
      icon: 'newspaper',
      color: '#ff8b94',
      gradientColors: ['#ff8b94', '#ff6b7a'],
      onPress: () => console.log('News'),
    },
    {
      id: '7',
      title: 'Chat',
      icon: 'chatbubbles',
      color: '#c7ceea',
      gradientColors: ['#c7ceea', '#b2b7dc'],
      onPress: () => console.log('Chat'),
    },
    {
      id: '8',
      title: 'Schedule',
      icon: 'calendar',
      color: '#ffd3b6',
      gradientColors: ['#ffd3b6', '#ffaaa5'],
      onPress: () => console.log('Schedule'),
    },
  ];

  const displayActions = actions || defaultActions;

  const renderAction = (action: QuickAction) => {
    const itemWidth = `${100 / columns}%`;

    return (
      <TouchableOpacity
        key={action.id}
        style={[styles.actionItem, { width: itemWidth }]}
        onPress={action.onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={action.gradientColors}
          style={styles.actionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={action.icon} size={28} color="#fff" />
        </LinearGradient>
        <Text style={styles.actionTitle} numberOfLines={1}>
          {action.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const isScrollable = displayActions.length > columns * 2;

  if (isScrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.actionsGrid}>
          {displayActions.map(renderAction)}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.actionsGrid}>
        {displayActions.map(renderAction)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  scrollContainer: {
    paddingVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionItem: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionTitle: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});

export default QuickActions;