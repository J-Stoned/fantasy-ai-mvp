/**
 * Real-Time Probability Updater
 * 
 * Handles live updates to championship probabilities during games,
 * including WebSocket connections, live scoring, and dynamic recalculation.
 */

import { EventEmitter } from 'events';
import ChampionshipEngine, { 
  Team, 
  ChampionshipProbability, 
  MatchupSchedule 
} from './championship-engine';

export interface LiveGameEvent {
  type: 'score_update' | 'player_injury' | 'weather_change' | 'game_start' | 'game_end';
  gameId: string;
  teamId: string;
  data: any;
  timestamp: number;
}

export interface LiveScore {
  teamId: string;
  currentScore: number;
  projectedScore: number;
  timeRemaining: string;
  playersActive: string[];
  playersInactive: string[];
}

export interface ProbabilityUpdate {
  teamId: string;
  previousProbability: number;
  newProbability: number;
  change: number;
  reasons: string[];
  confidence: number;
  timestamp: number;
}

export interface RealTimeConfig {
  updateInterval: number; // milliseconds
  significantChangeThreshold: number; // percentage change to trigger alert
  enableNotifications: boolean;
  enableWebSocket: boolean;
  webSocketUrl?: string;
  maxHistoryLength: number;
}

export class RealTimeProbabilityUpdater extends EventEmitter {
  private championshipEngine: ChampionshipEngine;
  private config: RealTimeConfig;
  private webSocket: WebSocket | null = null;
  private updateTimer: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  
  // State management
  private currentScores: Map<string, LiveScore> = new Map();
  private lastProbabilities: Map<string, number> = new Map();
  private updateHistory: ProbabilityUpdate[] = [];
  private activeGames: Set<string> = new Set();
  
  // Performance optimization
  private lastFullUpdate: number = 0;
  private pendingUpdates: Set<string> = new Set();
  private batchUpdateTimer: NodeJS.Timeout | null = null;

  constructor(
    championshipEngine: ChampionshipEngine,
    config: Partial<RealTimeConfig> = {}
  ) {
    super();
    this.championshipEngine = championshipEngine;
    this.config = {
      updateInterval: 30000, // 30 seconds
      significantChangeThreshold: 5, // 5% change
      enableNotifications: true,
      enableWebSocket: true,
      maxHistoryLength: 1000,
      ...config
    };
  }

  /**
   * Start real-time updates
   */
  async start(): Promise<void> {
    if (this.isActive) {
      console.warn('Real-time updater is already active');
      return;
    }

    this.isActive = true;
    
    try {
      // Initialize WebSocket connection
      if (this.config.enableWebSocket && this.config.webSocketUrl) {
        await this.initializeWebSocket();
      }
      
      // Start periodic updates
      this.startPeriodicUpdates();
      
      // Initialize current state
      await this.performFullUpdate();
      
      this.emit('started');
      console.log('Real-time probability updater started');
      
    } catch (error) {
      this.isActive = false;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop real-time updates
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;
    
    // Clean up timers
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    if (this.batchUpdateTimer) {
      clearTimeout(this.batchUpdateTimer);
      this.batchUpdateTimer = null;
    }
    
    // Close WebSocket
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
    
    // Clear state
    this.currentScores.clear();
    this.activeGames.clear();
    this.pendingUpdates.clear();
    
    this.emit('stopped');
    console.log('Real-time probability updater stopped');
  }

  /**
   * Initialize WebSocket connection for live data
   */
  private async initializeWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.webSocket = new WebSocket(this.config.webSocketUrl!);
        
        this.webSocket.onopen = () => {
          console.log('WebSocket connected');
          this.emit('websocket_connected');
          resolve();
        };
        
        this.webSocket.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };
        
        this.webSocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('websocket_error', error);
          reject(error);
        };
        
        this.webSocket.onclose = () => {
          console.log('WebSocket disconnected');
          this.emit('websocket_disconnected');
          
          // Attempt to reconnect if still active
          if (this.isActive) {
            setTimeout(() => this.initializeWebSocket(), 5000);
          }
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message: LiveGameEvent = JSON.parse(event.data);
      this.processLiveEvent(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Process live game events
   */
  private processLiveEvent(event: LiveGameEvent): void {
    switch (event.type) {
      case 'score_update':
        this.handleScoreUpdate(event);
        break;
      case 'player_injury':
        this.handlePlayerInjury(event);
        break;
      case 'weather_change':
        this.handleWeatherChange(event);
        break;
      case 'game_start':
        this.handleGameStart(event);
        break;
      case 'game_end':
        this.handleGameEnd(event);
        break;
    }
  }

  /**
   * Handle live score updates
   */
  private handleScoreUpdate(event: LiveGameEvent): void {
    const { teamId, data } = event;
    
    const liveScore: LiveScore = {
      teamId,
      currentScore: data.currentScore,
      projectedScore: data.projectedScore,
      timeRemaining: data.timeRemaining,
      playersActive: data.playersActive || [],
      playersInactive: data.playersInactive || []
    };
    
    this.currentScores.set(teamId, liveScore);
    this.scheduleUpdate(teamId);
    
    this.emit('score_updated', { teamId, score: liveScore });
  }

  /**
   * Handle player injury events
   */
  private handlePlayerInjury(event: LiveGameEvent): void {
    const { teamId, data } = event;
    
    // Update injury status and trigger immediate recalculation
    this.emit('player_injury', {
      teamId,
      playerId: data.playerId,
      injuryType: data.injuryType,
      severity: data.severity
    });
    
    // Schedule high-priority update
    this.scheduleUpdate(teamId, true);
  }

  /**
   * Handle weather changes
   */
  private handleWeatherChange(event: LiveGameEvent): void {
    const { data } = event;
    
    this.emit('weather_change', {
      gameId: event.gameId,
      weather: data.weather
    });
    
    // Update all teams in affected games
    if (data.affectedTeams) {
      data.affectedTeams.forEach((teamId: string) => {
        this.scheduleUpdate(teamId);
      });
    }
  }

  /**
   * Handle game start events
   */
  private handleGameStart(event: LiveGameEvent): void {
    this.activeGames.add(event.gameId);
    this.emit('game_started', { gameId: event.gameId });
  }

  /**
   * Handle game end events
   */
  private handleGameEnd(event: LiveGameEvent): void {
    this.activeGames.delete(event.gameId);
    
    // Trigger final probability update
    if (event.data.teams) {
      event.data.teams.forEach((teamId: string) => {
        this.scheduleUpdate(teamId, true);
      });
    }
    
    this.emit('game_ended', { gameId: event.gameId, finalScores: event.data });
  }

  /**
   * Schedule a probability update for a team
   */
  private scheduleUpdate(teamId: string, highPriority: boolean = false): void {
    this.pendingUpdates.add(teamId);
    
    if (highPriority) {
      // Immediate update for critical events
      this.processPendingUpdates();
    } else {
      // Batch updates to avoid excessive recalculation
      if (!this.batchUpdateTimer) {
        this.batchUpdateTimer = setTimeout(() => {
          this.processPendingUpdates();
          this.batchUpdateTimer = null;
        }, 5000); // 5-second delay for batching
      }
    }
  }

  /**
   * Process all pending updates
   */
  private async processPendingUpdates(): Promise<void> {
    if (this.pendingUpdates.size === 0) return;
    
    const affectedTeams = Array.from(this.pendingUpdates);
    this.pendingUpdates.clear();
    
    try {
      // Get current live scores
      const liveScores = new Map<string, number>();
      for (const teamId of affectedTeams) {
        const liveScore = this.currentScores.get(teamId);
        if (liveScore) {
          liveScores.set(teamId, liveScore.currentScore);
        }
      }
      
      // Update probabilities with live data
      const updatedProbabilities = await this.updateProbabilitiesWithLiveData(
        affectedTeams,
        liveScores
      );
      
      // Process probability changes
      for (const probability of updatedProbabilities) {
        this.processProbabilityChange(probability);
      }
      
    } catch (error) {
      console.error('Error processing pending updates:', error);
      this.emit('update_error', error);
    }
  }

  /**
   * Update probabilities with live data
   */
  private async updateProbabilitiesWithLiveData(
    affectedTeams: string[],
    liveScores: Map<string, number>
  ): Promise<ChampionshipProbability[]> {
    // This would integrate with the championship engine
    // For now, simulate the update process
    
    const updatedProbabilities: ChampionshipProbability[] = [];
    
    for (const teamId of affectedTeams) {
      const currentProb = this.lastProbabilities.get(teamId) || 0;
      const liveScore = liveScores.get(teamId);
      
      if (liveScore !== undefined) {
        // Simulate probability change based on score performance
        const scoreImpact = this.calculateScoreImpact(teamId, liveScore);
        const newProb = Math.max(0, Math.min(1, currentProb + scoreImpact));
        
        updatedProbabilities.push({
          teamId,
          playoffProbability: 0.8, // Would calculate actual
          divisionWinProbability: 0.6,
          championshipProbability: newProb,
          expectedSeed: 3.5,
          strengthOfSchedule: 0.2,
          momentum: 0.1,
          keyFactors: [],
          optimalPath: {
            seed: 3,
            round1: { opponent: 'Team B', winProbability: 0.65 },
            round2: { opponent: 'Team C', winProbability: 0.55 },
            championship: { opponent: 'Team D', winProbability: 0.45 },
            totalProbability: newProb
          },
          simulations: []
        });
      }
    }
    
    return updatedProbabilities;
  }

  /**
   * Calculate impact of live score on probability
   */
  private calculateScoreImpact(teamId: string, liveScore: number): number {
    const liveData = this.currentScores.get(teamId);
    if (!liveData) return 0;
    
    const expectedScore = liveData.projectedScore;
    const scoreDiff = liveScore - expectedScore;
    
    // Convert score difference to probability impact
    // Positive score difference increases probability
    const baseImpact = scoreDiff / 100; // Scale: 10 points = 0.1 probability change
    
    // Factor in time remaining (more impact early in games)
    const timeMultiplier = this.getTimeMultiplier(liveData.timeRemaining);
    
    return baseImpact * timeMultiplier;
  }

  /**
   * Get time multiplier for score impact
   */
  private getTimeMultiplier(timeRemaining: string): number {
    // Parse time remaining (format: "HH:MM" or "MM:SS")
    const timeParts = timeRemaining.split(':');
    const totalMinutes = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
    
    // Full game is ~240 minutes (4 hours)
    const gameProgress = Math.max(0, Math.min(1, (240 - totalMinutes) / 240));
    
    // Earlier in game = higher impact
    return 1 - gameProgress * 0.7; // Range: 0.3 to 1.0
  }

  /**
   * Process probability changes and trigger notifications
   */
  private processProbabilityChange(probability: ChampionshipProbability): void {
    const teamId = probability.teamId;
    const newProb = probability.championshipProbability;
    const previousProb = this.lastProbabilities.get(teamId) || 0;
    const change = newProb - previousProb;
    const percentChange = Math.abs(change) * 100;
    
    // Update stored probability
    this.lastProbabilities.set(teamId, newProb);
    
    // Create update record
    const update: ProbabilityUpdate = {
      teamId,
      previousProbability: previousProb,
      newProbability: newProb,
      change,
      reasons: this.identifyChangeReasons(teamId, change),
      confidence: 0.8, // Would calculate actual confidence
      timestamp: Date.now()
    };
    
    // Add to history
    this.updateHistory.push(update);
    if (this.updateHistory.length > this.config.maxHistoryLength) {
      this.updateHistory.shift();
    }
    
    // Emit update event
    this.emit('probability_updated', update);
    
    // Check for significant changes
    if (percentChange >= this.config.significantChangeThreshold) {
      this.emit('significant_change', update);
      
      if (this.config.enableNotifications) {
        this.sendNotification(update);
      }
    }
  }

  /**
   * Identify reasons for probability change
   */
  private identifyChangeReasons(teamId: string, change: number): string[] {
    const reasons: string[] = [];
    const liveData = this.currentScores.get(teamId);
    
    if (liveData) {
      const scoreDiff = liveData.currentScore - liveData.projectedScore;
      
      if (change > 0) {
        if (scoreDiff > 10) reasons.push('Outperforming projections significantly');
        if (scoreDiff > 5) reasons.push('Scoring above expectations');
        if (liveData.playersActive.length > 8) reasons.push('Full roster active');
      } else {
        if (scoreDiff < -10) reasons.push('Major underperformance vs projections');
        if (scoreDiff < -5) reasons.push('Scoring below expectations');
        if (liveData.playersInactive.length > 2) reasons.push('Key players inactive');
      }
    }
    
    if (reasons.length === 0) {
      reasons.push(change > 0 ? 'General positive trends' : 'General negative trends');
    }
    
    return reasons;
  }

  /**
   * Send notification for significant changes
   */
  private sendNotification(update: ProbabilityUpdate): void {
    const message = this.createNotificationMessage(update);
    
    this.emit('notification', {
      type: 'probability_change',
      title: 'Championship Probability Alert',
      message,
      teamId: update.teamId,
      change: update.change,
      timestamp: update.timestamp
    });
  }

  /**
   * Create notification message
   */
  private createNotificationMessage(update: ProbabilityUpdate): string {
    const direction = update.change > 0 ? 'increased' : 'decreased';
    const magnitude = Math.abs(update.change * 100).toFixed(1);
    const newPercent = (update.newProbability * 100).toFixed(1);
    
    let message = `Team ${update.teamId} championship probability ${direction} by ${magnitude}% to ${newPercent}%`;
    
    if (update.reasons.length > 0) {
      message += `. Reason: ${update.reasons[0]}`;
    }
    
    return message;
  }

  /**
   * Start periodic full updates
   */
  private startPeriodicUpdates(): void {
    this.updateTimer = setInterval(async () => {
      try {
        await this.performFullUpdate();
      } catch (error) {
        console.error('Error in periodic update:', error);
        this.emit('update_error', error);
      }
    }, this.config.updateInterval);
  }

  /**
   * Perform full probability recalculation
   */
  private async performFullUpdate(): Promise<void> {
    const now = Date.now();
    
    // Skip if too recent
    if (now - this.lastFullUpdate < this.config.updateInterval / 2) {
      return;
    }
    
    this.lastFullUpdate = now;
    
    // This would trigger a full championship engine recalculation
    // For now, emit event for external handling
    this.emit('full_update_requested', {
      timestamp: now,
      activeGames: Array.from(this.activeGames),
      liveScores: Object.fromEntries(this.currentScores)
    });
  }

  /**
   * Get current update history
   */
  getUpdateHistory(limit?: number): ProbabilityUpdate[] {
    const history = [...this.updateHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Get current live scores
   */
  getLiveScores(): Map<string, LiveScore> {
    return new Map(this.currentScores);
  }

  /**
   * Get active games
   */
  getActiveGames(): Set<string> {
    return new Set(this.activeGames);
  }

  /**
   * Manually update live score (for testing or fallback)
   */
  updateLiveScore(teamId: string, score: Partial<LiveScore>): void {
    const existing = this.currentScores.get(teamId) || {
      teamId,
      currentScore: 0,
      projectedScore: 0,
      timeRemaining: '60:00',
      playersActive: [],
      playersInactive: []
    };
    
    const updated = { ...existing, ...score };
    this.currentScores.set(teamId, updated);
    this.scheduleUpdate(teamId);
  }

  /**
   * Force immediate update for team
   */
  async forceUpdate(teamId: string): Promise<void> {
    this.scheduleUpdate(teamId, true);
  }

  /**
   * Get configuration
   */
  getConfig(): RealTimeConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RealTimeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart if interval changed
    if (newConfig.updateInterval && this.isActive) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get current status
   */
  getStatus(): {
    isActive: boolean;
    connectedToWebSocket: boolean;
    activeGames: number;
    pendingUpdates: number;
    lastFullUpdate: number;
    totalUpdates: number;
  } {
    return {
      isActive: this.isActive,
      connectedToWebSocket: this.webSocket?.readyState === WebSocket.OPEN,
      activeGames: this.activeGames.size,
      pendingUpdates: this.pendingUpdates.size,
      lastFullUpdate: this.lastFullUpdate,
      totalUpdates: this.updateHistory.length
    };
  }
}

export default RealTimeProbabilityUpdater;