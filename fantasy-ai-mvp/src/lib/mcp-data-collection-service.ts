import { EventEmitter } from "events";
import { realtimeSportsPipeline, GameEvent, PlayerStats, OddsUpdate } from "./realtime-sports-pipeline";

/**
 * MCP-Enhanced Data Collection Service
 * Uses Firecrawl and Puppeteer MCPs for real-time sports data collection
 */

export interface MCPDataSource {
  id: string;
  name: string;
  type: "firecrawl" | "puppeteer" | "api";
  url: string;
  priority: number;
  interval: number;
  selectors?: {
    [key: string]: string;
  };
  enabled: boolean;
}

export interface PlayerNewsItem {
  playerId: string;
  playerName: string;
  timestamp: Date;
  type: "injury" | "inactive" | "trade" | "lineup_change" | "weather" | "performance";
  severity: "low" | "medium" | "high" | "critical";
  headline: string;
  details: string;
  source: string;
  impact: {
    projectedChange: number;
    confidence: number;
    timeframe: "immediate" | "game" | "week" | "season";
  };
  metadata?: any;
}

export interface WeatherData {
  gameId: string;
  stadium: string;
  timestamp: Date;
  temperature: number;
  windSpeed: number;
  windDirection: string;
  precipitation: number;
  humidity: number;
  dome: boolean;
  fantasyImpact: {
    passingImpact: number;
    kickingImpact: number;
    runningImpact: number;
    confidence: number;
  };
}

export interface DepthChartUpdate {
  teamId: string;
  position: string;
  players: Array<{
    playerId: string;
    playerName: string;
    depth: number;
    snapCount: number;
    percentage: number;
  }>;
  lastUpdated: Date;
  source: string;
}

export class MCPDataCollectionService extends EventEmitter {
  private dataSources: Map<string, MCPDataSource> = new Map();
  private collectionIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;
  private lastCollectionTimes: Map<string, Date> = new Map();
  
  // MCP Service instances (these would be initialized with actual MCP connections)
  private firecrawlService: any;
  private puppeteerService: any;

  constructor() {
    super();
    this.initializeDataSources();
    this.initializeMCPServices();
  }

  /**
   * Initialize MCP data sources configuration
   */
  private initializeDataSources() {
    // ESPN Injury Reports
    this.dataSources.set("espn_injuries", {
      id: "espn_injuries",
      name: "ESPN Injury Reports",
      type: "firecrawl",
      url: "https://www.espn.com/nfl/injuries",
      priority: 1,
      interval: 60000, // 1 minute
      selectors: {
        playerName: ".injury-report .player-name",
        injuryType: ".injury-report .injury-type",
        status: ".injury-report .status"
      },
      enabled: true
    });

    // NFL.com Depth Charts
    this.dataSources.set("nfl_depth_charts", {
      id: "nfl_depth_charts",
      name: "NFL Depth Charts",
      type: "puppeteer",
      url: "https://www.nfl.com/teams/{team}/depth-chart",
      priority: 2,
      interval: 300000, // 5 minutes
      selectors: {
        position: ".depth-chart-position",
        playerName: ".depth-chart-player",
        depth: ".depth-chart-depth"
      },
      enabled: true
    });

    // Weather Underground
    this.dataSources.set("weather_data", {
      id: "weather_data",
      name: "Weather Data",
      type: "firecrawl",
      url: "https://www.wunderground.com/sports/NFL",
      priority: 3,
      interval: 180000, // 3 minutes
      selectors: {
        stadium: ".stadium-name",
        temperature: ".temperature",
        windSpeed: ".wind-speed",
        precipitation: ".precipitation"
      },
      enabled: true
    });

    // FantasyPros News
    this.dataSources.set("fantasypros_news", {
      id: "fantasypros_news",
      name: "FantasyPros News",
      type: "firecrawl",
      url: "https://www.fantasypros.com/nfl/news/",
      priority: 4,
      interval: 120000, // 2 minutes
      selectors: {
        headline: ".news-headline",
        content: ".news-content",
        player: ".news-player",
        impact: ".news-impact"
      },
      enabled: true
    });

    // Rotoworld Updates
    this.dataSources.set("rotoworld_updates", {
      id: "rotoworld_updates",
      name: "Rotoworld Player Updates",
      type: "puppeteer",
      url: "https://www.nbcsports.com/fantasy/football/news",
      priority: 5,
      interval: 90000, // 1.5 minutes
      enabled: true
    });
  }

  /**
   * Initialize MCP service connections
   */
  private initializeMCPServices() {
    // In production, these would connect to actual MCP servers
    this.firecrawlService = {
      crawl: async (url: string, selectors: any) => {
        console.log(`🕷️ Firecrawl MCP: Crawling ${url}`);
        // Simulate MCP Firecrawl service call
        return this.simulateFirecrawlData(url, selectors);
      }
    };

    this.puppeteerService = {
      scrape: async (url: string, selectors: any) => {
        console.log(`🎭 Puppeteer MCP: Scraping ${url}`);
        // Simulate MCP Puppeteer service call
        return this.simulatePuppeteerData(url, selectors);
      }
    };
  }

  /**
   * Start MCP data collection
   */
  async start() {
    if (this.isRunning) return;
    
    console.log("🚀 Starting MCP-Enhanced Data Collection Service...");
    this.isRunning = true;

    // Start collection for each enabled data source
    for (const [sourceId, source] of this.dataSources) {
      if (source.enabled) {
        await this.startSourceCollection(sourceId, source);
      }
    }

    // Emit startup event
    this.emit("serviceStarted", {
      activeSources: Array.from(this.dataSources.values()).filter(s => s.enabled).length,
      timestamp: new Date()
    });
  }

  /**
   * Stop MCP data collection
   */
  stop() {
    if (!this.isRunning) return;

    console.log("🛑 Stopping MCP-Enhanced Data Collection Service...");
    this.isRunning = false;

    // Clear all intervals
    for (const [sourceId, interval] of this.collectionIntervals) {
      clearInterval(interval);
    }
    this.collectionIntervals.clear();

    this.emit("serviceStopped", { timestamp: new Date() });
  }

  /**
   * Start collection for a specific data source
   */
  private async startSourceCollection(sourceId: string, source: MCPDataSource) {
    console.log(`📡 Starting collection for ${source.name} (${source.type})`);

    // Initial collection
    await this.collectFromSource(sourceId, source);

    // Set up interval collection
    const interval = setInterval(async () => {
      await this.collectFromSource(sourceId, source);
    }, source.interval);

    this.collectionIntervals.set(sourceId, interval);
  }

  /**
   * Collect data from a specific source
   */
  private async collectFromSource(sourceId: string, source: MCPDataSource) {
    try {
      const startTime = Date.now();
      let data: any;

      // Use appropriate MCP service based on source type
      switch (source.type) {
        case "firecrawl":
          data = await this.firecrawlService.crawl(source.url, source.selectors);
          break;
        case "puppeteer":
          data = await this.puppeteerService.scrape(source.url, source.selectors);
          break;
        default:
          console.warn(`Unknown source type: ${source.type}`);
          return;
      }

      const collectionTime = Date.now() - startTime;
      this.lastCollectionTimes.set(sourceId, new Date());

      // Process and emit data based on source type
      await this.processCollectedData(sourceId, source, data);

      // Emit collection metrics
      this.emit("dataCollected", {
        sourceId,
        sourceName: source.name,
        collectionTime,
        dataSize: JSON.stringify(data).length,
        timestamp: new Date()
      });

    } catch (error) {
      console.error(`❌ Error collecting from ${source.name}:`, error);
      this.emit("collectionError", {
        sourceId,
        sourceName: source.name,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
    }
  }

  /**
   * Process collected data and emit appropriate events
   */
  private async processCollectedData(sourceId: string, source: MCPDataSource, data: any) {
    switch (sourceId) {
      case "espn_injuries":
        await this.processInjuryData(data);
        break;
      case "nfl_depth_charts":
        await this.processDepthChartData(data);
        break;
      case "weather_data":
        await this.processWeatherData(data);
        break;
      case "fantasypros_news":
      case "rotoworld_updates":
        await this.processPlayerNews(data);
        break;
      default:
        console.log(`📊 Collected data from ${source.name}:`, data);
    }
  }

  /**
   * Process injury data and create game events
   */
  private async processInjuryData(data: any) {
    // Convert injury data to player news and game events
    const injuryEvents = data.injuries?.map((injury: any) => ({
      id: `injury_${injury.playerId}_${Date.now()}`,
      gameId: injury.gameId || "unknown",
      timestamp: new Date(),
      type: "injury" as const,
      team: injury.team,
      players: [injury.playerId],
      description: `${injury.playerName} - ${injury.injuryType} (${injury.status})`,
      fantasyImpact: [
        {
          playerId: injury.playerId,
          pointsChange: this.calculateInjuryImpact(injury.status),
          projectionChange: this.calculateProjectionImpact(injury.status)
        }
      ],
      metadata: {
        injuryType: injury.injuryType,
        status: injury.status,
        source: "ESPN"
      }
    })) || [];

    // Send to main pipeline
    for (const event of injuryEvents) {
      this.emit("enhancedGameEvent", event);
    }
  }

  /**
   * Process depth chart data
   */
  private async processDepthChartData(data: any) {
    const depthChartUpdates = data.depthCharts?.map((chart: any) => ({
      teamId: chart.teamId,
      position: chart.position,
      players: chart.players,
      lastUpdated: new Date(),
      source: "NFL.com"
    })) || [];

    for (const update of depthChartUpdates) {
      this.emit("depthChartUpdate", update);
    }
  }

  /**
   * Process weather data
   */
  private async processWeatherData(data: any) {
    const weatherUpdates = data.weather?.map((weather: any) => ({
      gameId: weather.gameId,
      stadium: weather.stadium,
      timestamp: new Date(),
      temperature: weather.temperature,
      windSpeed: weather.windSpeed,
      windDirection: weather.windDirection,
      precipitation: weather.precipitation,
      humidity: weather.humidity,
      dome: weather.dome,
      fantasyImpact: this.calculateWeatherImpact(weather)
    })) || [];

    for (const weather of weatherUpdates) {
      this.emit("weatherUpdate", weather);
    }
  }

  /**
   * Process player news
   */
  private async processPlayerNews(data: any) {
    const newsItems = data.news?.map((item: any) => ({
      playerId: item.playerId,
      playerName: item.playerName,
      timestamp: new Date(),
      type: this.categorizeNews(item.headline),
      severity: this.assessNewsSeverity(item.headline, item.content),
      headline: item.headline,
      details: item.content,
      source: item.source,
      impact: {
        projectedChange: this.calculateNewsImpact(item),
        confidence: this.calculateConfidence(item),
        timeframe: this.assessTimeframe(item)
      }
    })) || [];

    for (const news of newsItems) {
      this.emit("playerNews", news);
    }
  }

  /**
   * Helper methods for data processing
   */
  private calculateInjuryImpact(status: string): number {
    const impacts: Record<string, number> = {
      "OUT": -15,
      "DOUBTFUL": -8,
      "QUESTIONABLE": -3,
      "PROBABLE": -1,
      "HEALTHY": 0
    };
    return impacts[status.toUpperCase()] || -5;
  }

  private calculateProjectionImpact(status: string): number {
    return this.calculateInjuryImpact(status) * 1.5;
  }

  private calculateWeatherImpact(weather: any) {
    const windImpact = Math.max(0, (weather.windSpeed - 15) * 0.1);
    const precipitationImpact = weather.precipitation * 0.05;
    
    return {
      passingImpact: -(windImpact + precipitationImpact),
      kickingImpact: -(windImpact * 2),
      runningImpact: precipitationImpact * 0.5,
      confidence: 0.7
    };
  }

  private categorizeNews(headline: string): PlayerNewsItem["type"] {
    const categories = {
      injury: ["injury", "hurt", "pain", "medical", "hospital"],
      inactive: ["inactive", "scratch", "out", "benched"],
      trade: ["trade", "traded", "deal", "acquire"],
      lineup_change: ["starter", "starting", "lineup", "depth"],
      weather: ["weather", "rain", "snow", "wind"],
      performance: ["performance", "stats", "yards", "touchdown"]
    };

    const lowerHeadline = headline.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerHeadline.includes(keyword))) {
        return category as PlayerNewsItem["type"];
      }
    }
    
    return "performance";
  }

  private assessNewsSeverity(headline: string, content: string): PlayerNewsItem["severity"] {
    const criticalKeywords = ["surgery", "season-ending", "torn", "broken"];
    const highKeywords = ["injured", "questionable", "doubtful", "emergency"];
    const mediumKeywords = ["limited", "monitor", "watch"];
    
    const text = `${headline} ${content}`.toLowerCase();
    
    if (criticalKeywords.some(keyword => text.includes(keyword))) return "critical";
    if (highKeywords.some(keyword => text.includes(keyword))) return "high";
    if (mediumKeywords.some(keyword => text.includes(keyword))) return "medium";
    
    return "low";
  }

  private calculateNewsImpact(item: any): number {
    // Simplified impact calculation
    return Math.random() * 10 - 5;
  }

  private calculateConfidence(item: any): number {
    // Confidence based on source and content quality
    const sourceConfidence: Record<string, number> = {
      "ESPN": 0.9,
      "NFL.com": 0.95,
      "FantasyPros": 0.8,
      "Rotoworld": 0.85
    };
    
    return sourceConfidence[item.source] || 0.7;
  }

  private assessTimeframe(item: any): PlayerNewsItem["impact"]["timeframe"] {
    const headline = item.headline.toLowerCase();
    
    if (headline.includes("season") || headline.includes("year")) return "season";
    if (headline.includes("week")) return "week";
    if (headline.includes("game") || headline.includes("today")) return "game";
    
    return "immediate";
  }

  /**
   * Simulate MCP service responses (replace with actual MCP calls in production)
   */
  private simulateFirecrawlData(url: string, selectors: any): any {
    // Simulate realistic sports data based on URL
    if (url.includes("injuries")) {
      return {
        injuries: [
          {
            playerId: "cmc",
            playerName: "Christian McCaffrey",
            team: "SF",
            gameId: "game_sf_dal",
            injuryType: "Ankle",
            status: "QUESTIONABLE"
          },
          {
            playerId: "ja",
            playerName: "Josh Allen",
            team: "BUF",
            gameId: "game_buf_mia",
            injuryType: "Shoulder",
            status: "PROBABLE"
          }
        ]
      };
    }
    
    return { data: "Simulated Firecrawl data" };
  }

  private simulatePuppeteerData(url: string, selectors: any): any {
    // Simulate realistic sports data based on URL
    if (url.includes("depth-chart")) {
      return {
        depthCharts: [
          {
            teamId: "SF",
            position: "RB",
            players: [
              { playerId: "cmc", playerName: "Christian McCaffrey", depth: 1, snapCount: 85, percentage: 85 },
              { playerId: "jp", playerName: "Jordan Mason", depth: 2, snapCount: 15, percentage: 15 }
            ]
          }
        ]
      };
    }
    
    return { data: "Simulated Puppeteer data" };
  }

  /**
   * Get collection statistics
   */
  getCollectionStats() {
    return {
      totalSources: this.dataSources.size,
      activeSources: Array.from(this.dataSources.values()).filter(s => s.enabled).length,
      lastCollectionTimes: Object.fromEntries(this.lastCollectionTimes),
      isRunning: this.isRunning
    };
  }

  /**
   * Enable/disable specific data sources
   */
  toggleDataSource(sourceId: string, enabled: boolean) {
    const source = this.dataSources.get(sourceId);
    if (source) {
      source.enabled = enabled;
      if (enabled && this.isRunning) {
        this.startSourceCollection(sourceId, source);
      } else if (!enabled && this.collectionIntervals.has(sourceId)) {
        clearInterval(this.collectionIntervals.get(sourceId)!);
        this.collectionIntervals.delete(sourceId);
      }
    }
  }
}

export const mcpDataCollectionService = new MCPDataCollectionService();