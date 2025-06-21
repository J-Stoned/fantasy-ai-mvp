import { io, Socket } from "socket.io-client";
import { z } from "zod";

export const LivePlayerDataSchema = z.object({
  playerId: z.string(),
  name: z.string(),
  position: z.string(),
  team: z.string(),
  opponent: z.string(),
  gameId: z.string(),
  stats: z.record(z.number()),
  projectedPoints: z.number(),
  currentPoints: z.number(),
  injuryStatus: z.enum(["healthy", "questionable", "doubtful", "out"]).optional(),
  stockPrice: z.number(),
  priceChange: z.number(),
  timestamp: z.date(),
});

export const GameEventSchema = z.object({
  gameId: z.string(),
  type: z.enum([
    "touchdown", "field_goal", "safety", "interception", "fumble",
    "injury", "timeout", "quarter_end", "game_end", "weather_update"
  ]),
  playerId: z.string().optional(),
  description: z.string(),
  fantasyPointsImpact: z.number(),
  timestamp: z.date(),
});

export const MarketUpdateSchema = z.object({
  symbol: z.string(), // Player symbol like "CMC2024"
  currentPrice: z.number(),
  priceChange: z.number(),
  priceChangePercent: z.number(),
  volume: z.number(),
  lastTrade: z.date(),
  newsImpact: z.string().optional(),
});

export type LivePlayerData = z.infer<typeof LivePlayerDataSchema>;
export type GameEvent = z.infer<typeof GameEventSchema>;
export type MarketUpdate = z.infer<typeof MarketUpdateSchema>;

export interface DataSource {
  name: string;
  url: string;
  apiKey?: string;
  priority: number; // 1 = highest priority
  rateLimit: number; // requests per minute
  healthCheck: () => Promise<boolean>;
}

export class RealtimeDataManager {
  private sockets: Map<string, Socket> = new Map();
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private dataCache: Map<string, { data: any; timestamp: number }> = new Map();
  private healthStatus: Map<string, boolean> = new Map();
  
  // Data source configuration
  private dataSources: DataSource[] = [
    {
      name: "ESPN",
      url: "wss://api.espn.com/v1/sports/football/nfl/scoreboard/live",
      priority: 1,
      rateLimit: 120,
      healthCheck: () => this.pingDataSource("ESPN"),
    },
    {
      name: "Yahoo",
      url: "wss://fantasysports.yahooapis.com/fantasy/v2/live",
      priority: 2,
      rateLimit: 100,
      healthCheck: () => this.pingDataSource("Yahoo"),
    },
    {
      name: "NFL_API",
      url: "wss://api.nfl.com/v1/live",
      priority: 3,
      rateLimit: 60,
      healthCheck: () => this.pingDataSource("NFL_API"),
    }
  ];

  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
  };

  constructor() {
    this.initializeConnections();
    this.startHealthMonitoring();
  }

  private async initializeConnections(): Promise<void> {
    console.log("🚀 Initializing real-time data connections...");
    
    for (const source of this.dataSources) {
      try {
        await this.connectToSource(source);
      } catch (error) {
        console.error(`Failed to connect to ${source.name}:`, error);
        this.healthStatus.set(source.name, false);
      }
    }
  }

  private async connectToSource(source: DataSource): Promise<void> {
    const socket = io(source.url, {
      transports: ['websocket'],
      timeout: 10000,
      forceNew: true,
      extraHeaders: source.apiKey ? {
        'Authorization': `Bearer ${source.apiKey}`
      } : undefined,
    });

    socket.on('connect', () => {
      console.log(`✅ Connected to ${source.name}`);
      this.healthStatus.set(source.name, true);
      
      // Subscribe to relevant channels
      this.subscribeToChannels(socket, source.name);
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ Disconnected from ${source.name}: ${reason}`);
      this.healthStatus.set(source.name, false);
      
      // Attempt reconnection with exponential backoff
      this.scheduleReconnection(source);
    });

    socket.on('connect_error', (error) => {
      console.error(`Connection error to ${source.name}:`, error);
      this.healthStatus.set(source.name, false);
    });

    // Data event handlers
    socket.on('player_update', (data) => {
      this.handlePlayerUpdate(data, source.name);
    });

    socket.on('game_event', (data) => {
      this.handleGameEvent(data, source.name);
    });

    socket.on('market_update', (data) => {
      this.handleMarketUpdate(data, source.name);
    });

    socket.on('injury_alert', (data) => {
      this.handleInjuryAlert(data, source.name);
    });

    socket.on('weather_update', (data) => {
      this.handleWeatherUpdate(data, source.name);
    });

    this.sockets.set(source.name, socket);
  }

  private subscribeToChannels(socket: Socket, sourceName: string): void {
    // Subscribe to live game data
    socket.emit('subscribe', {
      channels: [
        'nfl_live_scores',
        'player_stats',
        'injury_updates',
        'weather_alerts',
        'market_data',
        'trade_alerts'
      ],
      filters: {
        sport: 'football',
        season: new Date().getFullYear(),
        live_only: true
      }
    });

    console.log(`📡 Subscribed to live data channels for ${sourceName}`);
  }

  private handlePlayerUpdate(rawData: any, source: string): void {
    try {
      // Normalize data from different sources
      const normalizedData = this.normalizePlayerData(rawData, source);
      const playerData = LivePlayerDataSchema.parse(normalizedData);
      
      // Cache the data
      this.cacheData(`player_${playerData.playerId}`, playerData);
      
      // Notify all subscribers
      this.notifySubscribers('player_update', playerData);
      
      // Trigger stock price updates if significant stat change
      if (this.isSignificantStatChange(playerData)) {
        this.triggerStockPriceUpdate(playerData);
      }
      
    } catch (error) {
      console.error(`Error processing player update from ${source}:`, error);
    }
  }

  private handleGameEvent(rawData: any, source: string): void {
    try {
      const normalizedData = this.normalizeGameEvent(rawData, source);
      const gameEvent = GameEventSchema.parse(normalizedData);
      
      this.cacheData(`event_${gameEvent.gameId}_${Date.now()}`, gameEvent);
      this.notifySubscribers('game_event', gameEvent);
      
      // High-impact events trigger immediate notifications
      if (this.isHighImpactEvent(gameEvent)) {
        this.notifySubscribers('high_impact_event', gameEvent);
      }
      
    } catch (error) {
      console.error(`Error processing game event from ${source}:`, error);
    }
  }

  private handleMarketUpdate(rawData: any, source: string): void {
    try {
      const normalizedData = this.normalizeMarketData(rawData, source);
      const marketUpdate = MarketUpdateSchema.parse(normalizedData);
      
      this.cacheData(`market_${marketUpdate.symbol}`, marketUpdate);
      this.notifySubscribers('market_update', marketUpdate);
      
    } catch (error) {
      console.error(`Error processing market update from ${source}:`, error);
    }
  }

  private handleInjuryAlert(rawData: any, source: string): void {
    const injuryData = {
      ...rawData,
      timestamp: new Date(),
      source,
      priority: 'critical' as const
    };
    
    this.notifySubscribers('injury_alert', injuryData);
    
    // Trigger immediate stock price impact
    if (injuryData.playerId) {
      this.triggerEmergencyPriceUpdate(injuryData.playerId, injuryData.severity);
    }
  }

  private handleWeatherUpdate(rawData: any, source: string): void {
    const weatherData = {
      ...rawData,
      timestamp: new Date(),
      source
    };
    
    this.notifySubscribers('weather_update', weatherData);
    
    // Weather significantly impacts outdoor games
    if (this.isSignificantWeatherEvent(weatherData)) {
      this.triggerWeatherBasedPriceUpdates(weatherData);
    }
  }

  // Data normalization methods for different sources
  private normalizePlayerData(rawData: any, source: string): any {
    switch (source) {
      case "ESPN":
        return {
          playerId: rawData.athlete?.id || rawData.id,
          name: rawData.athlete?.displayName || rawData.name,
          position: rawData.athlete?.position?.abbreviation || rawData.position,
          team: rawData.athlete?.team?.abbreviation || rawData.team,
          opponent: rawData.opponent?.abbreviation || rawData.opponent,
          gameId: rawData.event?.id || rawData.gameId,
          stats: rawData.statistics || rawData.stats || {},
          projectedPoints: rawData.projection?.fantasyPoints || 0,
          currentPoints: rawData.fantasyPoints || 0,
          injuryStatus: rawData.injury?.status?.toLowerCase() || "healthy",
          stockPrice: rawData.stockPrice || 0,
          priceChange: rawData.priceChange || 0,
          timestamp: new Date(rawData.timestamp || Date.now()),
        };
      
      case "Yahoo":
        return {
          playerId: rawData.player_id,
          name: rawData.name?.full || rawData.name,
          position: rawData.eligible_positions?.[0] || rawData.position,
          team: rawData.editorial_team_abbr || rawData.team,
          opponent: rawData.opponent_team_abbr || rawData.opponent,
          gameId: rawData.game_id,
          stats: rawData.player_stats?.stats || {},
          projectedPoints: rawData.projected_points || 0,
          currentPoints: rawData.fantasy_points || 0,
          injuryStatus: rawData.status?.toLowerCase() || "healthy",
          stockPrice: rawData.stock_price || 0,
          priceChange: rawData.price_change || 0,
          timestamp: new Date(rawData.timestamp || Date.now()),
        };
      
      default:
        // Generic normalization
        return {
          playerId: rawData.id || rawData.playerId,
          name: rawData.name,
          position: rawData.position,
          team: rawData.team,
          opponent: rawData.opponent,
          gameId: rawData.gameId,
          stats: rawData.stats || {},
          projectedPoints: rawData.projectedPoints || 0,
          currentPoints: rawData.currentPoints || 0,
          injuryStatus: rawData.injuryStatus || "healthy",
          stockPrice: rawData.stockPrice || 0,
          priceChange: rawData.priceChange || 0,
          timestamp: new Date(rawData.timestamp || Date.now()),
        };
    }
  }

  private normalizeGameEvent(rawData: any, source: string): any {
    // Similar normalization for game events
    return {
      gameId: rawData.gameId || rawData.game_id,
      type: this.mapEventType(rawData.type || rawData.event_type),
      playerId: rawData.playerId || rawData.player_id,
      description: rawData.description || rawData.text,
      fantasyPointsImpact: rawData.fantasyPointsImpact || rawData.points || 0,
      timestamp: new Date(rawData.timestamp || Date.now()),
    };
  }

  private normalizeMarketData(rawData: any, source: string): any {
    return {
      symbol: rawData.symbol || rawData.player_symbol,
      currentPrice: rawData.price || rawData.current_price,
      priceChange: rawData.change || rawData.price_change,
      priceChangePercent: rawData.changePercent || rawData.change_percent,
      volume: rawData.volume || rawData.trading_volume,
      lastTrade: new Date(rawData.lastTrade || rawData.last_updated || Date.now()),
      newsImpact: rawData.newsImpact || rawData.news_catalyst,
    };
  }

  // Subscription management
  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    
    this.subscribers.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  private notifySubscribers(event: string, data: any): void {
    const eventSubscribers = this.subscribers.get(event);
    if (eventSubscribers) {
      eventSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in subscriber callback for ${event}:`, error);
        }
      });
    }
  }

  // Smart decision helpers
  private isSignificantStatChange(playerData: LivePlayerData): boolean {
    const cached = this.getCachedData(`player_${playerData.playerId}`);
    if (!cached) return false;
    
    const pointsChange = Math.abs(playerData.currentPoints - cached.currentPoints);
    return pointsChange >= 5; // 5+ fantasy points is significant
  }

  private isHighImpactEvent(event: GameEvent): boolean {
    const highImpactEvents = ['touchdown', 'interception', 'fumble', 'injury'];
    return highImpactEvents.includes(event.type) || 
           Math.abs(event.fantasyPointsImpact) >= 10;
  }

  private isSignificantWeatherEvent(weather: any): boolean {
    const { windSpeed, precipitation, temperature } = weather;
    return windSpeed > 20 || precipitation > 0.5 || temperature < 20;
  }

  // Price impact triggers
  private triggerStockPriceUpdate(playerData: LivePlayerData): void {
    this.notifySubscribers('price_update_trigger', {
      playerId: playerData.playerId,
      currentPoints: playerData.currentPoints,
      projectedPoints: playerData.projectedPoints,
      reason: 'stat_performance',
      impact: this.calculatePriceImpact(playerData)
    });
  }

  private triggerEmergencyPriceUpdate(playerId: string, severity: string): void {
    const impactMultiplier = {
      'minor': -0.05,
      'major': -0.15,
      'season_ending': -0.5
    }[severity] || -0.1;

    this.notifySubscribers('emergency_price_update', {
      playerId,
      impactMultiplier,
      reason: 'injury',
      timestamp: new Date()
    });
  }

  private triggerWeatherBasedPriceUpdates(weather: any): void {
    // Weather negatively impacts passing games, helps running games
    this.notifySubscribers('weather_price_impact', {
      gameId: weather.gameId,
      weatherData: weather,
      passingImpact: -0.1,
      rushingImpact: 0.05,
      timestamp: new Date()
    });
  }

  private calculatePriceImpact(playerData: LivePlayerData): number {
    const pointsDiff = playerData.currentPoints - playerData.projectedPoints;
    const baseImpact = pointsDiff * 0.02; // 2% per point differential
    
    // Position modifiers
    const positionMultiplier = {
      'QB': 1.5,
      'RB': 1.2,
      'WR': 1.0,
      'TE': 0.8,
      'K': 0.3,
      'DST': 0.7
    }[playerData.position] || 1.0;
    
    return baseImpact * positionMultiplier;
  }

  // Utility methods
  private cacheData(key: string, data: any): void {
    this.dataCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private getCachedData(key: string): any {
    const cached = this.dataCache.get(key);
    if (!cached) return null;
    
    // Data expires after 30 seconds
    if (Date.now() - cached.timestamp > 30000) {
      this.dataCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private mapEventType(eventType: string): GameEvent['type'] {
    const mapping: Record<string, GameEvent['type']> = {
      'TD': 'touchdown',
      'FG': 'field_goal',
      'INT': 'interception',
      'FUM': 'fumble',
      'SAF': 'safety',
      'INJ': 'injury',
      'TO': 'timeout',
      'QE': 'quarter_end',
      'FINAL': 'game_end',
      'WEATHER': 'weather_update'
    };
    
    return mapping[eventType] || 'touchdown';
  }

  private async scheduleReconnection(source: DataSource): Promise<void> {
    let attempts = 0;
    const maxAttempts = this.retryConfig.maxRetries;
    
    const attempt = async (): Promise<void> => {
      if (attempts >= maxAttempts) {
        console.error(`Max reconnection attempts reached for ${source.name}`);
        return;
      }
      
      const delay = Math.min(
        this.retryConfig.baseDelay * Math.pow(2, attempts),
        this.retryConfig.maxDelay
      );
      
      console.log(`Reconnecting to ${source.name} in ${delay}ms (attempt ${attempts + 1})`);
      
      setTimeout(async () => {
        attempts++;
        try {
          await this.connectToSource(source);
        } catch (error) {
          console.error(`Reconnection attempt ${attempts} failed for ${source.name}:`, error);
          await attempt();
        }
      }, delay);
    };
    
    await attempt();
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      for (const source of this.dataSources) {
        try {
          const isHealthy = await source.healthCheck();
          if (!isHealthy && this.healthStatus.get(source.name)) {
            console.warn(`Health check failed for ${source.name}`);
            this.healthStatus.set(source.name, false);
            await this.scheduleReconnection(source);
          }
        } catch (error) {
          console.error(`Health check error for ${source.name}:`, error);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private async pingDataSource(sourceName: string): Promise<boolean> {
    const socket = this.sockets.get(sourceName);
    if (!socket || !socket.connected) return false;
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);
      
      socket.emit('ping', (response: any) => {
        clearTimeout(timeout);
        resolve(response === 'pong');
      });
    });
  }

  // Public API
  async getRealtimePlayerData(playerId: string): Promise<LivePlayerData | null> {
    const cached = this.getCachedData(`player_${playerId}`);
    return cached || null;
  }

  async subscribeToPlayer(playerId: string, callback: (data: LivePlayerData) => void): Promise<() => void> {
    return this.subscribe('player_update', (data: LivePlayerData) => {
      if (data.playerId === playerId) {
        callback(data);
      }
    });
  }

  async subscribeToGame(gameId: string, callback: (event: GameEvent) => void): Promise<() => void> {
    return this.subscribe('game_event', (data: GameEvent) => {
      if (data.gameId === gameId) {
        callback(data);
      }
    });
  }

  getHealthStatus(): Record<string, boolean> {
    return Object.fromEntries(this.healthStatus.entries());
  }

  async shutdown(): Promise<void> {
    console.log("🛑 Shutting down real-time data manager...");
    
    for (const [name, socket] of this.sockets.entries()) {
      socket.disconnect();
      console.log(`Disconnected from ${name}`);
    }
    
    this.sockets.clear();
    this.subscribers.clear();
    this.dataCache.clear();
    this.healthStatus.clear();
  }
}

export const realtimeDataManager = new RealtimeDataManager();