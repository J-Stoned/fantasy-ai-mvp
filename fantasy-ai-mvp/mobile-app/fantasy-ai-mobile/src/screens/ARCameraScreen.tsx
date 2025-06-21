import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Camera, 
  useCameraDevices, 
  useFrameProcessor 
} from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';

import { VisionService } from '../services/VisionService';
import { FantasyAPIService } from '../services/FantasyAPIService';
import { HapticService } from '../services/HapticService';
import { AppTheme } from '../theme/AppTheme';

const { width, height } = Dimensions.get('window');

interface PlayerDetection {
  id: string;
  name: string;
  jersey: string;
  position: { x: number; y: number; width: number; height: number };
  confidence: number;
  stats: {
    points: number;
    fantasyPoints: number;
    projectedPoints: number;
    ownership: number;
  };
  insights: string[];
}

interface GameOverlay {
  score: { home: number; away: number };
  quarter: string;
  timeRemaining: string;
  weather?: {
    condition: string;
    temperature: number;
    impact: string;
  };
}

const ARCameraScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [players, setPlayers] = useState<PlayerDetection[]>([]);
  const [gameData, setGameData] = useState<GameOverlay | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetection | null>(null);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);

  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.back;

  // Animations
  const scanLineY = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    checkCameraPermission();
    startScanAnimation();
  }, []);

  const checkCameraPermission = async () => {
    const permission = await Camera.requestCameraPermission();
    setHasPermission(permission === 'authorized');
    
    if (permission !== 'authorized') {
      Alert.alert(
        'Camera Permission Required',
        'Fantasy.AI needs camera access for AR features.',
        [{ text: 'OK' }]
      );
    }
  };

  const startScanAnimation = () => {
    scanLineY.value = withSpring(height * 0.8, { duration: 2000 });
    setTimeout(() => {
      scanLineY.value = withSpring(height * 0.2, { duration: 2000 });
      startScanAnimation();
    }, 2000);
  };

  // Frame processor for real-time player detection
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    if (isAnalyzing) return;
    
    // Run computer vision analysis
    const detectedPlayers = VisionService.detectPlayers(frame);
    
    if (detectedPlayers.length > 0) {
      runOnJS(updatePlayerDetections)(detectedPlayers);
    }
  }, [isAnalyzing]);

  const updatePlayerDetections = async (detectedPlayers: any[]) => {
    try {
      setIsAnalyzing(true);
      
      // Get fantasy data for detected players
      const playerData = await Promise.all(
        detectedPlayers.map(async (detection) => {
          const fantasyData = await FantasyAPIService.getPlayerLiveData(detection.playerId);
          const insights = await FantasyAPIService.getPlayerInsights(detection.playerName);
          
          return {
            id: detection.playerId,
            name: detection.playerName,
            jersey: detection.jerseyNumber,
            position: detection.boundingBox,
            confidence: detection.confidence,
            stats: fantasyData,
            insights: insights.keyTakeaways || []
          };
        })
      );

      setPlayers(playerData);
      overlayOpacity.value = withSpring(1);
      HapticService.impact('light');
      
    } catch (error) {
      console.error('Player detection error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!camera.current) return;

    try {
      setIsAnalyzing(true);
      HapticService.impact('medium');

      // Capture photo
      const photo = await camera.current.takePhoto({
        quality: 'high',
        enableAutoRedEyeReduction: true,
      });

      setCapturedFrame(photo.path);

      // Analyze the captured frame
      const analysisResult = await VisionService.analyzeGameFrame(photo.path);
      
      if (analysisResult.gameData) {
        setGameData(analysisResult.gameData);
      }

      if (analysisResult.players) {
        await updatePlayerDetections(analysisResult.players);
      }

      HapticService.success();

    } catch (error) {
      console.error('Capture and analyze error:', error);
      HapticService.error();
      Alert.alert('Analysis Error', 'Failed to analyze the frame. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPlayerInsights = async (player: PlayerDetection) => {
    try {
      setSelectedPlayer(player);
      
      // Get real-time insights
      const [
        liveStats,
        multimediaInsights,
        weatherImpact,
        injuryStatus
      ] = await Promise.all([
        FantasyAPIService.getPlayerLiveStats(player.id),
        FantasyAPIService.getMultimediaInsights(player.name),
        FantasyAPIService.getWeatherImpact([player.id]),
        FantasyAPIService.getInjuryStatus(player.id)
      ]);

      // Update player with fresh data
      const updatedPlayer = {
        ...player,
        stats: { ...player.stats, ...liveStats },
        insights: [
          ...player.insights,
          ...multimediaInsights.keyTakeaways,
          weatherImpact.recommendations,
          injuryStatus.status !== 'healthy' ? `Injury: ${injuryStatus.description}` : ''
        ].filter(Boolean)
      };

      setSelectedPlayer(updatedPlayer);
      HapticService.impact('light');

    } catch (error) {
      console.error('Player insights error:', error);
    }
  };

  const renderPlayerOverlay = (player: PlayerDetection) => {
    const overlayStyle = useAnimatedStyle(() => ({
      position: 'absolute',
      left: player.position.x,
      top: player.position.y,
      width: player.position.width,
      height: player.position.height,
      opacity: overlayOpacity.value,
    }));

    return (
      <Animated.View key={player.id} style={overlayStyle}>
        <TouchableOpacity
          onPress={() => getPlayerInsights(player)}
          style={styles.playerBoundingBox}
        >
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)']}
            style={styles.playerTag}
          >
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerJersey}>#{player.jersey}</Text>
            <Text style={styles.fantasyPoints}>
              {player.stats.fantasyPoints.toFixed(1)} pts
            </Text>
          </LinearGradient>
          
          {/* Confidence indicator */}
          <View style={styles.confidenceIndicator}>
            <View 
              style={[
                styles.confidenceBar,
                { width: `${player.confidence * 100}%` }
              ]} 
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderGameOverlay = () => {
    if (!gameData) return null;

    return (
      <View style={styles.gameOverlayContainer}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
          style={styles.gameOverlay}
        >
          <View style={styles.scoreContainer}>
            <Text style={styles.score}>
              {gameData.score.home} - {gameData.score.away}
            </Text>
            <Text style={styles.gameTime}>
              {gameData.quarter} • {gameData.timeRemaining}
            </Text>
          </View>
          
          {gameData.weather && (
            <View style={styles.weatherContainer}>
              <Icon name="wb-sunny" size={16} color="white" />
              <Text style={styles.weatherText}>
                {gameData.weather.condition} • {gameData.weather.temperature}°F
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  const renderSelectedPlayerPanel = () => {
    if (!selectedPlayer) return null;

    return (
      <View style={styles.playerPanelContainer}>
        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.8)']}
          style={styles.playerPanel}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedPlayer(null)}
          >
            <Icon name="close" size={24} color="white" />
          </TouchableOpacity>

          <Text style={styles.selectedPlayerName}>{selectedPlayer.name}</Text>
          <Text style={styles.selectedPlayerJersey}>#{selectedPlayer.jersey}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{selectedPlayer.stats.fantasyPoints.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Fantasy Pts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{selectedPlayer.stats.projectedPoints.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Projected</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{selectedPlayer.stats.ownership}%</Text>
              <Text style={styles.statLabel}>Owned</Text>
            </View>
          </View>

          <View style={styles.insightsContainer}>
            <Text style={styles.insightsTitle}>🎙️ AI Insights</Text>
            {selectedPlayer.insights.slice(0, 3).map((insight, index) => (
              <Text key={index} style={styles.insightText}>• {insight}</Text>
            ))}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderControls = () => (
    <View style={styles.controlsContainer}>
      <TouchableOpacity
        style={[styles.controlButton, isAnalyzing && styles.controlButtonDisabled]}
        onPress={captureAndAnalyze}
        disabled={isAnalyzing}
      >
        <Icon 
          name={isAnalyzing ? "hourglass-empty" : "camera-alt"} 
          size={24} 
          color="white" 
        />
        <Text style={styles.controlButtonText}>
          {isAnalyzing ? 'Analyzing...' : 'Analyze Frame'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => setPlayers([])}
      >
        <Icon name="clear" size={24} color="white" />
        <Text style={styles.controlButtonText}>Clear</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => setIsActive(!isActive)}
      >
        <Icon name={isActive ? "videocam" : "videocam-off"} size={24} color="white" />
        <Text style={styles.controlButtonText}>
          {isActive ? 'Pause' : 'Resume'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderScanOverlay = () => {
    const scanLineStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: scanLineY.value }],
    }));

    return (
      <View style={styles.scanOverlay}>
        <Animated.View style={[styles.scanLine, scanLineStyle]} />
        <View style={styles.scanCorners}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>
    );
  };

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Icon name="camera-alt" size={64} color={AppTheme.colors.primary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Fantasy.AI needs camera access to provide AR live game analysis.
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={checkCameraPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Camera not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
        enableZoomGesture
        photo
      />

      {/* AR Overlays */}
      {renderScanOverlay()}
      {players.map(renderPlayerOverlay)}
      {renderGameOverlay()}
      {renderSelectedPlayerPanel()}
      
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'transparent']}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>🎯 AR Live Analysis</Text>
          <Text style={styles.headerSubtitle}>
            Point at your TV for real-time insights
          </Text>
        </LinearGradient>
      </View>

      {/* Controls */}
      {renderControls()}

      {/* Player count indicator */}
      {players.length > 0 && (
        <View style={styles.playerCountContainer}>
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)']}
            style={styles.playerCountBadge}
          >
            <Icon name="people" size={16} color="white" />
            <Text style={styles.playerCountText}>{players.length} detected</Text>
          </LinearGradient>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: AppTheme.colors.background,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppTheme.colors.text,
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: AppTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: AppTheme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'white',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  scanLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: AppTheme.colors.primary,
    shadowColor: AppTheme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  scanCorners: {
    position: 'absolute',
    top: height * 0.2,
    left: 20,
    right: 20,
    bottom: height * 0.2,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: AppTheme.colors.primary,
    borderWidth: 2,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  playerBoundingBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: AppTheme.colors.primary,
    borderRadius: 8,
  },
  playerTag: {
    position: 'absolute',
    top: -40,
    left: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 120,
  },
  playerName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  playerJersey: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  fantasyPoints: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  confidenceIndicator: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  confidenceBar: {
    height: '100%',
    backgroundColor: AppTheme.colors.primary,
    borderRadius: 2,
  },
  gameOverlayContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
  },
  gameOverlay: {
    padding: 16,
    borderRadius: 12,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  gameTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 6,
  },
  playerPanelContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
  },
  playerPanel: {
    padding: 20,
    borderRadius: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  selectedPlayerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  selectedPlayerJersey: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppTheme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  insightsContainer: {
    marginTop: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 6,
    lineHeight: 20,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlButtonText: {
    fontSize: 12,
    color: 'white',
    marginTop: 4,
    textAlign: 'center',
  },
  playerCountContainer: {
    position: 'absolute',
    top: 200,
    right: 20,
  },
  playerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  playerCountText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 6,
    fontWeight: 'bold',
  },
});

export default ARCameraScreen;