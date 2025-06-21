import { EventEmitter } from "events";
import { prisma } from "./prisma";

export interface LiveDataProvider {
  name: string;
  priority: number;
  latency: number;
  reliability: number;
  isConnected: boolean;
  lastUpdate?: Date;
}

export interface PlayerUpdate {
  playerId: string;
  gameId: string;
  timestamp: Date;
  stats: {
    fantasyPoints: number;
    passingYards?: number;
    rushingYards?: number;
    receivingYards?: number;
    touchdowns: number;
    receptions?: number;
    carries?: number;
  };
  live: {
    onField: boolean;
    snapCount: number;
    targetShare: number;
    redZoneTargets: number;
  };
  injuries?: {
    status: "healthy" | "questionable" | "doubtful" | "out";
    description?: string;
  };
}

export interface GameEvent {
  id: string;
  gameId: string;
  timestamp: Date;
  type: "touchdown" | "field_goal" | "interception" | "fumble" | "injury" | "quarter_end";
  team: string;
  players: string[];
  description: string;
  fantasyImpact: {
    playerId: string;
    pointsChange: number;
    projectionChange?: number;
  }[];
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  source: string;
}

export class LiveDataManager extends EventEmitter {
  private providers: Map<string, LiveDataProvider> = new Map();
  private wsConnections: Map<string, WebSocket> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private isRunning = false;
  private updateInterval: NodeJS.Timeout | null = null;
  
  // Data caches for offline-first approach
  private playerDataCache: Map<string, PlayerUpdate> = new Map();
  private marketDataCache: Map<string, MarketData> = new Map();
  private gameEventsCache: GameEvent[] = [];
  
  constructor() {
    super();
    this.initializeProviders();
  }

  /**
   * Initialize all data providers
   */
  private initializeProviders() {
    // ESPN Real-time data
    this.providers.set("espn", {
      name: "ESPN Real-time API",
      priority: 1,
      latency: 2000, // 2 second delay
      reliability: 0.98,
      isConnected: false
    });

    // Yahoo Fantasy Sports API
    this.providers.set("yahoo", {
      name: "Yahoo Fantasy API",
      priority: 2,
      latency: 3000,
      reliability: 0.97,
      isConnected: false
    });

    // NFL Official API
    this.providers.set("nfl", {
      name: "NFL Official API",
      priority: 3,
      latency: 1000,
      reliability: 0.99,
      isConnected: false
    });

    // DraftKings Pricing API
    this.providers.set("draftkings", {
      name: "DraftKings Pricing",
      priority: 4,
      latency: 5000,
      reliability: 0.95,
      isConnected: false
    });

    // FanDuel Pricing API
    this.providers.set("fanduel", {
      name: "FanDuel Pricing",
      priority: 5,
      latency: 5000,
      reliability: 0.95,
      isConnected: false
    });
  }

  /**
   * Start the live data pipeline
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️ Live data manager already running");
      return;
    }

    console.log("🚀 Starting live data manager...");
    this.isRunning = true;

    // Connect to all providers
    await this.connectAllProviders();

    // Start update intervals
    this.updateInterval = setInterval(() => {
      this.checkConnectionHealth();
      this.broadcastCachedData();
    }, 5000); // Check every 5 seconds

    console.log("✅ Live data manager started successfully");
  }

  /**
   * Stop the live data pipeline
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log("🛑 Stopping live data manager...");
    this.isRunning = false;

    // Clear intervals
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Close all WebSocket connections
    for (const [providerId, ws] of this.wsConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
    this.wsConnections.clear();

    // Update provider status
    for (const provider of this.providers.values()) {
      provider.isConnected = false;
    }

    console.log("✅ Live data manager stopped");
  }

  /**
   * Connect to all data providers
   */
  private async connectAllProviders(): Promise<void> {
    const connectionPromises = Array.from(this.providers.keys()).map(providerId => 
      this.connectProvider(providerId)
    );

    const results = await Promise.allSettled(connectionPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`📡 Connected to ${successful}/${results.length} data providers (${failed} failed)`);
  }

  /**
   * Connect to a specific data provider
   */
  private async connectProvider(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    try {
      const wsUrl = this.getWebSocketUrl(providerId);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        provider.isConnected = true;
        provider.lastUpdate = new Date();
        this.reconnectAttempts.set(providerId, 0);
        console.log(`✅ Connected to ${provider.name}`);
        
        // Subscribe to relevant data streams
        this.subscribeToDataStreams(providerId, ws);
      };

      ws.onmessage = (event) => {
        this.handleProviderMessage(providerId, event.data);
      };

      ws.onerror = (error) => {
        console.error(`❌ ${provider.name} WebSocket error:`, error);
        provider.isConnected = false;
      };

      ws.onclose = () => {
        provider.isConnected = false;
        console.log(`🔌 ${provider.name} connection closed`);
        
        // Attempt reconnection
        this.scheduleReconnection(providerId);
      };

      this.wsConnections.set(providerId, ws);

    } catch (error) {
      console.error(`❌ Failed to connect to ${provider.name}:`, error);
      provider.isConnected = false;
      throw error;
    }
  }

  /**
   * Get WebSocket URL for provider (simulate real URLs)
   */
  private getWebSocketUrl(providerId: string): string {
    const urls: Record<string, string> = {
      espn: "wss://espn-live-api.example.com/v1/realtime",
      yahoo: "wss://yahoo-fantasy-api.example.com/live",
      nfl: "wss://nfl-live-data.example.com/gameday",
      draftkings: "wss://draftkings-pricing.example.com/live",
      fanduel: "wss://fanduel-pricing.example.com/live"
    };

    return urls[providerId] || "wss://mock-fantasy-data.example.com/live";
  }

  /**
   * Subscribe to relevant data streams for each provider
   */
  private subscribeToDataStreams(providerId: string, ws: WebSocket): void {
    const subscriptionMessages: Record<string, any> = {
      espn: {
        action: "subscribe",
        channels: ["player_stats", "game_events", "injuries"],
        sport: "nfl"
      },
      yahoo: {
        type: "subscribe",
        feeds: ["live_scoring", "player_updates"],
        league_key: "nfl.l.*"
      },
      nfl: {
        subscribe: ["games", "players", "drives"],
        format: "json"
      },
      draftkings: {
        action: "subscribe",
        markets: ["player_props", "game_props"],
        sport: "football"
      },
      fanduel: {
        type: "subscribe",
        products: ["sportsbook", "daily_fantasy"],
        sport: "american_football"
      }
    };

    const message = subscriptionMessages[providerId];
    if (message && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      console.log(`📨 Subscribed to ${providerId} data streams`);
    }
  }

  /**
   * Handle incoming messages from providers
   */
  private handleProviderMessage(providerId: string, data: string): void {
    try {
      const message = JSON.parse(data);
      const provider = this.providers.get(providerId);
      
      if (provider) {
        provider.lastUpdate = new Date();
      }

      // Route message based on type
      switch (message.type) {
        case "player_update":
          this.handlePlayerUpdate(providerId, message.data);
          break;
        case "game_event":
          this.handleGameEvent(providerId, message.data);
          break;
        case "market_data":
          this.handleMarketData(providerId, message.data);
          break;
        case "injury_update":
          this.handleInjuryUpdate(providerId, message.data);
          break;
        default:
          console.log(`📥 Unknown message type from ${providerId}:`, message.type);
      }

    } catch (error) {
      console.error(`❌ Error parsing message from ${providerId}:`, error);
    }
  }

  /**
   * Handle player stat updates
   */
  private handlePlayerUpdate(providerId: string, data: any): void {
    const playerUpdate: PlayerUpdate = {
      playerId: data.player_id,
      gameId: data.game_id,
      timestamp: new Date(data.timestamp),
      stats: {
        fantasyPoints: data.fantasy_points || 0,
        passingYards: data.passing_yards,
        rushingYards: data.rushing_yards,
        receivingYards: data.receiving_yards,
        touchdowns: data.touchdowns || 0,
        receptions: data.receptions,
        carries: data.carries
      },
      live: {
        onField: data.on_field || false,
        snapCount: data.snap_count || 0,
        targetShare: data.target_share || 0,
        redZoneTargets: data.red_zone_targets || 0
      },
      injuries: data.injury_status ? {
        status: data.injury_status,
        description: data.injury_description
      } : undefined
    };

    // Update cache
    this.playerDataCache.set(playerUpdate.playerId, playerUpdate);

    // Emit update event
    this.emit("playerUpdate", {
      providerId,
      update: playerUpdate
    });

    console.log(`📊 Player update: ${playerUpdate.playerId} - ${playerUpdate.stats.fantasyPoints} pts`);
  }

  /**
   * Handle game events
   */
  private handleGameEvent(providerId: string, data: any): void {
    const gameEvent: GameEvent = {
      id: data.event_id,
      gameId: data.game_id,
      timestamp: new Date(data.timestamp),
      type: data.event_type,
      team: data.team,
      players: data.players || [],
      description: data.description,
      fantasyImpact: data.fantasy_impact || []
    };

    // Add to cache
    this.gameEventsCache.push(gameEvent);
    
    // Keep only last 100 events
    if (this.gameEventsCache.length > 100) {
      this.gameEventsCache = this.gameEventsCache.slice(-100);
    }

    // Emit event
    this.emit("gameEvent", {
      providerId,
      event: gameEvent
    });

    console.log(`🏈 Game event: ${gameEvent.type} - ${gameEvent.description}`);
  }

  /**
   * Handle market/pricing data
   */
  private handleMarketData(providerId: string, data: any): void {
    const marketData: MarketData = {
      symbol: data.symbol,
      price: data.price,
      change: data.change || 0,
      changePercent: data.change_percent || 0,
      volume: data.volume || 0,
      timestamp: new Date(data.timestamp),
      source: providerId
    };

    // Update cache
    this.marketDataCache.set(marketData.symbol, marketData);

    // Emit update
    this.emit("marketUpdate", {
      providerId,
      data: marketData
    });

    console.log(`💰 Market update: ${marketData.symbol} - $${marketData.price}`);
  }

  /**
   * Handle injury updates
   */
  private handleInjuryUpdate(providerId: string, data: any): void {
    this.emit("injuryUpdate", {
      providerId,
      playerId: data.player_id,
      status: data.status,
      description: data.description,
      severity: data.severity,
      estimatedReturn: data.estimated_return
    });

    console.log(`🏥 Injury update: ${data.player_id} - ${data.status}`);
  }

  /**
   * Check connection health and reconnect if needed
   */
  private checkConnectionHealth(): void {
    for (const [providerId, provider] of this.providers) {
      const ws = this.wsConnections.get(providerId);
      
      // Check if connection is stale
      if (provider.lastUpdate) {
        const timeSinceUpdate = Date.now() - provider.lastUpdate.getTime();
        const maxStaleTime = 30000; // 30 seconds
        
        if (timeSinceUpdate > maxStaleTime && provider.isConnected) {
          console.log(`⚠️ ${provider.name} connection appears stale, reconnecting...`);
          provider.isConnected = false;
          
          if (ws) {
            ws.close();
          }
          
          this.scheduleReconnection(providerId);
        }
      }
    }
  }

  /**
   * Schedule reconnection for a provider
   */
  private scheduleReconnection(providerId: string): void {
    const attempts = this.reconnectAttempts.get(providerId) || 0;
    const maxAttempts = 5;
    
    if (attempts >= maxAttempts) {
      console.log(`❌ Max reconnection attempts reached for ${providerId}`);
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Exponential backoff, max 30s
    this.reconnectAttempts.set(providerId, attempts + 1);

    setTimeout(() => {
      if (this.isRunning) {
        console.log(`🔄 Attempting to reconnect to ${providerId} (attempt ${attempts + 1})`);
        this.connectProvider(providerId).catch(error => {
          console.error(`❌ Reconnection failed for ${providerId}:`, error);
        });
      }
    }, delay);
  }

  /**
   * Broadcast cached data for offline-first approach
   */
  private broadcastCachedData(): void {
    // Emit periodic cache updates for UI consistency
    this.emit("cacheUpdate", {
      playerData: Array.from(this.playerDataCache.values()),
      marketData: Array.from(this.marketDataCache.values()),
      gameEvents: this.gameEventsCache.slice(-10) // Last 10 events
    });
  }

  /**
   * Get current provider status
   */
  getProviderStatus(): Record<string, LiveDataProvider> {
    const status: Record<string, LiveDataProvider> = {};
    for (const [id, provider] of this.providers) {
      status[id] = { ...provider };
    }
    return status;
  }

  /**
   * Get cached player data
   */
  getCachedPlayerData(playerId?: string): PlayerUpdate | PlayerUpdate[] {
    if (playerId) {
      const cached = this.playerDataCache.get(playerId);
      return cached || [];
    }
    return Array.from(this.playerDataCache.values());
  }

  /**
   * Get cached market data
   */
  getCachedMarketData(symbol?: string): MarketData | MarketData[] {
    if (symbol) {
      const cached = this.marketDataCache.get(symbol);
      return cached || [];
    }
    return Array.from(this.marketDataCache.values());
  }

  /**
   * Subscribe to specific player updates
   */
  async subscribeToPlayerUpdates(playerIds: string[]): Promise<void> {
    // Send subscription message to all connected providers
    for (const [providerId, ws] of this.wsConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          action: "subscribe_players",
          player_ids: playerIds
        }));
      }
    }

    console.log(`📡 Subscribed to updates for ${playerIds.length} players`);
  }

  /**
   * Subscribe to specific game events
   */
  async subscribeToGameEvents(gameIds: string[]): Promise<void> {
    for (const [providerId, ws] of this.wsConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          action: "subscribe_games",
          game_ids: gameIds
        }));
      }
    }

    console.log(`🏈 Subscribed to events for ${gameIds.length} games`);
  }

  /**
   * Get data provider priority ranking
   */
  getProviderPriority(dataType: "stats" | "events" | "pricing"): string[] {
    const priorityMap: Record<string, string[]> = {
      stats: ["nfl", "espn", "yahoo"],
      events: ["nfl", "espn"],
      pricing: ["draftkings", "fanduel", "yahoo"]
    };

    return priorityMap[dataType] || [];
  }
}

export const liveDataManager = new LiveDataManager();