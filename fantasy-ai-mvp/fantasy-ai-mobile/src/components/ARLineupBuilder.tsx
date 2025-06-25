import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
  Frame,
  CameraDevice,
} from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'react-native-linear-gradient';
import { colors, spacing, typography } from '../theme';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DetectedPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  stats: {
    points: number;
    projected: number;
  };
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ARLineupBuilderProps {
  onPlayerAdded: (player: DetectedPlayer) => void;
  onClose: () => void;
}

export const ARLineupBuilder: React.FC<ARLineupBuilderProps> = ({
  onPlayerAdded,
  onClose,
}) => {
  const devices = useCameraDevices();
  const device = devices.back;
  const camera = useRef<Camera>(null);
  
  const [detectedPlayers, setDetectedPlayers] = useState<DetectedPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<DetectedPlayer | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Mock player detection (in production, use ML model)
  const detectPlayers = useCallback((frame: Frame) => {
    'worklet';
    
    // Simulate player detection every 60 frames
    if (frame.timestamp % 60 === 0) {
      const mockPlayers: DetectedPlayer[] = [
        {
          id: '1',
          name: 'Patrick Mahomes',
          position: 'QB',
          team: 'KC',
          stats: { points: 24.5, projected: 26.8 },
          boundingBox: { x: 100, y: 200, width: 150, height: 200 },
        },
        {
          id: '2',
          name: 'Christian McCaffrey',
          position: 'RB',
          team: 'SF',
          stats: { points: 22.3, projected: 24.1 },
          boundingBox: { x: 300, y: 250, width: 150, height: 200 },
        },
      ];
      
      runOnJS(updateDetectedPlayers)(mockPlayers);
    }
  }, []);
  
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (isScanning) {
      detectPlayers(frame);
    }
  }, [isScanning]);
  
  const updateDetectedPlayers = useCallback((players: DetectedPlayer[]) => {
    setDetectedPlayers(players);
    
    // Haptic feedback on detection
    if (players.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Animate in player overlays
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);
  
  const selectPlayer = useCallback((player: DetectedPlayer) => {
    setSelectedPlayer(player);
    setIsScanning(false);
    
    // Strong haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Pulse animation
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [pulseAnim]);
  
  const addSelectedPlayer = useCallback(() => {
    if (selectedPlayer) {
      onPlayerAdded(selectedPlayer);
      
      // Reset state
      setSelectedPlayer(null);
      setIsScanning(true);
      setDetectedPlayers([]);
      
      // Success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [selectedPlayer, onPlayerAdded]);
  
  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera not available</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        fps={30}
      />
      
      {/* AR Overlays */}
      {detectedPlayers.map((player) => (
        <Animated.View
          key={player.id}
          style={[
            styles.playerOverlay,
            {
              left: player.boundingBox.x,
              top: player.boundingBox.y,
              width: player.boundingBox.width,
              height: player.boundingBox.height,
              opacity: fadeAnim,
              transform: [
                { scale: selectedPlayer?.id === player.id ? pulseAnim : 1 }
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.overlayContent}
            onPress={() => selectPlayer(player)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.9)', 'rgba(139, 92, 246, 0.9)']}
              style={styles.overlayGradient}
            >
              {/* Player Info */}
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerTeam}>
                  {player.position} - {player.team}
                </Text>
              </View>
              
              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{player.stats.points}</Text>
                  <Text style={styles.statLabel}>Actual</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{player.stats.projected}</Text>
                  <Text style={styles.statLabel}>Projected</Text>
                </View>
              </View>
              
              {/* AR Visual Effects */}
              <View style={styles.arEffects}>
                <View style={styles.scanLine} />
                <View style={styles.corner} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ))}
      
      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.instructions}>
          <Icon name="camera-iris" size={20} color={colors.text} />
          <Text style={styles.instructionText}>
            {isScanning 
              ? 'Point camera at TV to detect players'
              : 'Tap "Add to Lineup" to confirm'
            }
          </Text>
        </View>
        
        {selectedPlayer && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={addSelectedPlayer}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.addButtonGradient}
            >
              <Icon name="plus" size={20} color={colors.text} />
              <Text style={styles.addButtonText}>Add to Lineup</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Scanning Animation */}
      {isScanning && (
        <View style={styles.scanningOverlay}>
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, screenHeight],
                  }),
                }],
              },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginTop: screenHeight / 2 - 50,
  },
  playerOverlay: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
  },
  overlayContent: {
    flex: 1,
  },
  overlayGradient: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  playerInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.xs,
    borderRadius: 8,
  },
  playerName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: 'bold',
  },
  playerTeam: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.xs,
    borderRadius: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h4,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  arEffects: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.8,
  },
  corner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: colors.primary,
  },
  controls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  closeButton: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  instructionText: {
    ...typography.body2,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  addButton: {
    alignSelf: 'center',
    borderRadius: 25,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  addButtonText: {
    ...typography.button,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
});