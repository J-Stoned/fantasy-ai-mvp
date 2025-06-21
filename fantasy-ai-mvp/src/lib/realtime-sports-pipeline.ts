import { EventEmitter } from "events";
import { prisma } from "./prisma";
import { webSocketManager } from "./websocket-manager";
import { aiLineupOptimizer } from "./ai-lineup-optimizer";
import { valueBalancingCalculator } from "./value-balancing-calculator";
import { mcpDataCollectionService, PlayerNewsItem, WeatherData, DepthChartUpdate } from "./mcp-data-collection-service";

export interface GameEvent {
  id: string;
  gameId: string;
  timestamp: Date;
  type: "touchdown" | "field_goal" | "interception" | "fumble" | "injury" | "quarter_end" | "drive_start" | "play";
  team?: string;
  players: string[];
  description: string;
  fantasyImpact: {
    playerId: string;
    pointsChange: number;
    projectionChange?: number;
  }[];
  metadata?: any;
}

export interface PlayerStats {
  playerId: string;
  gameId: string;
  stats: {
    passingYards?: number;
    passingTDs?: number;
    rushingYards?: number;
    rushingTDs?: number;
    receivingYards?: number;
    receivingTDs?: number;
    receptions?: number;
    targets?: number;
    carries?: number;
    fantasyPoints: number;
  };
  live: {
    onField: boolean;
    snapCount: number;
    redZoneTargets: number;
    targetShare: number;
    airbYards: number;
    yardsAfterContact?: number;
  };
}

export interface GameState {
  gameId: string;
  status: "pregame" | "live" | "halftime" | "final";
  quarter: number;
  timeRemaining: string;
  score: { home: number; away: number };
  possession?: string;
  fieldPosition?: number;
  down?: number;
  distance?: number;
  weather?: {
    temperature: number;
    windSpeed: number;
    precipitation: string;
    dome: boolean;
  };
}

export interface OddsUpdate {
  playerId: string;
  propType: string;
  line: number;
  overOdds: number;
  underOdds: number;
  movement: "up" | "down" | "neutral";
  volume: number;
  sharpMoney?: "over" | "under" | "neutral";
}

export class RealtimeSportsPipeline extends EventEmitter {
  private dataProviders: Map<string, any> = new Map();
  private gameStates: Map<string, GameState> = new Map();
  private playerStats: Map<string, PlayerStats> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private eventBuffer: GameEvent[] = [];
  private processingQueue: boolean = false;

  constructor() {
    super();
    this.initializeDataProviders();
    this.initializeMCPIntegration();
  }

  /**
   * Initialize connections to multiple sports data providers
   */
  private initializeDataProviders() {
    // In production, these would be real API connections
    // For now, we'll simulate multiple data sources
    
    this.dataProviders.set("primary", {
      name: "SportsDataIO",
      priority: 1,
      latency: 50,
      reliability: 0.99
    });

    this.dataProviders.set("secondary", {
      name: "FantasyData",
      priority: 2,
      latency: 75,
      reliability: 0.97
    });

    this.dataProviders.set("betting", {
      name: "OddsAPI",
      priority: 3,
      latency: 25,
      reliability: 0.98
    });

    this.dataProviders.set("social", {
      name: "TwitterStream",
      priority: 4,
      latency: 100,
      reliability: 0.90
    });
  }

  /**
   * Initialize MCP data collection integration
   */
  private initializeMCPIntegration() {
    // Subscribe to MCP data collection events
    mcpDataCollectionService.on("enhancedGameEvent", (event: GameEvent) => {
      console.log("🎯 MCP Enhanced Game Event:", event.description);
      this.eventBuffer.push(event);
      this.emit("gameEvent", event);
    });

    mcpDataCollectionService.on("playerNews", (news: PlayerNewsItem) => {
      console.log("📰 MCP Player News:", news.headline);
      this.handlePlayerNews(news);
    });

    mcpDataCollectionService.on("weatherUpdate", (weather: WeatherData) => {
      console.log("🌤️ MCP Weather Update:", weather.stadium);
      this.handleWeatherUpdate(weather);
    });

    mcpDataCollectionService.on("depthChartUpdate", (depthChart: DepthChartUpdate) => {
      console.log("📊 MCP Depth Chart Update:", depthChart.teamId, depthChart.position);
      this.handleDepthChartUpdate(depthChart);
    });

    mcpDataCollectionService.on("dataCollected", (metrics: any) => {
      // Log collection metrics for monitoring
      console.log(`📈 MCP Data Collection: ${metrics.sourceName} (${metrics.collectionTime}ms)`);
    });

    mcpDataCollectionService.on("collectionError", (error: any) => {
      console.error(`❌ MCP Collection Error: ${error.sourceName} - ${error.error}`);
    });
  }

  /**
   * Handle player news from MCP sources
   */
  private async handlePlayerNews(news: PlayerNewsItem) {
    // Convert high-impact news to game events
    if (news.severity === "high" || news.severity === "critical") {
      const gameEvent: GameEvent = {
        id: `news_${news.playerId}_${Date.now()}`,
        gameId: "general", // News might not be game-specific
        timestamp: news.timestamp,
        type: news.type === "injury" ? "injury" : "play",
        players: [news.playerId],
        description: news.headline,
        fantasyImpact: [
          {
            playerId: news.playerId,
            pointsChange: news.impact.projectedChange,
            projectionChange: news.impact.projectedChange * 1.2
          }
        ],
        metadata: {
          newsSource: news.source,
          severity: news.severity,
          confidence: news.impact.confidence,
          timeframe: news.impact.timeframe
        }
      };

      this.eventBuffer.push(gameEvent);
      this.emit("gameEvent", gameEvent);
    }

    // Broadcast news to relevant users
    const impactedUsers = await this.getImpactedUsers([news.playerId]);
    for (const userId of impactedUsers) {
      await webSocketManager.sendUserNotification(userId, {
        type: "wager_matched",
        title: `📰 ${news.severity.toUpperCase()} News: ${news.playerName}`,
        message: news.headline,
        data: {
          news,
          suggestedAction: this.getSuggestedActionForNews(news)
        }
      });
    }
  }

  /**
   * Handle weather updates from MCP sources
   */
  private async handleWeatherUpdate(weather: WeatherData) {
    // Update game state with weather data
    const gameState = this.gameStates.get(weather.gameId);
    if (gameState) {
      gameState.weather = {
        temperature: weather.temperature,
        windSpeed: weather.windSpeed,
        precipitation: weather.precipitation > 0 ? "rain" : "clear",
        dome: weather.dome
      };
    }

    // Broadcast weather alerts for significant impact
    const totalImpact = Math.abs(weather.fantasyImpact.passingImpact) + 
                       Math.abs(weather.fantasyImpact.kickingImpact) + 
                       Math.abs(weather.fantasyImpact.runningImpact);

    if (totalImpact > 2) {
      await webSocketManager.broadcastLiveBettingUpdate({
        type: "market_movement",
        data: {
          type: "weather_alert",
          gameId: weather.gameId,
          stadium: weather.stadium,
          conditions: {
            temperature: weather.temperature,
            windSpeed: weather.windSpeed,
            precipitation: weather.precipitation
          },
          fantasyImpact: weather.fantasyImpact
        },
        timestamp: weather.timestamp
      }, "global");
    }
  }

  /**
   * Handle depth chart updates from MCP sources
   */
  private async handleDepthChartUpdate(depthChart: DepthChartUpdate) {
    // Check for significant changes in playing time
    for (const player of depthChart.players) {
      if (player.depth === 1 && player.percentage < 50) {
        // Starting player with low snap count - potential concern
        const concernEvent: GameEvent = {
          id: `depth_${player.playerId}_${Date.now()}`,
          gameId: "general",
          timestamp: depthChart.lastUpdated,
          type: "play",
          players: [player.playerId],
          description: `${player.playerName} depth chart concern: ${player.percentage}% snap share`,
          fantasyImpact: [
            {
              playerId: player.playerId,
              pointsChange: -2,
              projectionChange: -3
            }
          ],
          metadata: {
            depthPosition: player.depth,
            snapPercentage: player.percentage,
            position: depthChart.position,
            team: depthChart.teamId
          }
        };

        this.eventBuffer.push(concernEvent);
        this.emit("gameEvent", concernEvent);
      }
    }
  }

  /**
   * Get suggested action based on news severity and type
   */
  private getSuggestedActionForNews(news: PlayerNewsItem): string {
    if (news.type === "injury" && news.severity === "critical") {
      return "Consider benching this player immediately";
    }
    if (news.type === "inactive") {
      return "Remove from lineup and find replacement";
    }
    if (news.type === "lineup_change" && news.impact.projectedChange > 5) {
      return "Consider adding to lineup - increased opportunity";
    }
    if (news.type === "weather" && news.impact.projectedChange < -3) {
      return "Weather may negatively impact performance";
    }
    return "Monitor situation for further updates";
  }

  /**
   * Start the real-time data pipeline
   */
  async start() {
    console.log("🚀 Starting real-time sports data pipeline...");

    // Start MCP-enhanced data collection
    await mcpDataCollectionService.start();

    // Start data collection from all providers
    this.startDataCollection();

    // Start event processing
    this.startEventProcessing();

    // Start periodic state updates
    this.updateInterval = setInterval(() => {
      this.broadcastStateUpdates();
    }, 1000); // Update every second

    // Subscribe to game events
    this.on("gameEvent", this.handleGameEvent.bind(this));
    this.on("statsUpdate", this.handleStatsUpdate.bind(this));
    this.on("oddsUpdate", this.handleOddsUpdate.bind(this));
  }

  /**
   * Stop the pipeline
   */
  stop() {
    // Stop MCP data collection
    mcpDataCollectionService.stop();
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.removeAllListeners();
    console.log("🛑 Real-time sports data pipeline stopped");
  }

  /**
   * Start collecting data from all providers
   */
  private startDataCollection() {
    // Simulate real-time data from multiple sources
    setInterval(() => {
      this.simulateGameEvents();
    }, 5000); // New events every 5 seconds

    setInterval(() => {
      this.simulateStatsUpdates();
    }, 2000); // Stats updates every 2 seconds

    setInterval(() => {
      this.simulateOddsMovements();
    }, 3000); // Odds updates every 3 seconds
  }

  /**
   * Process queued events with intelligent batching
   */
  private async startEventProcessing() {
    setInterval(async () => {
      if (this.processingQueue || this.eventBuffer.length === 0) return;

      this.processingQueue = true;
      const events = [...this.eventBuffer];
      this.eventBuffer = [];

      // Process events in parallel by type
      const eventsByType = this.groupEventsByType(events);
      
      await Promise.all([
        this.processScoringEvents(eventsByType.scoring || []),
        this.processStatEvents(eventsByType.stats || []),
        this.processInjuryEvents(eventsByType.injury || []),
        this.processBettingEvents(eventsByType.betting || [])
      ]);

      this.processingQueue = false;
    }, 100); // Process every 100ms
  }

  /**
   * Handle incoming game events
   */
  private async handleGameEvent(event: GameEvent) {
    // Update game state
    const gameState = this.gameStates.get(event.gameId);
    if (gameState) {
      this.updateGameStateFromEvent(gameState, event);
    }

    // Calculate fantasy impact
    const impactedUsers = await this.getImpactedUsers(event.players);

    // Notify affected users immediately
    for (const userId of impactedUsers) {
      await webSocketManager.sendUserNotification(userId, {
        type: "wager_matched",
        title: `${event.type.toUpperCase()} Alert!`,
        message: event.description,
        data: {
          event,
          fantasyImpact: event.fantasyImpact
        }
      });
    }

    // Update live betting odds if applicable
    if (["touchdown", "field_goal", "turnover"].includes(event.type)) {
      await this.recalculateLiveOdds(event);
    }

    // Trigger AI lineup adjustments for major events
    if (event.type === "injury") {
      await this.triggerEmergencyLineupAdjustments(event);
    }

    // Log high-impact events
    if (event.fantasyImpact.some(impact => Math.abs(impact.pointsChange) > 6)) {
      console.log(`🔥 HIGH IMPACT EVENT: ${event.description}`);
    }
  }

  /**
   * Handle stats updates
   */
  private async handleStatsUpdate(update: PlayerStats) {
    const oldStats = this.playerStats.get(update.playerId);
    this.playerStats.set(update.playerId, update);

    // Calculate deltas
    const pointsDelta = oldStats 
      ? update.stats.fantasyPoints - oldStats.stats.fantasyPoints 
      : update.stats.fantasyPoints;

    if (Math.abs(pointsDelta) > 0) {
      // Update live wager values
      await valueBalancingCalculator.updateLivePlayerValues(`game_${update.gameId}`);

      // Broadcast to relevant rooms
      await webSocketManager.broadcastWagerUpdate({
        type: "value_change",
        wagerId: `game_${update.gameId}`,
        data: {
          playerId: update.playerId,
          pointsChange: pointsDelta,
          newTotal: update.stats.fantasyPoints
        },
        timestamp: new Date()
      });
    }

    // Check for milestone alerts
    await this.checkMilestones(update);
  }

  /**
   * Handle odds updates
   */
  private async handleOddsUpdate(update: OddsUpdate) {
    // Broadcast to live betting interface
    await webSocketManager.broadcastLiveBettingUpdate({
      type: "odds_change",
      data: update,
      timestamp: new Date()
    }, "global");

    // Alert users with active bets on this prop
    const activeBets = await this.getActiveBetsForProp(update.playerId, update.propType);
    
    for (const bet of activeBets) {
      // Calculate if cash out value has changed significantly
      const cashOutDelta = this.calculateCashOutDelta(bet, update);
      
      if (Math.abs(cashOutDelta) > bet.stake * 0.1) { // 10% change
        await webSocketManager.sendUserNotification(bet.userId, {
          type: "wager_matched",
          title: "Cash Out Opportunity",
          message: `Your ${update.propType} bet value changed by ${cashOutDelta > 0 ? '+' : ''}$${cashOutDelta.toFixed(2)}`,
          data: { bet, update }
        });
      }
    }
  }

  /**
   * Simulate game events (replace with real API in production)
   */
  private simulateGameEvents() {
    const events: GameEvent[] = [
      {
        id: `evt_${Date.now()}_1`,
        gameId: "game_sf_dal",
        timestamp: new Date(),
        type: "touchdown",
        team: "SF",
        players: ["cmc"],
        description: "Christian McCaffrey 12 yard rushing touchdown",
        fantasyImpact: [
          { playerId: "cmc", pointsChange: 7.2 }
        ]
      },
      {
        id: `evt_${Date.now()}_2`,
        gameId: "game_min_gb",
        timestamp: new Date(),
        type: "play",
        team: "MIN",
        players: ["jj", "kc"],
        description: "Kirk Cousins 23 yard pass to Justin Jefferson",
        fantasyImpact: [
          { playerId: "jj", pointsChange: 2.3 },
          { playerId: "kc", pointsChange: 0.92 }
        ]
      }
    ];

    // Randomly emit events
    if (Math.random() > 0.7) {
      const event = events[Math.floor(Math.random() * events.length)];
      this.eventBuffer.push(event);
      this.emit("gameEvent", event);
    }
  }

  /**
   * Simulate stats updates
   */
  private simulateStatsUpdates() {
    const players = ["cmc", "jj", "ja", "tk"];
    const player = players[Math.floor(Math.random() * players.length)];

    const stats: PlayerStats = {
      playerId: player,
      gameId: "game_sf_dal",
      stats: {
        rushingYards: Math.floor(Math.random() * 100),
        rushingTDs: Math.floor(Math.random() * 2),
        receivingYards: Math.floor(Math.random() * 80),
        receptions: Math.floor(Math.random() * 8),
        fantasyPoints: Math.random() * 25
      },
      live: {
        onField: Math.random() > 0.3,
        snapCount: Math.floor(Math.random() * 40),
        redZoneTargets: Math.floor(Math.random() * 3),
        targetShare: Math.random() * 0.35,
        airbYards: Math.floor(Math.random() * 100),
        yardsAfterContact: Math.floor(Math.random() * 50)
      }
    };

    this.emit("statsUpdate", stats);
  }

  /**
   * Simulate odds movements
   */
  private simulateOddsMovements() {
    const players = ["cmc", "jj", "ja", "tk"];
    const propTypes = ["rushing_yards", "receiving_yards", "touchdowns", "receptions"];
    
    const update: OddsUpdate = {
      playerId: players[Math.floor(Math.random() * players.length)],
      propType: propTypes[Math.floor(Math.random() * propTypes.length)],
      line: 50 + Math.floor(Math.random() * 100),
      overOdds: -110 + Math.floor(Math.random() * 40) - 20,
      underOdds: -110 + Math.floor(Math.random() * 40) - 20,
      movement: ["up", "down", "neutral"][Math.floor(Math.random() * 3)] as any,
      volume: Math.floor(Math.random() * 50000),
      sharpMoney: Math.random() > 0.5 ? "over" : "under"
    };

    this.emit("oddsUpdate", update);
  }

  /**
   * Broadcast current state updates to all connected clients
   */
  private async broadcastStateUpdates() {
    const states = Array.from(this.gameStates.values());
    const stats = Array.from(this.playerStats.values());

    // Broadcast game states
    for (const state of states) {
      await webSocketManager.broadcastLiveBettingUpdate({
        type: "market_movement",
        data: {
          gameId: state.gameId,
          state,
          lastUpdate: new Date()
        },
        timestamp: new Date()
      }, "global");
    }

    // Update active wager values
    await this.updateActiveWagerValues();
  }

  /**
   * Get users impacted by player events
   */
  private async getImpactedUsers(playerIds: string[]): Promise<string[]> {
    const rosters = await prisma.roster.findMany({
      where: {
        playerId: { in: playerIds },
        team: {
          league: {
            wageringEnabled: true
          }
        }
      },
      select: {
        team: {
          select: { userId: true }
        }
      }
    });

    return [...new Set(rosters.map(r => r.team.userId))];
  }

  /**
   * Recalculate live odds after major events
   */
  private async recalculateLiveOdds(event: GameEvent) {
    // This would integrate with odds providers and ML models
    const impactFactor = event.type === "touchdown" ? 0.8 : 0.9;
    
    // Simulate odds recalculation
    for (const impact of event.fantasyImpact) {
      const newOdds: OddsUpdate = {
        playerId: impact.playerId,
        propType: "total_points",
        line: 15 + impact.pointsChange,
        overOdds: -110,
        underOdds: -110,
        movement: impact.pointsChange > 0 ? "up" : "down",
        volume: 10000,
        sharpMoney: "neutral"
      };

      this.emit("oddsUpdate", newOdds);
    }
  }

  /**
   * Trigger emergency lineup adjustments for injuries
   */
  private async triggerEmergencyLineupAdjustments(event: GameEvent) {
    const injuredPlayerId = event.players[0];
    
    // Find all lineups with this player
    const affectedLineups = await prisma.roster.findMany({
      where: {
        playerId: injuredPlayerId,
        isStarter: true
      },
      include: {
        team: {
          include: { user: true }
        }
      }
    });

    for (const roster of affectedLineups) {
      // Use AI to suggest replacement
      const lineup = await aiLineupOptimizer.adjustLineupForNews(
        [roster] as any,
        {
          type: "injury",
          affectedPlayers: [injuredPlayerId],
          severity: "critical",
          details: event.description
        }
      );

      // Notify user
      await webSocketManager.sendUserNotification(roster.team.userId, {
        type: "wager_matched",
        title: "⚠️ Injury Alert - Lineup Adjustment Needed",
        message: event.description,
        data: {
          suggestedChanges: lineup.changes,
          projectedImpact: lineup.projectedImpact
        }
      });
    }
  }

  /**
   * Check for milestone achievements
   */
  private async checkMilestones(stats: PlayerStats) {
    const milestones = [
      { stat: "rushingYards", threshold: 100, name: "100 Yard Rusher" },
      { stat: "receivingYards", threshold: 100, name: "100 Yard Receiver" },
      { stat: "passingYards", threshold: 300, name: "300 Yard Passer" },
      { stat: "fantasyPoints", threshold: 30, name: "30 Point Game" }
    ];

    for (const milestone of milestones) {
      const value = (stats.stats as any)[milestone.stat];
      if (value >= milestone.threshold) {
        await this.broadcastMilestoneAlert(stats.playerId, milestone.name, value);
      }
    }
  }

  /**
   * Broadcast milestone alerts
   */
  private async broadcastMilestoneAlert(playerId: string, milestone: string, value: number) {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { name: true }
    });

    if (player) {
      await webSocketManager.broadcastLiveBettingUpdate({
        type: "market_movement",
        data: {
          type: "milestone",
          player: player.name,
          achievement: milestone,
          value,
          celebration: true
        },
        timestamp: new Date()
      }, "global");
    }
  }

  /**
   * Update values for all active wagers
   */
  private async updateActiveWagerValues() {
    const activeWagers = await prisma.wager.findMany({
      where: { status: "ACTIVE" },
      select: { id: true }
    });

    for (const wager of activeWagers) {
      await valueBalancingCalculator.updateLivePlayerValues(wager.id);
    }
  }

  /**
   * Helper methods
   */
  private groupEventsByType(events: GameEvent[]) {
    return events.reduce((acc, event) => {
      const category = this.getEventCategory(event.type);
      if (!acc[category]) acc[category] = [];
      acc[category].push(event);
      return acc;
    }, {} as Record<string, GameEvent[]>);
  }

  private getEventCategory(type: string): string {
    const categories: Record<string, string> = {
      touchdown: "scoring",
      field_goal: "scoring",
      interception: "stats",
      fumble: "stats",
      injury: "injury",
      play: "stats"
    };
    return categories[type] || "other";
  }

  private updateGameStateFromEvent(state: GameState, event: GameEvent) {
    // Update game state based on event type
    if (event.type === "quarter_end") {
      state.quarter += 1;
      if (state.quarter === 3) state.status = "halftime";
    }

    if (event.type === "touchdown") {
      const points = 6; // Simplified
      if (event.team === state.possession) {
        state.score.home += points; // Simplified logic
      }
    }
  }

  private async processScoringEvents(events: GameEvent[]) {
    // Batch process scoring events
    for (const event of events) {
      // Update scores, trigger celebrations, etc.
    }
  }

  private async processStatEvents(events: GameEvent[]) {
    // Batch process stat updates
  }

  private async processInjuryEvents(events: GameEvent[]) {
    // Handle injury events with high priority
  }

  private async processBettingEvents(events: GameEvent[]) {
    // Update betting markets
  }

  private async getActiveBetsForProp(playerId: string, propType: string): Promise<any[]> {
    // In production, this would query the bets database
    return [];
  }

  private calculateCashOutDelta(bet: any, oddsUpdate: OddsUpdate): number {
    // Calculate how cash out value changed based on odds movement
    return Math.random() * 20 - 10; // Simplified
  }
}

export const realtimeSportsPipeline = new RealtimeSportsPipeline();