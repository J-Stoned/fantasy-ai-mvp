import { EventEmitter } from "events";
import { liveDataManager } from "./live-data-manager";

export interface PlatformPrice {
  platform: "draftkings" | "fanduel" | "superdraft" | "yahoo" | "espn";
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  salary: number;
  ownership: number; // Projected ownership %
  value: number; // Points per $1000 salary
  trend: "up" | "down" | "neutral";
  lastUpdated: Date;
}

export interface PriceMovement {
  playerId: string;
  platform: string;
  oldPrice: number;
  newPrice: number;
  change: number;
  changePercent: number;
  timestamp: Date;
  significance: "minor" | "moderate" | "major";
}

export interface CrossPlatformAnalysis {
  playerId: string;
  playerName: string;
  platforms: PlatformPrice[];
  analysis: {
    avgSalary: number;
    salaryRange: { min: number; max: number };
    bestValue: PlatformPrice;
    worstValue: PlatformPrice;
    consensus: "undervalued" | "overvalued" | "fairly_priced";
    arbitrageOpportunity: boolean;
    recommendedPlatform: string;
  };
  marketEfficiency: number; // 0-1, how aligned platforms are
}

export interface ArbitrageOpportunity {
  playerId: string;
  playerName: string;
  lowPlatform: PlatformPrice;
  highPlatform: PlatformPrice;
  priceDifference: number;
  percentDifference: number;
  profitPotential: number;
  riskLevel: "low" | "medium" | "high";
  confidence: number;
}

export class CrossPlatformPricing extends EventEmitter {
  private priceData: Map<string, Map<string, PlatformPrice>> = new Map(); // playerId -> platform -> price
  private priceHistory: Map<string, PriceMovement[]> = new Map(); // playerId -> movements
  private updateInterval: NodeJS.Timeout | null = null;
  private isActive = false;

  // Platform configurations
  private platforms = {
    draftkings: {
      name: "DraftKings",
      apiUrl: "https://api.draftkings.com/draftgroups/v1/draftgroups",
      refreshRate: 30000, // 30 seconds
      reliability: 0.98
    },
    fanduel: {
      name: "FanDuel",
      apiUrl: "https://api.fanduel.com/contests",
      refreshRate: 45000, // 45 seconds
      reliability: 0.97
    },
    superdraft: {
      name: "SuperDraft",
      apiUrl: "https://api.superdraft.com/contests",
      refreshRate: 60000, // 1 minute
      reliability: 0.95
    },
    yahoo: {
      name: "Yahoo Daily Fantasy",
      apiUrl: "https://fantasysports.yahooapis.com/fantasy/v2/game/nfl",
      refreshRate: 120000, // 2 minutes
      reliability: 0.93
    },
    espn: {
      name: "ESPN Fantasy",
      apiUrl: "https://fantasy.espn.com/apis/v3/games/ffl",
      refreshRate: 180000, // 3 minutes
      reliability: 0.90
    }
  };

  constructor() {
    super();
    this.setupLiveDataIntegration();
  }

  /**
   * Setup integration with live data manager
   */
  private setupLiveDataIntegration(): void {
    liveDataManager.on("marketUpdate", (data) => {
      this.handleMarketUpdate(data);
    });
  }

  /**
   * Start cross-platform price monitoring
   */
  async start(): Promise<void> {
    if (this.isActive) {
      console.log("⚠️ Cross-platform pricing already active");
      return;
    }

    console.log("💰 Starting cross-platform price monitoring...");
    this.isActive = true;

    // Initial data fetch from all platforms
    await this.fetchAllPlatformData();

    // Set up periodic updates
    this.updateInterval = setInterval(() => {
      this.fetchAllPlatformData();
    }, 30000); // Update every 30 seconds

    console.log("✅ Cross-platform pricing monitoring started");
  }

  /**
   * Stop price monitoring
   */
  stop(): void {
    if (!this.isActive) return;

    console.log("🛑 Stopping cross-platform pricing...");
    this.isActive = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log("✅ Cross-platform pricing stopped");
  }

  /**
   * Fetch data from all platforms
   */
  private async fetchAllPlatformData(): Promise<void> {
    const fetchPromises = Object.keys(this.platforms).map(platform => 
      this.fetchPlatformData(platform as keyof typeof this.platforms)
    );

    const results = await Promise.allSettled(fetchPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    if (failed > 0) {
      console.log(`⚠️ Failed to fetch from ${failed}/${results.length} platforms`);
    }

    // After all updates, analyze cross-platform opportunities
    this.analyzeArbitrageOpportunities();
  }

  /**
   * Fetch data from a specific platform
   */
  private async fetchPlatformData(platform: keyof typeof this.platforms): Promise<void> {
    try {
      // In production, this would make real API calls
      // For now, we'll simulate the data structure
      const mockData = this.generateMockPlatformData(platform);
      
      for (const playerPrice of mockData) {
        this.updatePlayerPrice(playerPrice);
      }

      console.log(`📊 Updated ${mockData.length} player prices from ${this.platforms[platform].name}`);

    } catch (error) {
      console.error(`❌ Error fetching ${platform} data:`, error);
      throw error;
    }
  }

  /**
   * Generate mock platform data (replace with real API calls)
   */
  private generateMockPlatformData(platform: string): PlatformPrice[] {
    const players = [
      { id: "cmc", name: "Christian McCaffrey", position: "RB", team: "SF" },
      { id: "jj", name: "Justin Jefferson", position: "WR", team: "MIN" },
      { id: "ja", name: "Josh Allen", position: "QB", team: "BUF" },
      { id: "tk", name: "Travis Kelce", position: "TE", team: "KC" },
      { id: "dt", name: "Derrick Henry", position: "RB", team: "TEN" },
      { id: "cd", name: "Cooper Kupp", position: "WR", team: "LAR" }
    ];

    const platformMultipliers = {
      draftkings: 1.0,
      fanduel: 0.95,
      superdraft: 1.1,
      yahoo: 0.9,
      espn: 0.85
    };

    const baseMultiplier = platformMultipliers[platform as keyof typeof platformMultipliers] || 1.0;

    return players.map(player => {
      const baseSalary = this.getBaseSalary(player.position);
      const salary = Math.round(baseSalary * baseMultiplier * (0.9 + Math.random() * 0.2));
      const projectedPoints = this.getProjectedPoints(player.position);
      const value = (projectedPoints / salary) * 1000;

      return {
        platform: platform as any,
        playerId: player.id,
        playerName: player.name,
        position: player.position,
        team: player.team,
        salary,
        ownership: Math.random() * 30, // 0-30% ownership
        value: Math.round(value * 100) / 100,
        trend: Math.random() > 0.5 ? "up" : Math.random() > 0.25 ? "down" : "neutral",
        lastUpdated: new Date()
      };
    });
  }

  /**
   * Get base salary for position
   */
  private getBaseSalary(position: string): number {
    const baseSalaries = {
      QB: 8500,
      RB: 7500,
      WR: 7000,
      TE: 5500,
      K: 4500,
      DST: 4000
    };
    return baseSalaries[position as keyof typeof baseSalaries] || 6000;
  }

  /**
   * Get projected points for position
   */
  private getProjectedPoints(position: string): number {
    const projections = {
      QB: 18 + Math.random() * 8,
      RB: 12 + Math.random() * 10,
      WR: 11 + Math.random() * 9,
      TE: 8 + Math.random() * 6,
      K: 6 + Math.random() * 4,
      DST: 7 + Math.random() * 5
    };
    return projections[position as keyof typeof projections] || 10;
  }

  /**
   * Update player price and track movements
   */
  private updatePlayerPrice(newPrice: PlatformPrice): void {
    if (!this.priceData.has(newPrice.playerId)) {
      this.priceData.set(newPrice.playerId, new Map());
    }

    const playerPrices = this.priceData.get(newPrice.playerId)!;
    const oldPrice = playerPrices.get(newPrice.platform);

    // Track price movement
    if (oldPrice && oldPrice.salary !== newPrice.salary) {
      const movement: PriceMovement = {
        playerId: newPrice.playerId,
        platform: newPrice.platform,
        oldPrice: oldPrice.salary,
        newPrice: newPrice.salary,
        change: newPrice.salary - oldPrice.salary,
        changePercent: ((newPrice.salary - oldPrice.salary) / oldPrice.salary) * 100,
        timestamp: new Date(),
        significance: this.calculateMovementSignificance(oldPrice.salary, newPrice.salary)
      };

      if (!this.priceHistory.has(newPrice.playerId)) {
        this.priceHistory.set(newPrice.playerId, []);
      }

      const history = this.priceHistory.get(newPrice.playerId)!;
      history.push(movement);

      // Keep only last 50 movements per player
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }

      // Emit price movement event
      this.emit("priceMovement", movement);

      if (movement.significance === "major") {
        console.log(`🚨 Major price movement: ${newPrice.playerName} on ${newPrice.platform}: ${movement.change > 0 ? '+' : ''}$${movement.change}`);
      }
    }

    // Update current price
    playerPrices.set(newPrice.platform, newPrice);
  }

  /**
   * Calculate significance of price movement
   */
  private calculateMovementSignificance(oldPrice: number, newPrice: number): "minor" | "moderate" | "major" {
    const changePercent = Math.abs((newPrice - oldPrice) / oldPrice) * 100;
    
    if (changePercent >= 10) return "major";
    if (changePercent >= 5) return "moderate";
    return "minor";
  }

  /**
   * Handle market updates from live data manager
   */
  private handleMarketUpdate(data: any): void {
    // Integrate external market data with our pricing
    if (data.data.symbol.includes("_SALARY")) {
      const playerId = data.data.symbol.replace("_SALARY", "");
      // Update salary information based on external feeds
    }
  }

  /**
   * Analyze arbitrage opportunities across platforms
   */
  private analyzeArbitrageOpportunities(): void {
    const opportunities: ArbitrageOpportunity[] = [];

    for (const [playerId, platformPrices] of this.priceData) {
      if (platformPrices.size < 2) continue; // Need at least 2 platforms

      const prices = Array.from(platformPrices.values());
      const sortedPrices = prices.sort((a, b) => a.salary - b.salary);
      
      const lowPrice = sortedPrices[0];
      const highPrice = sortedPrices[sortedPrices.length - 1];
      
      const priceDifference = highPrice.salary - lowPrice.salary;
      const percentDifference = (priceDifference / lowPrice.salary) * 100;

      // Consider it an arbitrage opportunity if difference > 5%
      if (percentDifference > 5) {
        const opportunity: ArbitrageOpportunity = {
          playerId,
          playerName: lowPrice.playerName,
          lowPlatform: lowPrice,
          highPlatform: highPrice,
          priceDifference,
          percentDifference,
          profitPotential: this.calculateProfitPotential(lowPrice, highPrice),
          riskLevel: this.assessRiskLevel(percentDifference, prices),
          confidence: this.calculateConfidence(prices)
        };

        opportunities.push(opportunity);
      }
    }

    if (opportunities.length > 0) {
      this.emit("arbitrageOpportunities", opportunities);
      console.log(`💎 Found ${opportunities.length} arbitrage opportunities`);
    }
  }

  /**
   * Calculate profit potential for arbitrage
   */
  private calculateProfitPotential(lowPrice: PlatformPrice, highPrice: PlatformPrice): number {
    // Simplified calculation - in reality would consider contest structures
    const valueDifference = highPrice.value - lowPrice.value;
    return Math.max(0, valueDifference * 10); // Rough estimate
  }

  /**
   * Assess risk level for arbitrage opportunity
   */
  private assessRiskLevel(percentDifference: number, prices: PlatformPrice[]): "low" | "medium" | "high" {
    // Higher price differences might indicate information asymmetry or errors
    if (percentDifference > 20) return "high";
    if (percentDifference > 10) return "medium";
    
    // Also consider platform reliability
    const avgReliability = prices.reduce((sum, p) => {
      return sum + (this.platforms[p.platform]?.reliability || 0.9);
    }, 0) / prices.length;

    return avgReliability > 0.95 ? "low" : "medium";
  }

  /**
   * Calculate confidence in arbitrage opportunity
   */
  private calculateConfidence(prices: PlatformPrice[]): number {
    // More platforms agreeing = higher confidence
    const platformCount = prices.length;
    const reliability = prices.reduce((sum, p) => {
      return sum + (this.platforms[p.platform]?.reliability || 0.9);
    }, 0) / platformCount;

    return Math.min(0.95, (platformCount / 5) * 0.4 + reliability * 0.6);
  }

  /**
   * Get cross-platform analysis for a player
   */
  getCrossPlatformAnalysis(playerId: string): CrossPlatformAnalysis | null {
    const platformPrices = this.priceData.get(playerId);
    if (!platformPrices || platformPrices.size === 0) return null;

    const prices = Array.from(platformPrices.values());
    const salaries = prices.map(p => p.salary);
    const values = prices.map(p => p.value);

    const avgSalary = salaries.reduce((sum, s) => sum + s, 0) / salaries.length;
    const minSalary = Math.min(...salaries);
    const maxSalary = Math.max(...salaries);

    const bestValue = prices.reduce((best, current) => 
      current.value > best.value ? current : best
    );

    const worstValue = prices.reduce((worst, current) => 
      current.value < worst.value ? current : worst
    );

    // Determine consensus
    const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;
    const consensus = avgValue > 3.5 ? "undervalued" : avgValue < 2.5 ? "overvalued" : "fairly_priced";

    // Calculate market efficiency (how aligned platforms are)
    const salaryStdDev = this.calculateStandardDeviation(salaries);
    const marketEfficiency = Math.max(0, 1 - (salaryStdDev / avgSalary));

    return {
      playerId,
      playerName: prices[0].playerName,
      platforms: prices,
      analysis: {
        avgSalary: Math.round(avgSalary),
        salaryRange: { min: minSalary, max: maxSalary },
        bestValue,
        worstValue,
        consensus,
        arbitrageOpportunity: (maxSalary - minSalary) / minSalary > 0.05,
        recommendedPlatform: bestValue.platform
      },
      marketEfficiency: Math.round(marketEfficiency * 100) / 100
    };
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Get price movements for a player
   */
  getPriceMovements(playerId: string, limit: number = 10): PriceMovement[] {
    const movements = this.priceHistory.get(playerId) || [];
    return movements.slice(-limit);
  }

  /**
   * Get all arbitrage opportunities
   */
  getAllArbitrageOpportunities(): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    for (const [playerId, platformPrices] of this.priceData) {
      if (platformPrices.size < 2) continue;

      const prices = Array.from(platformPrices.values());
      const sortedPrices = prices.sort((a, b) => a.salary - b.salary);
      
      const lowPrice = sortedPrices[0];
      const highPrice = sortedPrices[sortedPrices.length - 1];
      
      const percentDifference = ((highPrice.salary - lowPrice.salary) / lowPrice.salary) * 100;

      if (percentDifference > 5) {
        opportunities.push({
          playerId,
          playerName: lowPrice.playerName,
          lowPlatform: lowPrice,
          highPlatform: highPrice,
          priceDifference: highPrice.salary - lowPrice.salary,
          percentDifference,
          profitPotential: this.calculateProfitPotential(lowPrice, highPrice),
          riskLevel: this.assessRiskLevel(percentDifference, prices),
          confidence: this.calculateConfidence(prices)
        });
      }
    }

    return opportunities.sort((a, b) => b.profitPotential - a.profitPotential);
  }

  /**
   * Get platform status and performance
   */
  getPlatformStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    for (const [platform, config] of Object.entries(this.platforms)) {
      const playerCount = Array.from(this.priceData.values())
        .filter(platformPrices => platformPrices.has(platform))
        .length;

      status[platform] = {
        name: config.name,
        reliability: config.reliability,
        refreshRate: config.refreshRate,
        playersTracked: playerCount,
        lastUpdate: this.getLastUpdateTime(platform)
      };
    }

    return status;
  }

  /**
   * Get last update time for a platform
   */
  private getLastUpdateTime(platform: string): Date | null {
    let lastUpdate: Date | null = null;

    for (const platformPrices of this.priceData.values()) {
      const price = platformPrices.get(platform);
      if (price && (!lastUpdate || price.lastUpdated > lastUpdate)) {
        lastUpdate = price.lastUpdated;
      }
    }

    return lastUpdate;
  }
}

export const crossPlatformPricing = new CrossPlatformPricing();