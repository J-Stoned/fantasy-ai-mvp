/**
 * AI Video Analysis for Game Highlights
 * Automatically identifies and clips important moments from game footage
 */

import * as tf from '@tensorflow/tfjs';
import { playerRecognition, DetectedPlayer, VideoFrame } from '../computer-vision/player-recognition';

export interface GameHighlight {
  id: string;
  type: 'touchdown' | 'big_play' | 'turnover' | 'injury' | 'celebration' | 'key_moment';
  startTime: number;
  endTime: number;
  players: string[];
  description: string;
  importance: number; // 0-1 score
  fantasyImpact: {
    players: Array<{
      playerId: string;
      playerName: string;
      pointsImpact: number;
    }>;
  };
  metadata: {
    quarter?: number;
    timeRemaining?: string;
    yardLine?: number;
    down?: number;
    distance?: number;
  };
}

export interface VideoAnalysisResult {
  highlights: GameHighlight[];
  playerStats: Map<string, {
    touches: number;
    targets: number;
    completions: number;
    yards: number;
    touchdowns: number;
  }>;
  gameFlow: Array<{
    timestamp: number;
    momentum: 'home' | 'away';
    score: { home: number; away: number };
  }>;
}

export class GameHighlightAnalyzer {
  private static instance: GameHighlightAnalyzer;
  private audioModel: tf.LayersModel | null = null;
  private playTypeModel: tf.LayersModel | null = null;
  private isInitialized = false;
  
  // Tracking state during analysis
  private currentPlay: {
    startTime: number;
    frames: VideoFrame[];
    audioFeatures: Float32Array[];
    excitement: number;
  } | null = null;
  
  private gameState = {
    score: { home: 0, away: 0 },
    quarter: 1,
    playerStats: new Map<string, any>()
  };
  
  private constructor() {}
  
  static getInstance(): GameHighlightAnalyzer {
    if (!GameHighlightAnalyzer.instance) {
      GameHighlightAnalyzer.instance = new GameHighlightAnalyzer();
    }
    return GameHighlightAnalyzer.instance;
  }
  
  /**
   * Initialize models for analysis
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize player recognition first
      await playerRecognition.initialize();
      
      // Create audio analysis model
      this.audioModel = await this.createAudioModel();
      
      // Create play type classification model
      this.playTypeModel = await this.createPlayTypeModel();
      
      this.isInitialized = true;
      console.log('Game highlight analyzer initialized');
    } catch (error) {
      console.error('Failed to initialize highlight analyzer:', error);
      throw error;
    }
  }
  
  /**
   * Analyze full game video for highlights
   */
  async analyzeGameVideo(
    videoElement: HTMLVideoElement,
    options: {
      onProgress?: (progress: number) => void;
      minHighlightDuration?: number;
      includeAudioAnalysis?: boolean;
    } = {}
  ): Promise<VideoAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const {
      onProgress,
      minHighlightDuration = 3,
      includeAudioAnalysis = true
    } = options;
    
    const highlights: GameHighlight[] = [];
    const duration = videoElement.duration;
    const frameRate = 10; // Process 10 frames per second
    const frameInterval = 1 / frameRate;
    
    // Reset game state
    this.gameState = {
      score: { home: 0, away: 0 },
      quarter: 1,
      playerStats: new Map()
    };
    
    // Process video in chunks
    let currentTime = 0;
    let frameBuffer: VideoFrame[] = [];
    
    while (currentTime < duration) {
      videoElement.currentTime = currentTime;
      await this.waitForVideoSeek(videoElement);
      
      // Detect players in current frame
      const frame = await this.processVideoFrame(videoElement, currentTime);
      frameBuffer.push(frame);
      
      // Analyze audio if enabled
      if (includeAudioAnalysis) {
        const audioFeatures = await this.analyzeAudioSegment(videoElement, currentTime);
        if (this.currentPlay) {
          this.currentPlay.audioFeatures.push(audioFeatures);
        }
      }
      
      // Check for play boundaries
      const playBoundary = await this.detectPlayBoundary(frameBuffer);
      
      if (playBoundary) {
        // Analyze the completed play
        const highlight = await this.analyzePlay(frameBuffer);
        
        if (highlight && highlight.endTime - highlight.startTime >= minHighlightDuration) {
          highlights.push(highlight);
          this.updateGameState(highlight);
        }
        
        // Reset for next play
        frameBuffer = [];
        this.currentPlay = null;
      }
      
      // Update progress
      currentTime += frameInterval;
      if (onProgress) {
        onProgress(currentTime / duration);
      }
    }
    
    // Generate game flow analysis
    const gameFlow = this.generateGameFlow(highlights);
    
    return {
      highlights,
      playerStats: this.gameState.playerStats,
      gameFlow
    };
  }
  
  /**
   * Analyze live stream in real-time
   */
  async analyzeLiveStream(
    videoElement: HTMLVideoElement,
    onHighlight: (highlight: GameHighlight) => void
  ): Promise<() => void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const frameBuffer: VideoFrame[] = [];
    const bufferDuration = 10; // Keep 10 seconds of frames
    const maxFrames = bufferDuration * 10; // At 10 fps
    
    // Start player recognition stream
    const stopPlayerRecognition = await playerRecognition.processVideoStream(
      videoElement,
      async (frame) => {
        frameBuffer.push(frame);
        
        // Maintain buffer size
        if (frameBuffer.length > maxFrames) {
          frameBuffer.shift();
        }
        
        // Check for highlights in recent frames
        const recentFrames = frameBuffer.slice(-30); // Last 3 seconds
        const highlight = await this.detectRealtimeHighlight(recentFrames);
        
        if (highlight) {
          onHighlight(highlight);
        }
      },
      10 // 10 fps
    );
    
    // Return cleanup function
    return () => {
      stopPlayerRecognition();
    };
  }
  
  /**
   * Process a single video frame
   */
  private async processVideoFrame(
    videoElement: HTMLVideoElement,
    timestamp: number
  ): Promise<VideoFrame> {
    const players = await playerRecognition.detectPlayersInImage(videoElement);
    
    return {
      timestamp,
      players,
      playType: this.detectPlayType(players)
    };
  }
  
  /**
   * Detect play boundaries using visual cues
   */
  private async detectPlayBoundary(frames: VideoFrame[]): Promise<boolean> {
    if (frames.length < 10) return false;
    
    // Check for common play boundary indicators:
    // 1. Significant player movement changes
    // 2. Camera angle changes
    // 3. Number of detected players changes dramatically
    
    const recentFrames = frames.slice(-10);
    const playerCounts = recentFrames.map(f => f.players.length);
    const avgPlayerCount = playerCounts.reduce((a, b) => a + b, 0) / playerCounts.length;
    const variance = playerCounts.reduce((sum, count) => 
      sum + Math.pow(count - avgPlayerCount, 2), 0
    ) / playerCounts.length;
    
    // High variance might indicate play boundary
    return variance > 5;
  }
  
  /**
   * Analyze a complete play for highlight potential
   */
  private async analyzePlay(frames: VideoFrame[]): Promise<GameHighlight | null> {
    if (frames.length === 0) return null;
    
    const startTime = frames[0].timestamp;
    const endTime = frames[frames.length - 1].timestamp;
    
    // Aggregate player appearances
    const playerAppearances = new Map<string, number>();
    const playerActions = new Map<string, Set<string>>();
    
    for (const frame of frames) {
      for (const player of frame.players) {
        const count = playerAppearances.get(player.playerId) || 0;
        playerAppearances.set(player.playerId, count + 1);
        
        if (player.action) {
          const actions = playerActions.get(player.playerId) || new Set();
          actions.add(player.action);
          playerActions.set(player.playerId, actions);
        }
      }
    }
    
    // Determine highlight type and importance
    const highlightType = this.classifyHighlight(frames, playerActions);
    if (!highlightType) return null;
    
    const importance = this.calculateImportance(highlightType, frames);
    
    // Get involved players
    const involvedPlayers = Array.from(playerAppearances.entries())
      .filter(([_, count]) => count > frames.length * 0.3)
      .map(([playerId]) => playerId);
    
    // Calculate fantasy impact
    const fantasyImpact = this.calculateFantasyImpact(
      highlightType,
      involvedPlayers,
      frames
    );
    
    return {
      id: `highlight_${startTime}`,
      type: highlightType,
      startTime,
      endTime,
      players: involvedPlayers,
      description: this.generateDescription(highlightType, involvedPlayers, frames),
      importance,
      fantasyImpact,
      metadata: {
        quarter: this.gameState.quarter,
        yardLine: frames[0].yardLine
      }
    };
  }
  
  /**
   * Classify highlight type based on detected actions
   */
  private classifyHighlight(
    frames: VideoFrame[],
    playerActions: Map<string, Set<string>>
  ): GameHighlight['type'] | null {
    // Check for touchdown
    const celebrations = Array.from(playerActions.values())
      .filter(actions => actions.has('celebrating')).length;
    if (celebrations > 0) {
      return 'touchdown';
    }
    
    // Check for big play (lots of running)
    const runningPlayers = Array.from(playerActions.values())
      .filter(actions => actions.has('running')).length;
    if (runningPlayers > 3) {
      return 'big_play';
    }
    
    // Check for turnover (sudden direction changes)
    const tacklingPlayers = Array.from(playerActions.values())
      .filter(actions => actions.has('tackling')).length;
    if (tacklingPlayers > 2) {
      return 'turnover';
    }
    
    return null;
  }
  
  /**
   * Calculate highlight importance score
   */
  private calculateImportance(
    type: GameHighlight['type'],
    frames: VideoFrame[]
  ): number {
    const baseScores: Record<GameHighlight['type'], number> = {
      touchdown: 0.9,
      big_play: 0.7,
      turnover: 0.8,
      injury: 0.6,
      celebration: 0.5,
      key_moment: 0.7
    };
    
    let score = baseScores[type];
    
    // Adjust based on game context
    if (this.gameState.quarter >= 4) {
      score *= 1.2; // Fourth quarter plays are more important
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Calculate fantasy point impact
   */
  private calculateFantasyImpact(
    type: GameHighlight['type'],
    players: string[],
    frames: VideoFrame[]
  ): GameHighlight['fantasyImpact'] {
    const impacts: GameHighlight['fantasyImpact']['players'] = [];
    
    for (const playerId of players) {
      let pointsImpact = 0;
      
      switch (type) {
        case 'touchdown':
          pointsImpact = 6; // TD points
          break;
        case 'big_play':
          pointsImpact = 2; // Estimated yardage points
          break;
        case 'turnover':
          pointsImpact = -2; // Negative for turnovers
          break;
      }
      
      // Get player name from frames
      const playerName = frames
        .flatMap(f => f.players)
        .find(p => p.playerId === playerId)?.playerName || 'Unknown';
      
      impacts.push({
        playerId,
        playerName,
        pointsImpact
      });
    }
    
    return { players: impacts };
  }
  
  /**
   * Generate human-readable description
   */
  private generateDescription(
    type: GameHighlight['type'],
    players: string[],
    frames: VideoFrame[]
  ): string {
    const playerNames = players.map(id => {
      const player = frames
        .flatMap(f => f.players)
        .find(p => p.playerId === id);
      return player?.playerName || 'Unknown';
    });
    
    switch (type) {
      case 'touchdown':
        return `Touchdown by ${playerNames[0] || 'Unknown'}!`;
      case 'big_play':
        return `Big play involving ${playerNames.join(', ')}`;
      case 'turnover':
        return `Turnover! Ball recovered by defense`;
      default:
        return `Key moment with ${playerNames.join(', ')}`;
    }
  }
  
  /**
   * Detect real-time highlights from recent frames
   */
  private async detectRealtimeHighlight(
    frames: VideoFrame[]
  ): Promise<GameHighlight | null> {
    // Quick check for celebration (touchdown indicator)
    const lastFrame = frames[frames.length - 1];
    const celebrations = lastFrame.players.filter(p => p.action === 'celebrating');
    
    if (celebrations.length > 0) {
      return this.analyzePlay(frames);
    }
    
    // Check for sudden player count changes (big play indicator)
    if (frames.length > 5) {
      const recentCounts = frames.slice(-5).map(f => f.players.length);
      const avgCount = recentCounts.reduce((a, b) => a + b) / recentCounts.length;
      const lastCount = recentCounts[recentCounts.length - 1];
      
      if (Math.abs(lastCount - avgCount) > 3) {
        return this.analyzePlay(frames);
      }
    }
    
    return null;
  }
  
  /**
   * Update game state based on highlight
   */
  private updateGameState(highlight: GameHighlight): void {
    // Update score for touchdowns
    if (highlight.type === 'touchdown') {
      // Simplified - would need team detection in reality
      this.gameState.score.home += 6;
    }
    
    // Update player stats
    for (const impact of highlight.fantasyImpact.players) {
      const stats = this.gameState.playerStats.get(impact.playerId) || {
        touches: 0,
        targets: 0,
        completions: 0,
        yards: 0,
        touchdowns: 0
      };
      
      if (highlight.type === 'touchdown') {
        stats.touchdowns++;
      }
      
      this.gameState.playerStats.set(impact.playerId, stats);
    }
  }
  
  /**
   * Generate game flow analysis
   */
  private generateGameFlow(highlights: GameHighlight[]): VideoAnalysisResult['gameFlow'] {
    const flow: VideoAnalysisResult['gameFlow'] = [];
    let currentMomentum: 'home' | 'away' = 'home';
    
    for (const highlight of highlights) {
      // Determine momentum based on highlight type
      if (highlight.type === 'touchdown' || highlight.type === 'big_play') {
        // Simplified - would use actual team detection
        currentMomentum = Math.random() > 0.5 ? 'home' : 'away';
      }
      
      flow.push({
        timestamp: highlight.startTime,
        momentum: currentMomentum,
        score: { ...this.gameState.score }
      });
    }
    
    return flow;
  }
  
  /**
   * Analyze audio segment for crowd noise, commentary
   */
  private async analyzeAudioSegment(
    videoElement: HTMLVideoElement,
    timestamp: number
  ): Promise<Float32Array> {
    // In a real implementation, this would extract and analyze audio
    // For now, return mock features
    const features = new Float32Array(128);
    for (let i = 0; i < 128; i++) {
      features[i] = Math.random();
    }
    return features;
  }
  
  /**
   * Detect play type from player positions/actions
   */
  private detectPlayType(players: DetectedPlayer[]): string | undefined {
    const actions = players.map(p => p.action).filter(Boolean);
    
    if (actions.includes('throwing')) return 'pass';
    if (actions.includes('running') && actions.length > 2) return 'run';
    if (actions.includes('catching')) return 'reception';
    
    return undefined;
  }
  
  /**
   * Wait for video seek to complete
   */
  private waitForVideoSeek(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      const checkSeek = () => {
        if (video.seeking) {
          requestAnimationFrame(checkSeek);
        } else {
          resolve();
        }
      };
      checkSeek();
    });
  }
  
  /**
   * Create audio analysis model
   */
  private async createAudioModel(): Promise<tf.LayersModel> {
    return tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [128],
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid'
        })
      ]
    });
  }
  
  /**
   * Create play type classification model
   */
  private async createPlayTypeModel(): Promise<tf.LayersModel> {
    return tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [50],
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 5,
          activation: 'softmax'
        })
      ]
    });
  }
}

// Export singleton instance
export const gameHighlightAnalyzer = GameHighlightAnalyzer.getInstance();