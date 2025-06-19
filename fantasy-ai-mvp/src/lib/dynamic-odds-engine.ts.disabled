import { EventEmitter } from "events";
import { liveDataManager } from "./live-data-manager";
import { crossPlatformPricing } from "./cross-platform-pricing";

export interface OddsCalculationInput {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  propType: "rushing_yards" | "receiving_yards" | "passing_yards" | "touchdowns" | "receptions" | "fantasy_points";
  line: number;
  gameId: string;
  opponent: string;
  gameTime: Date;
}

export interface CalculatedOdds {
  propType: string;
  line: number;
  overOdds: number;
  underOdds: number;
  impliedProbability: {
    over: number;
    under: number;
  };
  confidence: number;
  edge: number; // Expected value edge
  volume: number;
  lastCalculated: Date;
  factors: {
    playerForm: number;
    matchupRating: number;
    weather: number;
    injuries: number;
    vegas: number;
    marketSentiment: number;
  };
}

export interface MarketEfficiency {
  playerId: string;
  propType: string;
  efficiency: number; // 0-1 scale
  marketGaps: {
    type: "overvalued" | "undervalued";
    magnitude: number;
    confidence: number;
  }[];
  arbitrageOpportunities: {
    platform1: string;
    platform2: string;
    odds1: number;
    odds2: number;
    guaranteedProfit: number;
  }[];
}

export interface SmartWagerSuggestion {
  playerId: string;
  playerName: string;
  propType: string;
  line: number;
  side: "over" | "under";
  confidence: number;
  expectedValue: number;
  reasoning: string[];
  riskLevel: "low" | "medium" | "high";
  optimalStake: number;
  maxStake: number;
}

export class DynamicOddsEngine extends EventEmitter {
  private oddsCache: Map<string, CalculatedOdds> = new Map();
  private marketData: Map<string, any> = new Map();
  private playerMetrics: Map<string, any> = new Map();
  private weatherData: Map<string, any> = new Map();
  private injuryData: Map<string, any> = new Map();
  
  // Kelly Criterion and bankroll management
  private readonly kellyMultiplier = 0.25; // Conservative Kelly
  private readonly maxBetPercentage = 0.05; // Max 5% of bankroll per bet
  
  constructor() {
    super();
    this.setupDataIntegration();
    this.startOddsCalculation();
  }

  /**
   * Setup integration with data sources
   */
  private setupDataIntegration(): void {
    liveDataManager.on("playerUpdate", (data) => {
      this.handlePlayerUpdate(data);
    });

    liveDataManager.on("gameEvent", (data) => {
      this.handleGameEvent(data);
    });

    crossPlatformPricing.on("marketUpdate", (data) => {
      this.handleMarketUpdate(data);
    });
  }

  /**
   * Start continuous odds calculation
   */
  private startOddsCalculation(): void {
    // Recalculate odds every 30 seconds
    setInterval(() => {
      this.recalculateAllOdds();
    }, 30000);

    console.log("🎯 Dynamic odds engine started");
  }

  /**
   * Calculate odds for a specific prop bet
   */
  async calculateOdds(input: OddsCalculationInput): Promise<CalculatedOdds> {
    console.log(`🔢 Calculating odds for ${input.playerName} ${input.propType} ${input.line}`);

    // Get all the factors that influence odds
    const factors = await this.gatherOddsFactors(input);
    
    // Calculate base probability
    const baseProbability = await this.calculateBaseProbability(input, factors);
    
    // Apply market adjustments
    const marketAdjustedProb = this.applyMarketAdjustments(baseProbability, factors);
    
    // Convert probability to odds
    const { overOdds, underOdds } = this.probabilityToOdds(marketAdjustedProb);
    
    // Calculate confidence and edge
    const confidence = this.calculateConfidence(factors);
    const edge = this.calculateExpectedValueEdge(marketAdjustedProb, overOdds, underOdds);
    
    const calculatedOdds: CalculatedOdds = {
      propType: input.propType,
      line: input.line,
      overOdds,
      underOdds,
      impliedProbability: {
        over: marketAdjustedProb,
        under: 1 - marketAdjustedProb
      },
      confidence,
      edge,
      volume: this.estimateVolume(input),
      lastCalculated: new Date(),
      factors
    };

    // Cache the odds
    const cacheKey = `${input.playerId}_${input.propType}_${input.line}`;
    this.oddsCache.set(cacheKey, calculatedOdds);

    // Emit odds update
    this.emit("oddsCalculated", {
      playerId: input.playerId,
      odds: calculatedOdds
    });

    return calculatedOdds;
  }

  /**
   * Gather all factors that influence odds calculation
   */
  private async gatherOddsFactors(input: OddsCalculationInput): Promise<any> {
    const playerMetrics = this.getPlayerMetrics(input.playerId);
    const matchupData = await this.getMatchupData(input.team, input.opponent);
    const weatherData = this.getWeatherData(input.gameId);
    const injuryData = this.getInjuryData(input.playerId);
    const vegasData = await this.getVegasLines(input);
    const marketSentiment = await this.getMarketSentiment(input.playerId);

    return {
      playerForm: this.calculatePlayerForm(playerMetrics),
      matchupRating: this.calculateMatchupRating(matchupData, input),
      weather: this.calculateWeatherImpact(weatherData, input),
      injuries: this.calculateInjuryImpact(injuryData),
      vegas: this.calculateVegasAdjustment(vegasData, input),
      marketSentiment: this.calculateSentimentImpact(marketSentiment)
    };
  }

  /**
   * Calculate base probability before market adjustments
   */
  private async calculateBaseProbability(input: OddsCalculationInput, factors: any): Promise<number> {
    // Get player's historical performance for this prop type
    const historicalData = await this.getHistoricalPerformance(input.playerId, input.propType);
    
    // Calculate season averages and trends
    const seasonAvg = historicalData.seasonAverage || 0;
    const recentForm = historicalData.last5Games || seasonAvg;
    const trend = historicalData.trend || 0;

    // Apply situational adjustments
    let adjustedProjection = seasonAvg;
    
    // Recent form weight (40%)
    adjustedProjection = adjustedProjection * 0.6 + recentForm * 0.4;
    
    // Apply trend (10% impact)
    adjustedProjection += (trend * adjustedProjection * 0.1);
    
    // Apply matchup factor (20% impact)
    adjustedProjection *= (1 + (factors.matchupRating - 0.5) * 0.2);
    
    // Apply weather factor (5% impact for relevant positions)
    if (this.isWeatherSensitive(input.position)) {
      adjustedProjection *= (1 + (factors.weather - 0.5) * 0.05);
    }
    
    // Apply injury factor (15% impact)
    adjustedProjection *= (1 - factors.injuries * 0.15);

    // Convert projection to probability of going over the line
    const probability = this.projectionToProbability(adjustedProjection, input.line, input.propType);
    
    return Math.max(0.05, Math.min(0.95, probability)); // Clamp between 5% and 95%
  }

  /**
   * Apply market adjustments based on external factors
   */
  private applyMarketAdjustments(baseProbability: number, factors: any): number {
    let adjustedProb = baseProbability;

    // Vegas adjustment (strong signal)
    adjustedProb = adjustedProb * 0.7 + factors.vegas * 0.3;
    
    // Market sentiment adjustment (moderate signal)
    adjustedProb = adjustedProb * 0.9 + factors.marketSentiment * 0.1;
    
    // Player form adjustment
    const formAdjustment = (factors.playerForm - 0.5) * 0.1;
    adjustedProb += formAdjustment;

    return Math.max(0.05, Math.min(0.95, adjustedProb));
  }

  /**
   * Convert probability to American odds
   */
  private probabilityToOdds(probability: number): { overOdds: number; underOdds: number } {
    // Add vig (juice) to both sides
    const vig = 0.05; // 5% vig
    const adjustedOverProb = probability * (1 + vig);
    const adjustedUnderProb = (1 - probability) * (1 + vig);

    // Convert to American odds
    const overOdds = adjustedOverProb > 0.5 
      ? Math.round(-(adjustedOverProb / (1 - adjustedOverProb)) * 100)
      : Math.round(((1 - adjustedOverProb) / adjustedOverProb) * 100);

    const underOdds = adjustedUnderProb > 0.5
      ? Math.round(-(adjustedUnderProb / (1 - adjustedUnderProb)) * 100)
      : Math.round(((1 - adjustedUnderProb) / adjustedUnderProb) * 100);

    return { overOdds, underOdds };
  }

  /**
   * Calculate confidence in the odds calculation
   */
  private calculateConfidence(factors: any): number {
    let confidence = 0.5; // Base confidence

    // More data = higher confidence
    if (factors.playerForm > 0) confidence += 0.15;
    if (factors.vegas > 0) confidence += 0.2; // Vegas lines are strong signal
    if (factors.matchupRating > 0) confidence += 0.1;
    if (factors.marketSentiment > 0) confidence += 0.05;

    // Consistency increases confidence
    const factorConsistency = this.calculateFactorConsistency(factors);
    confidence += factorConsistency * 0.1;

    return Math.min(0.95, confidence);
  }

  /**
   * Calculate expected value edge
   */
  private calculateExpectedValueEdge(probability: number, overOdds: number, underOdds: number): number {
    // Calculate fair odds without vig
    const fairOverOdds = probability > 0.5 
      ? -(probability / (1 - probability)) * 100
      : ((1 - probability) / probability) * 100;

    const fairUnderOdds = (1 - probability) > 0.5
      ? -((1 - probability) / probability) * 100
      : (probability / (1 - probability)) * 100;

    // Calculate edge as difference between our odds and market odds
    const overEdge = this.calculateBetEdge(probability, overOdds);
    const underEdge = this.calculateBetEdge(1 - probability, underOdds);

    return Math.max(overEdge, underEdge);
  }

  /**
   * Calculate edge for a specific bet
   */
  private calculateBetEdge(winProbability: number, odds: number): number {
    const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
    const expectedValue = (winProbability * decimalOdds) - 1;
    return expectedValue;
  }

  /**
   * Generate smart wager suggestions
   */
  async generateWagerSuggestions(
    playerId: string,
    bankroll: number,
    riskTolerance: "conservative" | "moderate" | "aggressive" = "moderate"
  ): Promise<SmartWagerSuggestion[]> {
    const suggestions: SmartWagerSuggestion[] = [];
    
    // Get all calculated odds for this player
    const playerOdds = Array.from(this.oddsCache.entries())
      .filter(([key]) => key.startsWith(playerId))
      .map(([key, odds]) => odds);

    for (const odds of playerOdds) {
      // Only suggest bets with positive expected value
      if (odds.edge > 0.02) { // At least 2% edge
        const suggestion = this.createWagerSuggestion(odds, bankroll, riskTolerance);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    // Sort by expected value
    return suggestions.sort((a, b) => b.expectedValue - a.expectedValue);
  }

  /**
   * Create a wager suggestion from odds
   */
  private createWagerSuggestion(
    odds: CalculatedOdds,
    bankroll: number,
    riskTolerance: "conservative" | "moderate" | "aggressive"
  ): SmartWagerSuggestion | null {
    const overEdge = this.calculateBetEdge(odds.impliedProbability.over, odds.overOdds);
    const underEdge = this.calculateBetEdge(odds.impliedProbability.under, odds.underOdds);

    const bestSide = overEdge > underEdge ? "over" : "under";
    const bestEdge = Math.max(overEdge, underEdge);
    const bestOdds = bestSide === "over" ? odds.overOdds : odds.underOdds;
    const winProbability = bestSide === "over" ? odds.impliedProbability.over : odds.impliedProbability.under;

    // Calculate Kelly Criterion stake
    const kellyCriterion = (winProbability * (Math.abs(bestOdds) / 100) - (1 - winProbability)) / (Math.abs(bestOdds) / 100);
    
    // Apply risk tolerance multiplier
    const riskMultipliers = {
      conservative: 0.1,
      moderate: 0.25,
      aggressive: 0.5
    };
    
    const adjustedKelly = kellyCriterion * riskMultipliers[riskTolerance];
    const optimalStake = Math.min(
      bankroll * adjustedKelly,
      bankroll * this.maxBetPercentage
    );

    if (optimalStake < 1) return null; // Not worth betting less than $1

    const reasoning = this.generateWagerReasoning(odds, bestSide, bestEdge);

    return {
      playerId: "player_id", // Would get from odds context
      playerName: "Player Name", // Would get from odds context  
      propType: odds.propType,
      line: odds.line,
      side: bestSide,
      confidence: odds.confidence,
      expectedValue: bestEdge,
      reasoning,
      riskLevel: this.assessRiskLevel(odds.confidence, bestEdge),
      optimalStake: Math.round(optimalStake),
      maxStake: Math.round(bankroll * this.maxBetPercentage)
    };
  }

  /**
   * Generate reasoning for wager suggestion
   */
  private generateWagerReasoning(odds: CalculatedOdds, side: "over" | "under", edge: number): string[] {
    const reasoning: string[] = [];

    if (edge > 0.1) {
      reasoning.push(`Strong ${(edge * 100).toFixed(1)}% expected value edge`);
    } else {
      reasoning.push(`Moderate ${(edge * 100).toFixed(1)}% expected value edge`);
    }

    if (odds.confidence > 0.8) {
      reasoning.push("High confidence in calculation");
    }

    if (odds.factors.playerForm > 0.6) {
      reasoning.push("Player in excellent recent form");
    }

    if (odds.factors.matchupRating > 0.7) {
      reasoning.push("Favorable matchup conditions");
    }

    if (odds.factors.vegas > 0.6 && side === "over") {
      reasoning.push("Vegas lines support over bet");
    }

    if (odds.factors.marketSentiment < 0.4 && side === "over") {
      reasoning.push("Contrarian opportunity - public on under");
    }

    return reasoning;
  }

  /**
   * Assess risk level for a wager
   */
  private assessRiskLevel(confidence: number, edge: number): "low" | "medium" | "high" {
    if (confidence > 0.8 && edge > 0.05) return "low";
    if (confidence > 0.6 && edge > 0.02) return "medium";
    return "high";
  }

  // Helper methods for data retrieval and calculations
  private getPlayerMetrics(playerId: string): any {
    return this.playerMetrics.get(playerId) || {};
  }

  private async getMatchupData(team: string, opponent: string): Promise<any> {
    // Would fetch real matchup data
    return {
      teamRanking: Math.random(),
      opponentRanking: Math.random(),
      headToHead: Math.random()
    };
  }

  private getWeatherData(gameId: string): any {
    return this.weatherData.get(gameId) || { conditions: "clear", temperature: 70, wind: 5 };
  }

  private getInjuryData(playerId: string): any {
    return this.injuryData.get(playerId) || { status: "healthy", risk: 0 };
  }

  private async getVegasLines(input: OddsCalculationInput): Promise<any> {
    // Would fetch real Vegas lines
    return { line: input.line, movement: 0, sharp_money: "neutral" };
  }

  private async getMarketSentiment(playerId: string): Promise<any> {
    // Would analyze social sentiment, betting patterns, etc.
    return { sentiment: Math.random(), volume: Math.random() };
  }

  private calculatePlayerForm(metrics: any): number {
    return Math.random(); // Simplified
  }

  private calculateMatchupRating(matchupData: any, input: OddsCalculationInput): number {
    return Math.random(); // Simplified
  }

  private calculateWeatherImpact(weatherData: any, input: OddsCalculationInput): number {
    return Math.random(); // Simplified
  }

  private calculateInjuryImpact(injuryData: any): number {
    return injuryData.risk || 0;
  }

  private calculateVegasAdjustment(vegasData: any, input: OddsCalculationInput): number {
    return Math.random(); // Simplified
  }

  private calculateSentimentImpact(sentiment: any): number {
    return sentiment.sentiment || 0.5;
  }

  private isWeatherSensitive(position: string): boolean {
    return ["QB", "WR", "K"].includes(position);
  }

  private projectionToProbability(projection: number, line: number, propType: string): number {
    // Use normal distribution to calculate probability
    const standardDev = this.getStandardDeviation(propType);
    const zScore = (line - projection) / standardDev;
    return 1 - this.normalCDF(zScore);
  }

  private getStandardDeviation(propType: string): number {
    const stdDevs = {
      rushing_yards: 25,
      receiving_yards: 20,
      passing_yards: 50,
      touchdowns: 0.8,
      receptions: 2.5,
      fantasy_points: 6
    };
    return stdDevs[propType as keyof typeof stdDevs] || 10;
  }

  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
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

  private async getHistoricalPerformance(playerId: string, propType: string): Promise<any> {
    // Would fetch real historical data
    return {
      seasonAverage: Math.random() * 100,
      last5Games: Math.random() * 100,
      trend: (Math.random() - 0.5) * 0.2
    };
  }

  private calculateFactorConsistency(factors: any): number {
    const values = Object.values(factors) as number[];
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return 1 - Math.min(1, variance); // Lower variance = higher consistency
  }

  private estimateVolume(input: OddsCalculationInput): number {
    // Estimate betting volume based on player popularity, game importance, etc.
    return Math.random() * 10000;
  }

  private handlePlayerUpdate(data: any): void {
    this.playerMetrics.set(data.update.playerId, data.update);
  }

  private handleGameEvent(data: any): void {
    // Update relevant odds based on game events
    this.recalculateOddsForGame(data.event.gameId);
  }

  private handleMarketUpdate(data: any): void {
    this.marketData.set(data.symbol, data.data);
  }

  private recalculateAllOdds(): void {
    // Recalculate all cached odds
    for (const [key, odds] of this.oddsCache) {
      if (Date.now() - odds.lastCalculated.getTime() > 60000) { // Older than 1 minute
        // Trigger recalculation
        this.emit("oddsRecalculationNeeded", key);
      }
    }
  }

  private recalculateOddsForGame(gameId: string): void {
    // Recalculate odds for all props in a specific game
    for (const [key, odds] of this.oddsCache) {
      if (key.includes(gameId)) {
        this.emit("oddsRecalculationNeeded", key);
      }
    }
  }
}

export const dynamicOddsEngine = new DynamicOddsEngine();