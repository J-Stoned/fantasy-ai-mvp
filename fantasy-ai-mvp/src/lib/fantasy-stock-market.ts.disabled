import { z } from "zod";
import { realtimeDataManager, type LivePlayerData, type GameEvent } from "./realtime-data-manager";
import { biometricEngine } from "./biometric-integration";

export const StockTypeSchema = z.enum([
  "player_shares",
  "draft_picks", 
  "team_equity",
  "performance_futures",
  "rookie_contracts",
  "injury_insurance"
]);

export const OrderTypeSchema = z.enum([
  "market",
  "limit", 
  "stop_loss",
  "options_call",
  "options_put"
]);

export const StockTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  symbol: z.string(), // e.g., "CMC2024" for Christian McCaffrey 2024
  stockType: StockTypeSchema,
  orderType: OrderTypeSchema,
  quantity: z.number(),
  price: z.number(),
  executedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  status: z.enum(["pending", "executed", "cancelled", "expired"]),
});

export const PlayerStockSchema = z.object({
  symbol: z.string(),
  playerId: z.string(),
  playerName: z.string(),
  position: z.string(),
  team: z.string(),
  currentPrice: z.number(),
  dailyChange: z.number(),
  dailyChangePercent: z.number(),
  marketCap: z.number(),
  volume24h: z.number(),
  weeklyHigh: z.number(),
  weeklyLow: z.number(),
  seasonHigh: z.number(),
  seasonLow: z.number(),
  dividendYield: z.number(), // Based on fantasy points scored
  peRatio: z.number(), // Price to Expected points ratio
  volatility: z.number(),
  lastUpdated: z.date(),
});

export const PortfolioSchema = z.object({
  userId: z.string(),
  totalValue: z.number(),
  cashBalance: z.number(),
  dailyPnL: z.number(),
  dailyPnLPercent: z.number(),
  holdings: z.array(z.object({
    symbol: z.string(),
    quantity: z.number(),
    averageCost: z.number(),
    currentValue: z.number(),
    unrealizedPnL: z.number(),
    unrealizedPnLPercent: z.number(),
  })),
});

export type StockType = z.infer<typeof StockTypeSchema>;
export type OrderType = z.infer<typeof OrderTypeSchema>;
export type StockTransaction = z.infer<typeof StockTransactionSchema>;
export type PlayerStock = z.infer<typeof PlayerStockSchema>;
export type Portfolio = z.infer<typeof PortfolioSchema>;

export class FantasyStockMarket {
  private readonly initialPlayerValues = {
    QB: 1000,
    RB: 800,
    WR: 600,
    TE: 400,
    K: 100,
    DST: 150,
  };

  private readonly volatilityFactors = {
    injury_prone: 1.5,
    rookie: 1.8,
    aging_veteran: 1.3,
    consistent_performer: 0.7,
    boom_bust: 2.0,
    elite_talent: 0.9,
  };

  // Real-time market data
  private priceSubscribers = new Map<string, Set<(price: PlayerStock) => void>>();
  private marketDataCache = new Map<string, PlayerStock>();
  private isMarketMonitoringActive = false;
  private marketUpdateInterval: NodeJS.Timeout | null = null;
  
  // Price movement tracking
  private priceHistory = new Map<string, Array<{ price: number; timestamp: Date }>>();
  private readonly PRICE_HISTORY_LIMIT = 1000; // Keep last 1000 price points
  
  // Market events and triggers
  private marketEvents: Array<{
    timestamp: Date;
    type: 'surge' | 'crash' | 'halt' | 'news' | 'biometric';
    symbol: string;
    description: string;
    priceImpact: number;
  }> = [];

  constructor() {
    this.initializeRealTimeMarket();
  }

  /**
   * Initialize real-time market monitoring
   */
  private async initializeRealTimeMarket(): Promise<void> {
    // Subscribe to real-time player data
    realtimeDataManager.subscribe('player_update', (data: LivePlayerData) => {
      this.handlePlayerDataUpdate(data);
    });

    // Subscribe to game events
    realtimeDataManager.subscribe('game_event', (event: GameEvent) => {
      this.handleGameEvent(event);
    });

    // Subscribe to biometric data for emotional trading
    biometricEngine.subscribeToBiometricUpdates('all', (data) => {
      this.handleBiometricUpdate(data);
    });

    // Start market monitoring
    this.startMarketMonitoring();
    
    console.log("📈 Real-time fantasy stock market initialized");
  }

  /**
   * Start continuous market monitoring and price updates
   */
  private startMarketMonitoring(): void {
    if (this.isMarketMonitoringActive) return;
    
    this.isMarketMonitoringActive = true;
    
    // Update prices every 5 seconds during market hours
    this.marketUpdateInterval = setInterval(() => {
      this.updateMarketPrices();
    }, 5000);
    
    console.log("🚀 Market monitoring started - updating every 5 seconds");
  }

  /**
   * Handle real-time player performance updates
   */
  private async handlePlayerDataUpdate(data: LivePlayerData): Promise<void> {
    const symbol = this.generateSymbol(data.playerId, data.position);
    const currentStock = await this.getPlayerStock(symbol);
    
    if (!currentStock) return;

    // Calculate price impact based on performance vs projection
    const performanceImpact = this.calculatePerformanceImpact(data);
    const newPrice = currentStock.currentPrice * (1 + performanceImpact);
    const priceChange = newPrice - currentStock.currentPrice;

    // Update stock data
    const updatedStock: PlayerStock = {
      ...currentStock,
      currentPrice: newPrice,
      dailyChange: priceChange,
      dailyChangePercent: (priceChange / currentStock.currentPrice) * 100,
      volume24h: currentStock.volume24h + Math.abs(priceChange) * 10,
      lastUpdated: new Date()
    };

    // Cache and broadcast update
    this.marketDataCache.set(symbol, updatedStock);
    this.addToPriceHistory(symbol, newPrice);
    this.broadcastPriceUpdate(symbol, updatedStock);

    // Log significant moves
    if (Math.abs(performanceImpact) > 0.05) {
      this.marketEvents.push({
        timestamp: new Date(),
        type: performanceImpact > 0 ? 'surge' : 'crash',
        symbol,
        description: `${data.name} performance ${performanceImpact > 0 ? 'surge' : 'drop'} - ${data.currentPoints} pts vs ${data.projectedPoints} projected`,
        priceImpact: performanceImpact
      });
      
      console.log(`📊 ${symbol}: ${performanceImpact > 0 ? '📈' : '📉'} ${(performanceImpact * 100).toFixed(1)}% on performance`);
    }
  }

  /**
   * Handle game events that impact stock prices
   */
  private async handleGameEvent(event: GameEvent): Promise<void> {
    if (!event.playerId) return;

    const playerData = await realtimeDataManager.getRealtimePlayerData(event.playerId);
    if (!playerData) return;

    const symbol = this.generateSymbol(event.playerId, playerData.position);
    const impact = this.calculateGameEventImpact(event);
    
    if (Math.abs(impact) > 0.02) { // 2%+ impact
      await this.applyPriceImpact(symbol, impact, `Game event: ${event.description}`);
    }
  }

  /**
   * Handle biometric data for emotional trading patterns
   */
  private handleBiometricUpdate(data: any): void {
    // If user stress is high, reduce their trading effectiveness
    if (data.type === 'stress_level' && data.value > 70) {
      console.log(`🚨 High stress detected for user ${data.userId} - emotional trading risk elevated`);
      
      // This could trigger market-wide effects if many users are stressed
      // (e.g., during a particularly stressful game)
      this.trackEmotionalTradingPatterns(data);
    }
  }

  /**
   * Apply price impact to a stock
   */
  private async applyPriceImpact(
    symbol: string, 
    impact: number, 
    reason: string
  ): Promise<void> {
    const currentStock = await this.getPlayerStock(symbol);
    if (!currentStock) return;

    const newPrice = currentStock.currentPrice * (1 + impact);
    const priceChange = newPrice - currentStock.currentPrice;

    const updatedStock: PlayerStock = {
      ...currentStock,
      currentPrice: newPrice,
      dailyChange: currentStock.dailyChange + priceChange,
      dailyChangePercent: ((currentStock.dailyChange + priceChange) / currentStock.currentPrice) * 100,
      volume24h: currentStock.volume24h + Math.abs(priceChange) * 15,
      lastUpdated: new Date()
    };

    this.marketDataCache.set(symbol, updatedStock);
    this.addToPriceHistory(symbol, newPrice);
    this.broadcastPriceUpdate(symbol, updatedStock);

    // Log the event
    this.marketEvents.push({
      timestamp: new Date(),
      type: impact > 0 ? 'surge' : 'crash',
      symbol,
      description: reason,
      priceImpact: impact
    });

    console.log(`📈 ${symbol}: ${impact > 0 ? '📈' : '📉'} ${(impact * 100).toFixed(1)}% - ${reason}`);
  }

  async getPlayerStock(symbol: string): Promise<PlayerStock | null> {
    // Check cache first
    const cached = this.marketDataCache.get(symbol);
    if (cached) {
      return cached;
    }

    // Generate fresh stock data
    const stock = this.generateMockPlayerStock(symbol);
    this.marketDataCache.set(symbol, stock);
    return stock;
  }

  async getMarketOverview(): Promise<{
    topGainers: PlayerStock[];
    topLosers: PlayerStock[];
    mostActive: PlayerStock[];
    marketIndices: {
      qbIndex: number;
      rbIndex: number;
      wrIndex: number;
      teIndex: number;
      overallIndex: number;
    };
    marketNews: Array<{
      headline: string;
      impact: "bullish" | "bearish" | "neutral";
      affectedSymbols: string[];
      timestamp: Date;
    }>;
  }> {
    const mockStocks = [
      this.generateMockPlayerStock("CMC2024"),
      this.generateMockPlayerStock("JJ2024"),
      this.generateMockPlayerStock("TH2024"),
      this.generateMockPlayerStock("MK2024"),
      this.generateMockPlayerStock("JB2024"),
      this.generateMockPlayerStock("CD2024"),
    ];

    const sortedByChange = [...mockStocks].sort((a, b) => b.dailyChangePercent - a.dailyChangePercent);
    const sortedByVolume = [...mockStocks].sort((a, b) => b.volume24h - a.volume24h);

    return {
      topGainers: sortedByChange.slice(0, 3),
      topLosers: sortedByChange.slice(-3).reverse(),
      mostActive: sortedByVolume.slice(0, 3),
      marketIndices: {
        qbIndex: 1250.5,
        rbIndex: 985.2,
        wrIndex: 1100.8,
        teIndex: 750.3,
        overallIndex: 1025.7,
      },
      marketNews: [
        {
          headline: "McCaffrey injury concerns drive down RB market",
          impact: "bearish",
          affectedSymbols: ["CMC2024", "RB_INDEX"],
          timestamp: new Date(),
        },
        {
          headline: "Rookie WR class showing strong preseason performance",
          impact: "bullish",
          affectedSymbols: ["ROOKIE_WR_INDEX"],
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          headline: "Weather forecast affecting outdoor game player values",
          impact: "neutral",
          affectedSymbols: ["WEATHER_EXPOSED"],
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
      ],
    };
  }

  async executeOrder(transaction: Omit<StockTransaction, "id" | "executedAt" | "status">): Promise<{
    success: boolean;
    transactionId?: string;
    executionPrice?: number;
    error?: string;
  }> {
    const stock = await this.getPlayerStock(transaction.symbol);
    if (!stock) {
      return { success: false, error: "Stock not found" };
    }

    // Check market hours (fantasy stock market could be 24/7 or have specific hours)
    if (!this.isMarketOpen()) {
      return { success: false, error: "Market is closed" };
    }

    const userPortfolio = await this.getUserPortfolio(transaction.userId);
    
    // Validate order
    const validation = this.validateOrder(transaction, stock, userPortfolio);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Execute based on order type
    let executionPrice: number;
    
    switch (transaction.orderType) {
      case "market":
        executionPrice = stock.currentPrice;
        break;
      case "limit":
        if (transaction.quantity > 0 && transaction.price < stock.currentPrice) {
          return { success: false, error: "Limit buy price too low" };
        }
        if (transaction.quantity < 0 && transaction.price > stock.currentPrice) {
          return { success: false, error: "Limit sell price too high" };
        }
        executionPrice = transaction.price;
        break;
      default:
        return { success: false, error: "Order type not yet supported" };
    }

    // Simulate execution
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update portfolio (this would be done in database)
    await this.updatePortfolioAfterTrade(
      transaction.userId,
      transaction.symbol,
      transaction.quantity,
      executionPrice
    );

    return {
      success: true,
      transactionId,
      executionPrice,
    };
  }

  async getUserPortfolio(userId: string): Promise<Portfolio> {
    // This would fetch from database
    return {
      userId,
      totalValue: 50000,
      cashBalance: 15000,
      dailyPnL: 1250,
      dailyPnLPercent: 2.5,
      holdings: [
        {
          symbol: "CMC2024",
          quantity: 10,
          averageCost: 850,
          currentValue: 9200,
          unrealizedPnL: 700,
          unrealizedPnLPercent: 8.24,
        },
        {
          symbol: "JJ2024", 
          quantity: 15,
          averageCost: 650,
          currentValue: 10500,
          unrealizedPnL: 750,
          unrealizedPnLPercent: 7.69,
        },
        {
          symbol: "TH2024",
          quantity: 8,
          averageCost: 1100,
          currentValue: 8400,
          unrealizedPnL: -400,
          unrealizedPnLPercent: -4.55,
        },
      ],
    };
  }

  async getOptionsChain(symbol: string): Promise<{
    calls: Array<{
      strike: number;
      expiry: Date;
      premium: number;
      impliedVolatility: number;
      delta: number;
      openInterest: number;
    }>;
    puts: Array<{
      strike: number;
      expiry: Date;
      premium: number;
      impliedVolatility: number;
      delta: number;
      openInterest: number;
    }>;
  }> {
    const stock = await this.getPlayerStock(symbol);
    if (!stock) {
      throw new Error("Stock not found");
    }

    const currentPrice = stock.currentPrice;
    const volatility = stock.volatility;

    // Generate options chain
    const strikes = this.generateStrikes(currentPrice);
    const expiries = [
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
    ];

    const calls = [];
    const puts = [];

    for (const strike of strikes) {
      for (const expiry of expiries) {
        const timeToExpiry = (expiry.getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000);
        
        const callPremium = this.calculateOptionPremium(
          currentPrice,
          strike,
          timeToExpiry,
          volatility,
          "call"
        );

        const putPremium = this.calculateOptionPremium(
          currentPrice,
          strike,
          timeToExpiry,
          volatility,
          "put"
        );

        calls.push({
          strike,
          expiry,
          premium: callPremium,
          impliedVolatility: volatility,
          delta: this.calculateDelta(currentPrice, strike, timeToExpiry, volatility, "call"),
          openInterest: Math.floor(Math.random() * 1000),
        });

        puts.push({
          strike,
          expiry,
          premium: putPremium,
          impliedVolatility: volatility,
          delta: this.calculateDelta(currentPrice, strike, timeToExpiry, volatility, "put"),
          openInterest: Math.floor(Math.random() * 1000),
        });
      }
    }

    return { calls, puts };
  }

  async getMarketSentiment(symbol: string): Promise<{
    bullishPercent: number;
    bearishPercent: number;
    neutralPercent: number;
    socialSentiment: number; // -1 to 1
    analystRating: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
    priceTarget: number;
    newsAnalysis: {
      positive: number;
      negative: number;
      neutral: number;
    };
  }> {
    // Simulate sentiment analysis
    const bullish = Math.random() * 100;
    const bearish = Math.random() * (100 - bullish);
    const neutral = 100 - bullish - bearish;

    return {
      bullishPercent: bullish,
      bearishPercent: bearish,
      neutralPercent: neutral,
      socialSentiment: (Math.random() - 0.5) * 2, // -1 to 1
      analystRating: ["strong_buy", "buy", "hold", "sell", "strong_sell"][
        Math.floor(Math.random() * 5)
      ] as any,
      priceTarget: (await this.getPlayerStock(symbol))!.currentPrice * (0.9 + Math.random() * 0.2),
      newsAnalysis: {
        positive: Math.random() * 50,
        negative: Math.random() * 30,
        neutral: Math.random() * 20,
      },
    };
  }

  private generateMockPlayerStock(symbol: string): PlayerStock {
    const playerData = this.getPlayerDataFromSymbol(symbol);
    const basePrice = this.initialPlayerValues[playerData.position as keyof typeof this.initialPlayerValues] || 500;
    const currentPrice = basePrice * (0.8 + Math.random() * 0.4); // ±20% variation
    const dailyChange = (Math.random() - 0.5) * 100; // ±50 point change
    const dailyChangePercent = (dailyChange / currentPrice) * 100;

    return {
      symbol,
      playerId: playerData.id,
      playerName: playerData.name,
      position: playerData.position,
      team: playerData.team,
      currentPrice: Math.round(currentPrice * 100) / 100,
      dailyChange: Math.round(dailyChange * 100) / 100,
      dailyChangePercent: Math.round(dailyChangePercent * 100) / 100,
      marketCap: currentPrice * 1000000, // Arbitrary market cap
      volume24h: Math.floor(Math.random() * 10000),
      weeklyHigh: currentPrice * (1 + Math.random() * 0.15),
      weeklyLow: currentPrice * (1 - Math.random() * 0.15),
      seasonHigh: currentPrice * (1 + Math.random() * 0.3),
      seasonLow: currentPrice * (1 - Math.random() * 0.3),
      dividendYield: Math.random() * 5, // 0-5% based on fantasy points
      peRatio: 10 + Math.random() * 20, // 10-30 P/E ratio
      volatility: 0.2 + Math.random() * 0.3, // 20-50% volatility
      lastUpdated: new Date(),
    };
  }

  private getPlayerDataFromSymbol(symbol: string): {
    id: string;
    name: string;
    position: string;
    team: string;
  } {
    const playerMap: Record<string, any> = {
      "CMC2024": { id: "cmc", name: "Christian McCaffrey", position: "RB", team: "SF" },
      "JJ2024": { id: "jj", name: "Justin Jefferson", position: "WR", team: "MIN" },
      "TH2024": { id: "th", name: "Tyreek Hill", position: "WR", team: "MIA" },
      "MK2024": { id: "mk", name: "Travis Kelce", position: "TE", team: "KC" },
      "JB2024": { id: "jb", name: "Josh Allen", position: "QB", team: "BUF" },
      "CD2024": { id: "cd", name: "Cooper Kupp", position: "WR", team: "LAR" },
    };

    return playerMap[symbol] || {
      id: symbol.toLowerCase(),
      name: "Unknown Player",
      position: "RB",
      team: "UNK",
    };
  }

  private isMarketOpen(): boolean {
    // Fantasy stock market could be 24/7 or follow NFL schedule
    return true; // For now, always open
  }

  private validateOrder(
    transaction: Omit<StockTransaction, "id" | "executedAt" | "status">,
    stock: PlayerStock,
    portfolio: Portfolio
  ): { valid: boolean; error?: string } {
    // Check if user has enough cash for buy orders
    if (transaction.quantity > 0) {
      const totalCost = transaction.quantity * stock.currentPrice;
      if (totalCost > portfolio.cashBalance) {
        return { valid: false, error: "Insufficient cash balance" };
      }
    }

    // Check if user has enough shares for sell orders
    if (transaction.quantity < 0) {
      const holding = portfolio.holdings.find(h => h.symbol === transaction.symbol);
      if (!holding || Math.abs(transaction.quantity) > holding.quantity) {
        return { valid: false, error: "Insufficient shares to sell" };
      }
    }

    return { valid: true };
  }

  private async updatePortfolioAfterTrade(
    userId: string,
    symbol: string,
    quantity: number,
    price: number
  ): Promise<void> {
    // This would update the database
    console.log(`Updated portfolio for ${userId}: ${quantity} shares of ${symbol} at $${price}`);
  }

  private generateStrikes(currentPrice: number): number[] {
    const strikes = [];
    const baseStrikes = [0.8, 0.9, 0.95, 1.0, 1.05, 1.1, 1.2];
    
    for (const multiplier of baseStrikes) {
      strikes.push(Math.round(currentPrice * multiplier));
    }
    
    return strikes;
  }

  private calculateOptionPremium(
    currentPrice: number,
    strike: number,
    timeToExpiry: number,
    volatility: number,
    type: "call" | "put"
  ): number {
    // Simplified Black-Scholes approximation
    const d1 = (Math.log(currentPrice / strike) + (0.05 + 0.5 * volatility ** 2) * timeToExpiry) / 
               (volatility * Math.sqrt(timeToExpiry));
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

    if (type === "call") {
      const callPrice = currentPrice * this.normalCDF(d1) - strike * Math.exp(-0.05 * timeToExpiry) * this.normalCDF(d2);
      return Math.max(0, callPrice);
    } else {
      const putPrice = strike * Math.exp(-0.05 * timeToExpiry) * this.normalCDF(-d2) - currentPrice * this.normalCDF(-d1);
      return Math.max(0, putPrice);
    }
  }

  private calculateDelta(
    currentPrice: number,
    strike: number,
    timeToExpiry: number,
    volatility: number,
    type: "call" | "put"
  ): number {
    const d1 = (Math.log(currentPrice / strike) + (0.05 + 0.5 * volatility ** 2) * timeToExpiry) / 
               (volatility * Math.sqrt(timeToExpiry));

    if (type === "call") {
      return this.normalCDF(d1);
    } else {
      return this.normalCDF(d1) - 1;
    }
  }

  private normalCDF(x: number): number {
    // Approximation of the cumulative distribution function of the standard normal distribution
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of the error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  // Real-time market helper methods
  
  /**
   * Calculate performance impact on stock price
   */
  private calculatePerformanceImpact(data: LivePlayerData): number {
    const projectedPoints = data.projectedPoints || 15; // Default projection
    const actualPoints = data.currentPoints || 0;
    const pointsDiff = actualPoints - projectedPoints;
    
    // 1 point = ~3% price movement for skill positions, less for others
    const positionMultiplier = {
      'QB': 0.04,
      'RB': 0.035,
      'WR': 0.03,
      'TE': 0.025,
      'K': 0.015,
      'DST': 0.02
    }[data.position] || 0.03;
    
    return pointsDiff * positionMultiplier;
  }

  /**
   * Calculate game event impact on stock price
   */
  private calculateGameEventImpact(event: GameEvent): number {
    const eventImpacts = {
      'touchdown': 0.08,      // 8% increase
      'field_goal': 0.02,     // 2% increase  
      'safety': 0.04,         // 4% increase
      'interception': -0.06,  // 6% decrease
      'fumble': -0.05,        // 5% decrease
      'injury': -0.15,        // 15% decrease
      'quarter_end': 0,
      'game_end': 0,
      'timeout': 0,
      'weather_update': -0.02 // 2% decrease for weather
    };
    
    return eventImpacts[event.type] || 0;
  }

  /**
   * Update all market prices periodically
   */
  private async updateMarketPrices(): Promise<void> {
    // Add small random movements during market hours to simulate trading
    for (const [symbol, stock] of this.marketDataCache.entries()) {
      const randomMovement = (Math.random() - 0.5) * 0.01; // ±0.5% random movement
      const volatility = stock.volatility || 0.2;
      const movement = randomMovement * volatility;
      
      if (Math.abs(movement) > 0.002) { // Only apply movements > 0.2%
        await this.applyPriceImpact(symbol, movement, 'Market trading activity');
      }
    }
  }

  /**
   * Track emotional trading patterns
   */
  private trackEmotionalTradingPatterns(biometricData: any): void {
    // If multiple users show high stress, it could indicate market volatility
    // This is where you'd implement broader market psychology
    
    this.marketEvents.push({
      timestamp: new Date(),
      type: 'biometric',
      symbol: 'MARKET',
      description: `High stress levels detected across user base - emotional trading risk elevated`,
      priceImpact: -0.01 // Small negative impact on overall market
    });
  }

  /**
   * Generate symbol from player data
   */
  private generateSymbol(playerId: string, position: string): string {
    // Create standardized symbol format
    return `${playerId.slice(0, 3).toUpperCase()}${position}24`;
  }

  /**
   * Add price to historical tracking
   */
  private addToPriceHistory(symbol: string, price: number): void {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }
    
    const history = this.priceHistory.get(symbol)!;
    history.push({ price, timestamp: new Date() });
    
    // Keep only recent history
    if (history.length > this.PRICE_HISTORY_LIMIT) {
      history.shift();
    }
  }

  /**
   * Broadcast price update to subscribers
   */
  private broadcastPriceUpdate(symbol: string, stock: PlayerStock): void {
    const subscribers = this.priceSubscribers.get(symbol);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(stock);
        } catch (error) {
          console.error(`Error in price subscriber for ${symbol}:`, error);
        }
      });
    }
    
    // Also broadcast to 'ALL' subscribers
    const allSubscribers = this.priceSubscribers.get('ALL');
    if (allSubscribers) {
      allSubscribers.forEach(callback => {
        try {
          callback(stock);
        } catch (error) {
          console.error('Error in all price subscriber:', error);
        }
      });
    }
  }

  /**
   * Subscribe to real-time price updates
   */
  async subscribeToPrice(
    symbol: string,
    callback: (stock: PlayerStock) => void
  ): Promise<() => void> {
    if (!this.priceSubscribers.has(symbol)) {
      this.priceSubscribers.set(symbol, new Set());
    }
    
    this.priceSubscribers.get(symbol)!.add(callback);
    
    // Send initial data
    const currentStock = await this.getPlayerStock(symbol);
    if (currentStock) {
      callback(currentStock);
    }
    
    // Return unsubscribe function
    return () => {
      this.priceSubscribers.get(symbol)?.delete(callback);
    };
  }

  /**
   * Subscribe to all price updates
   */
  subscribeToAllPrices(callback: (stock: PlayerStock) => void): () => void {
    if (!this.priceSubscribers.has('ALL')) {
      this.priceSubscribers.set('ALL', new Set());
    }
    
    this.priceSubscribers.get('ALL')!.add(callback);
    
    return () => {
      this.priceSubscribers.get('ALL')?.delete(callback);
    };
  }

  /**
   * Get price history for a symbol
   */
  getPriceHistory(symbol: string, limit: number = 100): Array<{ price: number; timestamp: Date }> {
    const history = this.priceHistory.get(symbol) || [];
    return history.slice(-limit);
  }

  /**
   * Get recent market events
   */
  getMarketEvents(limit: number = 50): Array<{
    timestamp: Date;
    type: string;
    symbol: string;
    description: string;
    priceImpact: number;
  }> {
    return this.marketEvents.slice(-limit);
  }

  /**
   * Get real-time market statistics
   */
  getMarketStats(): {
    totalStocks: number;
    activeMonitoring: boolean;
    averageVolatility: number;
    marketEvents24h: number;
    topMovers: Array<{ symbol: string; change: number }>;
  } {
    const stocks = Array.from(this.marketDataCache.values());
    const averageVolatility = stocks.length > 0 
      ? stocks.reduce((sum, stock) => sum + stock.volatility, 0) / stocks.length 
      : 0;
    
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const events24h = this.marketEvents.filter(e => e.timestamp > last24h).length;
    
    const topMovers = stocks
      .sort((a, b) => Math.abs(b.dailyChangePercent) - Math.abs(a.dailyChangePercent))
      .slice(0, 5)
      .map(stock => ({
        symbol: stock.symbol,
        change: stock.dailyChangePercent
      }));

    return {
      totalStocks: this.marketDataCache.size,
      activeMonitoring: this.isMarketMonitoringActive,
      averageVolatility,
      marketEvents24h: events24h,
      topMovers
    };
  }

  /**
   * Stop market monitoring
   */
  stopMarketMonitoring(): void {
    this.isMarketMonitoringActive = false;
    
    if (this.marketUpdateInterval) {
      clearInterval(this.marketUpdateInterval);
      this.marketUpdateInterval = null;
    }
    
    console.log("🛑 Market monitoring stopped");
  }

  /**
   * Advanced market maker functionality
   */
  async createMarketMakerPosition(
    symbol: string,
    spreadPercentage: number = 0.02 // 2% spread
  ): Promise<{
    bidPrice: number;
    askPrice: number;
    spreadAmount: number;
  }> {
    const stock = await this.getPlayerStock(symbol);
    if (!stock) {
      throw new Error(`Stock ${symbol} not found`);
    }
    
    const spreadAmount = stock.currentPrice * spreadPercentage;
    const bidPrice = stock.currentPrice - (spreadAmount / 2);
    const askPrice = stock.currentPrice + (spreadAmount / 2);
    
    return {
      bidPrice,
      askPrice,
      spreadAmount
    };
  }

  /**
   * Execute complex trading strategies
   */
  async executeArbitrageStrategy(
    symbol1: string,
    symbol2: string,
    correlationThreshold: number = 0.8
  ): Promise<{
    arbitrageOpportunity: boolean;
    expectedProfit: number;
    strategy: string;
  }> {
    const stock1 = await this.getPlayerStock(symbol1);
    const stock2 = await this.getPlayerStock(symbol2);
    
    if (!stock1 || !stock2) {
      throw new Error("One or both stocks not found");
    }
    
    // Simple correlation-based arbitrage
    const priceDiff = Math.abs(stock1.currentPrice - stock2.currentPrice);
    const avgPrice = (stock1.currentPrice + stock2.currentPrice) / 2;
    const priceDiffPercent = priceDiff / avgPrice;
    
    return {
      arbitrageOpportunity: priceDiffPercent > 0.05, // 5% difference
      expectedProfit: priceDiffPercent * 0.5, // Conservative profit estimate
      strategy: priceDiffPercent > 0.05 
        ? `Buy ${stock1.currentPrice < stock2.currentPrice ? symbol1 : symbol2}, sell the other`
        : "No arbitrage opportunity"
    };
  }
}

// Export singleton instance
export const fantasyStockMarket = new FantasyStockMarket();