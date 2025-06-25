import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export interface AIInsight {
  id: string;
  type: 'recommendation' | 'warning' | 'opportunity' | 'analysis';
  title: string;
  description: string;
  confidence?: number;
  impact?: 'high' | 'medium' | 'low';
  actionable?: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
  details?: string[];
  timestamp?: Date;
}

interface AIInsightCardProps {
  insight: AIInsight;
  onDismiss?: (id: string) => void;
  expandable?: boolean;
}

const AIInsightCard: React.FC<AIInsightCardProps> = ({
  insight,
  onDismiss,
  expandable = true,
}) => {
  const [expanded, setExpanded] = useState(false);
  const animatedHeight = useState(new Animated.Value(0))[0];

  const getTypeColor = () => {
    switch (insight.type) {
      case 'recommendation':
        return ['#00d4ff', '#0099cc'];
      case 'warning':
        return ['#ff6b6b', '#ee5a24'];
      case 'opportunity':
        return ['#4ecdc4', '#44a3aa'];
      case 'analysis':
        return ['#ffe66d', '#ffd93d'];
      default:
        return ['#666', '#444'];
    }
  };

  const getTypeIcon = () => {
    switch (insight.type) {
      case 'recommendation':
        return 'bulb';
      case 'warning':
        return 'warning';
      case 'opportunity':
        return 'trending-up';
      case 'analysis':
        return 'analytics';
      default:
        return 'information-circle';
    }
  };

  const getImpactColor = () => {
    switch (insight.impact) {
      case 'high':
        return '#ff0000';
      case 'medium':
        return '#ffaa00';
      case 'low':
        return '#00ff00';
      default:
        return '#888';
    }
  };

  const toggleExpanded = () => {
    if (!expandable || !insight.details?.length) return;

    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);

    Animated.timing(animatedHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const maxHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getTypeColor()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          style={styles.content}
          onPress={toggleExpanded}
          activeOpacity={expandable && insight.details?.length ? 0.8 : 1}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name={getTypeIcon()} size={24} color="#fff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{insight.title}</Text>
              {insight.confidence !== undefined && (
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceLabel}>Confidence:</Text>
                  <View style={styles.confidenceBar}>
                    <View
                      style={[
                        styles.confidenceFill,
                        { width: `${insight.confidence}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.confidenceValue}>
                    {insight.confidence}%
                  </Text>
                </View>
              )}
            </View>
            {onDismiss && (
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => onDismiss(insight.id)}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.description}>{insight.description}</Text>

          {insight.impact && (
            <View style={styles.impactContainer}>
              <Text style={styles.impactLabel}>Impact:</Text>
              <View
                style={[
                  styles.impactBadge,
                  { backgroundColor: getImpactColor() },
                ]}
              >
                <Text style={styles.impactText}>
                  {insight.impact.toUpperCase()}
                </Text>
              </View>
            </View>
          )}

          {expandable && insight.details?.length > 0 && (
            <View style={styles.expandIndicator}>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#fff"
              />
            </View>
          )}
        </TouchableOpacity>

        {expandable && insight.details?.length > 0 && (
          <Animated.View
            style={[styles.detailsContainer, { maxHeight }]}
          >
            {insight.details.map((detail, index) => (
              <View key={index} style={styles.detailItem}>
                <Text style={styles.detailBullet}>•</Text>
                <Text style={styles.detailText}>{detail}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {insight.actionable && insight.action && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={insight.action.onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>
              {insight.action.label}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 12,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  confidenceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginRight: 8,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  confidenceValue: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  impactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  impactLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  impactText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  dismissButton: {
    padding: 4,
  },
  expandIndicator: {
    alignSelf: 'center',
    marginTop: 8,
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailBullet: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
});

export default AIInsightCard;