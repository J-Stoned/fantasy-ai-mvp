import { prisma } from "./prisma";
import { aiService, PlayerAnalysis, LineupNarrative } from "./ai-service";
import { z } from "zod";

// Enhanced narrative insight with AI integration
interface NarrativeInsight {
  insight: string;
  confidence: number;
  narrativeScore?: number;
  aiSource?: "openai" | "claude" | "local";
  type?: "narrative_factor" | "risk_assessment" | "opportunity";
}

interface LivePlayerData {
  playerId: string;
  name: string;
  currentPoints: number;
  projectedPoints: number;
}

// Advanced ML model for lineup optimization
export interface PlayerProjection {
  playerId: string;
  projectedPoints: number;
  confidence: number;
  ceiling: number;
  floor: number;
  volatility: number;
  injuryRisk: number;
  weatherImpact: number;
  matchupAdvantage: number;
  recentFormScore: number;
  restAdvantage: number;
  narrativeBonus: number; // Revenge games, milestones, etc.
}

export interface LineupConstraints {
  salaryCap?: number;
  requiredPositions: Record<string, number>;
  maxPlayersPerTeam?: number;
  lockedPlayers?: string[];
  excludedPlayers?: string[];
  stackingRules?: StackingRule[];
}

export interface StackingRule {
  type: "QB_WR" | "QB_TE" | "RB_DEF" | "GAME_STACK" | "TEAM_STACK";
  required: boolean;
  weight: number;
}

export interface OptimizedLineup {
  lineup: LineupPlayer[];
  projectedPoints: number;
  confidence: number;
  risk: "low" | "medium" | "high";
  upside: number;
  salary: number;
  ownership: number; // Projected ownership percentage
  differentiators: string[]; // Key players that make this lineup unique
  correlations: LineupCorrelation[];
  aiInsights: string[];
  narrativeInsights: NarrativeInsight[]; // AI-powered narrative analysis
  gameScript: string; // Overall game narrative
  realTimeAdjustments: string[]; // Live adjustments based on breaking news
}

export interface LineupPlayer {
  playerId: string;
  name: string;
  position: string;
  team: string;
  opponent: string;
  projectedPoints: number;
  salary: number;
  ownership: number;
  leverage: number; // Tournament leverage score
}

export interface LineupCorrelation {
  type: "positive" | "negative";
  players: string[];
  strength: number;
  description: string;
}

export interface AILineupInsight {
  type: "weather" | "injury" | "matchup" | "trend" | "narrative" | "contrarian";
  severity: "info" | "warning" | "critical";
  message: string;
  affectedPlayers: string[];
  impactEstimate: number; // Points impact
}

export class AILineupOptimizer {
  private readonly ML_FEATURES = [
    "player_avg_points_last_5",
    "opponent_defense_ranking",
    "weather_conditions",
    "injury_status_encoded",
    "days_rest",
    "home_away",
    "vegas_total",
    "vegas_spread",
    "player_salary_efficiency",
    "recent_target_share",
    "red_zone_opportunities",
    "snap_count_trend",
    "social_sentiment_score",
    "beat_writer_sentiment",
    "historical_matchup_performance",
    "coaching_tendency_score",
    "pace_of_play_differential",
    "pressure_rate_allowed",
    "yards_before_contact",
    "air_yards_share"
  ];

  /**
   * Generate multiple optimized lineups with AI narrative insights
   */
  async generateOptimalLineups(
    userId: string,
    leagueId: string,
    week: number,
    constraints: LineupConstraints,
    count: number = 5
  ): Promise<{
    lineups: OptimizedLineup[];
    insights: AILineupInsight[];
    recommendations: string[];
    gameScripts: Record<string, string>; // Game-level narratives
    breakingNews: string[]; // Real-time updates
  }> {
    try {
      // Get user's available players
      const availablePlayers = await this.getAvailablePlayers(userId, leagueId);
      
      // Generate projections using advanced ML
      const projections = await this.generatePlayerProjections(
        availablePlayers,
        week
      );

      // Generate lineups with different strategies
      const strategies = [
        { name: "balanced", riskTolerance: 0.5, upsideFocus: 0.5 },
        { name: "floor", riskTolerance: 0.2, upsideFocus: 0.3 },
        { name: "ceiling", riskTolerance: 0.8, upsideFocus: 0.9 },
        { name: "contrarian", riskTolerance: 0.6, upsideFocus: 0.7, ownershipFade: true },
        { name: "narrative", riskTolerance: 0.6, upsideFocus: 0.8, narrativeFocus: true },
        { name: "correlation", riskTolerance: 0.5, upsideFocus: 0.6, correlationFocus: true }
      ];

      const lineups: OptimizedLineup[] = [];
      const gameScripts: Record<string, string> = {};
      const breakingNews: string[] = [];
      
      // Get real-time data for live adjustments
      const liveUpdates = await this.getLiveDataUpdates(availablePlayers);
      breakingNews.push(...liveUpdates);
      
      for (let i = 0; i < Math.min(count, strategies.length); i++) {
        const strategy = strategies[i];
        const lineup = await this.optimizeLineupWithStrategy(
          projections,
          constraints,
          strategy
        );
        
        // Generate narrative insights for this lineup
        if (strategy.narrativeFocus || i === 0) { // Always do narrative for first lineup
          const narrativeData = await this.generateLineupNarratives(lineup, week);
          lineup.narrativeInsights = narrativeData.insights;
          lineup.gameScript = narrativeData.gameScript;
          lineup.realTimeAdjustments = narrativeData.adjustments;
          
          // Store game scripts
          Object.assign(gameScripts, narrativeData.gameScripts);
        }
        
        lineups.push(lineup);
      }

      // Generate insights
      const insights = await this.generateLineupInsights(lineups, projections);
      
      // Generate recommendations
      const recommendations = this.generateSmartRecommendations(
        lineups,
        insights,
        projections
      );

      return { lineups, insights, recommendations, gameScripts, breakingNews };

    } catch (error) {
      console.error("Error generating optimal lineups:", error);
      throw error;
    }
  }

  /**
   * Real-time lineup adjustments based on breaking news
   */
  async adjustLineupForNews(
    currentLineup: LineupPlayer[],
    newsEvent: {
      type: "injury" | "inactive" | "weather" | "coaching_change";
      affectedPlayers: string[];
      severity: "minor" | "major" | "critical";
      details: string;
    }
  ): Promise<{
    adjustedLineup: LineupPlayer[];
    changes: Array<{ out: LineupPlayer; in: LineupPlayer; reason: string }>;
    projectedImpact: number;
  }> {
    // This would integrate with real-time news feeds and make smart swaps
    const adjustedLineup = [...currentLineup];
    const changes: Array<{ out: LineupPlayer; in: LineupPlayer; reason: string }> = [];

    // Simulate intelligent adjustments based on news
    for (const playerId of newsEvent.affectedPlayers) {
      const playerIndex = adjustedLineup.findIndex(p => p.playerId === playerId);
      if (playerIndex !== -1) {
        // Find optimal replacement
        const replacement = await this.findOptimalReplacement(
          adjustedLineup[playerIndex],
          adjustedLineup,
          newsEvent
        );

        if (replacement) {
          changes.push({
            out: adjustedLineup[playerIndex],
            in: replacement,
            reason: `${newsEvent.type}: ${newsEvent.details}`
          });
          adjustedLineup[playerIndex] = replacement;
        }
      }
    }

    const projectedImpact = this.calculateLineupImpact(currentLineup, adjustedLineup);

    return { adjustedLineup, changes, projectedImpact };
  }

  /**
   * Advanced AI-powered player projections
   */
  private async generatePlayerProjections(
    players: any[],
    week: number
  ): Promise<PlayerProjection[]> {
    const projections: PlayerProjection[] = [];

    // Process players in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (player) => {
        try {
          // Use AI service for enhanced analysis
          const aiAnalysis = await aiService.analyzePlayer(
            player.name || `Player ${player.id}`,
            player.position || "RB",
            player.team || "UNK",
            player.opponent || "UNK",
            {
              week,
              injuryStatus: player.injuryStatus,
              weather: player.gameWeather,
              gameContext: player.gameContext,
              recentStats: player.recentStats
            }
          );

          // Convert AI analysis to projection format
          const projection: PlayerProjection = {
            playerId: player.id,
            projectedPoints: aiAnalysis.projectedPoints,
            confidence: aiAnalysis.confidence,
            ceiling: aiAnalysis.projectedPoints * 1.4, // Calculate from AI insights
            floor: aiAnalysis.projectedPoints * 0.65,
            volatility: this.calculateVolatilityFromAI(aiAnalysis),
            injuryRisk: this.extractInjuryRisk(aiAnalysis.injuryRisk),
            weatherImpact: this.extractWeatherImpact(aiAnalysis.weatherImpact),
            matchupAdvantage: this.parseMatchupAdvantage(aiAnalysis.matchupAnalysis),
            recentFormScore: this.calculateFormScore(player),
            restAdvantage: this.calculateRestAdvantage(player),
            narrativeBonus: this.calculateNarrativeBonusFromAI(aiAnalysis.narrativeInsights)
          };

          return projection;
        } catch (error) {
          console.error(`Error analyzing ${player.name}:`, error);
          
          // Fallback to basic projection
          const baseProjection = await this.getBaseProjection(player, week);
          return {
            playerId: player.id,
            projectedPoints: baseProjection,
            confidence: 0.5,
            ceiling: baseProjection * 1.3,
            floor: baseProjection * 0.6,
            volatility: 0.25,
            injuryRisk: 0.1,
            weatherImpact: 0,
            matchupAdvantage: 0,
            recentFormScore: 5,
            restAdvantage: 0,
            narrativeBonus: 0
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      projections.push(...batchResults);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < players.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return projections;
  }

  /**
   * Optimize lineup with specific strategy
   */
  private async optimizeLineupWithStrategy(
    projections: PlayerProjection[],
    constraints: LineupConstraints,
    strategy: any
  ): Promise<OptimizedLineup> {
    // This would use linear programming or genetic algorithms
    // For now, simulate optimization
    const lineup: LineupPlayer[] = [];
    let totalProjected = 0;
    let totalSalary = 0;

    // Position requirements
    const positions = Object.keys(constraints.requiredPositions);
    
    for (const position of positions) {
      const count = constraints.requiredPositions[position];
      const eligiblePlayers = projections
        .filter(p => this.isEligibleForPosition(p.playerId, position))
        .sort((a, b) => {
          // Sort based on strategy
          if (strategy.name === "floor") {
            return b.floor - a.floor;
          } else if (strategy.name === "ceiling") {
            return b.ceiling - a.ceiling;
          } else {
            return b.projectedPoints - a.projectedPoints;
          }
        });

      for (let i = 0; i < count && i < eligiblePlayers.length; i++) {
        const proj = eligiblePlayers[i];
        const player = await this.getPlayerDetails(proj.playerId);
        
        lineup.push({
          playerId: proj.playerId,
          name: player.name,
          position: player.position,
          team: player.team,
          opponent: player.opponent || "UNK",
          projectedPoints: proj.projectedPoints,
          salary: player.salary || 5000,
          ownership: Math.random() * 30,
          leverage: this.calculateLeverage(proj, strategy)
        });

        totalProjected += proj.projectedPoints;
        totalSalary += player.salary || 5000;
      }
    }

    const correlations = this.findLineupCorrelations(lineup);
    const aiInsights = this.generateLineupSpecificInsights(lineup, projections);

    return {
      lineup,
      projectedPoints: totalProjected,
      confidence: 0.75,
      risk: this.calculateLineupRisk(lineup, projections),
      upside: this.calculateLineupUpside(lineup, projections),
      salary: totalSalary,
      ownership: this.calculateLineupOwnership(lineup),
      differentiators: this.findDifferentiators(lineup),
      correlations,
      aiInsights,
      narrativeInsights: [], // Will be populated by generateLineupNarratives
      gameScript: "", // Will be populated by generateLineupNarratives
      realTimeAdjustments: [] // Will be populated by generateLineupNarratives
    };
  }

  /**
   * Generate smart insights about lineups
   */
  private async generateLineupInsights(
    lineups: OptimizedLineup[],
    projections: PlayerProjection[]
  ): Promise<AILineupInsight[]> {
    const insights: AILineupInsight[] = [];

    // Weather insights
    const weatherImpactedPlayers = projections
      .filter(p => Math.abs(p.weatherImpact) > 2)
      .map(p => p.playerId);

    if (weatherImpactedPlayers.length > 0) {
      insights.push({
        type: "weather",
        severity: "warning",
        message: "Severe weather expected to impact outdoor games",
        affectedPlayers: weatherImpactedPlayers,
        impactEstimate: -3.5
      });
    }

    // Injury insights
    const injuryRiskPlayers = projections
      .filter(p => p.injuryRisk > 0.3)
      .map(p => p.playerId);

    if (injuryRiskPlayers.length > 0) {
      insights.push({
        type: "injury",
        severity: "critical",
        message: "High injury risk detected for key players",
        affectedPlayers: injuryRiskPlayers,
        impactEstimate: -5.0
      });
    }

    // Contrarian insights
    const lowOwnershipHighUpside = lineups[0].lineup
      .filter(p => p.ownership < 10 && p.projectedPoints > 15)
      .map(p => p.playerId);

    if (lowOwnershipHighUpside.length > 0) {
      insights.push({
        type: "contrarian",
        severity: "info",
        message: "Low-owned players with tournament-winning upside identified",
        affectedPlayers: lowOwnershipHighUpside,
        impactEstimate: 8.0
      });
    }

    return insights;
  }

  /**
   * Generate human-readable recommendations
   */
  private generateSmartRecommendations(
    lineups: OptimizedLineup[],
    insights: AILineupInsight[],
    projections: PlayerProjection[]
  ): string[] {
    const recommendations: string[] = [];

    // Strategy recommendations
    if (lineups[0].risk === "high") {
      recommendations.push(
        "🎲 Your optimal lineup has high volatility - perfect for tournaments but risky for cash games"
      );
    }

    // Correlation recommendations
    const strongCorrelations = lineups[0].correlations.filter(c => c.strength > 0.7);
    if (strongCorrelations.length > 0) {
      recommendations.push(
        `🔗 Strong correlation play detected: ${strongCorrelations[0].description}`
      );
    }

    // Value recommendations
    const valuePlay = lineups[0].lineup
      .sort((a, b) => (b.projectedPoints / b.salary) - (a.projectedPoints / a.salary))[0];
    
    recommendations.push(
      `💎 Best value play: ${valuePlay.name} at $${valuePlay.salary} (${(valuePlay.projectedPoints / valuePlay.salary * 1000).toFixed(1)}x value)`
    );

    // Narrative plays
    const narrativePlays = projections
      .filter(p => p.narrativeBonus > 2)
      .slice(0, 2);

    if (narrativePlays.length > 0) {
      recommendations.push(
        "📖 Narrative alert: Players facing former teams or chasing milestones identified"
      );
    }

    return recommendations;
  }

  // Helper methods (simplified for demonstration)
  private async getAvailablePlayers(userId: string, leagueId: string): Promise<any[]> {
    return prisma.player.findMany({
      where: { leagueId },
      take: 100
    });
  }

  private async getPlayerDetails(playerId: string): Promise<any> {
    const player = await prisma.player.findUnique({
      where: { id: playerId }
    });
    return player || { 
      name: "Unknown", 
      position: "RB", 
      team: "UNK", 
      salary: 5000 
    };
  }

  private async getBaseProjection(player: any, week: number): Promise<number> {
    // Simulate base projection
    const positionAverages: Record<string, number> = {
      QB: 18, RB: 12, WR: 10, TE: 8, K: 7, DST: 8
    };
    return positionAverages[player.position] || 10 + Math.random() * 5;
  }

  private calculateWeatherImpact(player: any): number {
    // Simulate weather impact
    return (Math.random() - 0.5) * 4;
  }

  private calculateMatchupAdvantage(player: any): number {
    return (Math.random() - 0.5) * 3;
  }

  private calculateFormScore(player: any): number {
    return Math.random() * 10;
  }

  private calculateRestAdvantage(player: any): number {
    return Math.random() * 2;
  }

  private calculateNarrativeBonus(player: any): number {
    // Revenge games, milestones, etc.
    return Math.random() < 0.1 ? 3 : 0;
  }

  private isEligibleForPosition(playerId: string, position: string): boolean {
    // Simplified - in reality would check actual eligibility
    return true;
  }

  private calculateLeverage(proj: PlayerProjection, strategy: any): number {
    const ownership = Math.random() * 30;
    const upside = proj.ceiling / proj.projectedPoints;
    return upside / (ownership / 10 + 1);
  }

  private calculateLineupRisk(lineup: LineupPlayer[], projections: PlayerProjection[]): "low" | "medium" | "high" {
    const avgVolatility = lineup.reduce((sum, p) => {
      const proj = projections.find(pr => pr.playerId === p.playerId);
      return sum + (proj?.volatility || 0);
    }, 0) / lineup.length;

    if (avgVolatility < 0.15) return "low";
    if (avgVolatility < 0.25) return "medium";
    return "high";
  }

  private calculateLineupUpside(lineup: LineupPlayer[], projections: PlayerProjection[]): number {
    return lineup.reduce((sum, p) => {
      const proj = projections.find(pr => pr.playerId === p.playerId);
      return sum + (proj?.ceiling || p.projectedPoints);
    }, 0);
  }

  private calculateLineupOwnership(lineup: LineupPlayer[]): number {
    return lineup.reduce((sum, p) => sum + p.ownership, 0) / lineup.length;
  }

  private findDifferentiators(lineup: LineupPlayer[]): string[] {
    return lineup
      .filter(p => p.ownership < 15)
      .map(p => `${p.name} (${p.ownership.toFixed(1)}% owned)`);
  }

  private findLineupCorrelations(lineup: LineupPlayer[]): LineupCorrelation[] {
    const correlations: LineupCorrelation[] = [];

    // Find QB-WR/TE stacks
    const qb = lineup.find(p => p.position === "QB");
    if (qb) {
      const teammates = lineup.filter(p => 
        p.team === qb.team && (p.position === "WR" || p.position === "TE")
      );
      
      if (teammates.length > 0) {
        correlations.push({
          type: "positive",
          players: [qb.name, ...teammates.map(t => t.name)],
          strength: 0.8,
          description: `${qb.team} passing game stack`
        });
      }
    }

    // Find game stacks
    const games = new Set(lineup.map(p => [p.team, p.opponent].sort().join("-")));
    games.forEach(game => {
      const gamePlayers = lineup.filter(p => 
        [p.team, p.opponent].sort().join("-") === game
      );
      
      if (gamePlayers.length >= 3) {
        correlations.push({
          type: "positive",
          players: gamePlayers.map(p => p.name),
          strength: 0.7,
          description: `${game} game stack`
        });
      }
    });

    return correlations;
  }

  private generateLineupSpecificInsights(
    lineup: LineupPlayer[],
    projections: PlayerProjection[]
  ): string[] {
    const insights: string[] = [];

    // Salary efficiency
    const totalSalary = lineup.reduce((sum, p) => sum + p.salary, 0);
    const salaryCap = 50000; // DraftKings style
    const remaining = salaryCap - totalSalary;
    
    if (remaining > 2000) {
      insights.push(`💰 $${remaining} under salary cap - consider upgrades`);
    } else if (remaining < 100) {
      insights.push(`✅ Optimal salary usage - only $${remaining} remaining`);
    }

    // Ownership balance
    const avgOwnership = this.calculateLineupOwnership(lineup);
    if (avgOwnership < 15) {
      insights.push("🎯 Very contrarian lineup - high risk, high reward");
    } else if (avgOwnership > 25) {
      insights.push("⚠️ Chalky lineup - consider some differentiation");
    }

    return insights;
  }

  private async findOptimalReplacement(
    player: LineupPlayer,
    currentLineup: LineupPlayer[],
    newsEvent: any
  ): Promise<LineupPlayer | null> {
    // This would find the best replacement based on salary, position, and projections
    // Simplified for demonstration
    return {
      ...player,
      playerId: `replacement_${player.playerId}`,
      name: `Backup ${player.position}`,
      projectedPoints: player.projectedPoints * 0.8
    };
  }

  private calculateLineupImpact(
    original: LineupPlayer[],
    adjusted: LineupPlayer[]
  ): number {
    const originalTotal = original.reduce((sum, p) => sum + p.projectedPoints, 0);
    const adjustedTotal = adjusted.reduce((sum, p) => sum + p.projectedPoints, 0);
    return adjustedTotal - originalTotal;
  }

  /**
   * Generate AI narrative insights for a lineup
   */
  private async generateLineupNarratives(
    lineup: OptimizedLineup,
    week: number
  ): Promise<{
    insights: NarrativeInsight[];
    gameScript: string;
    adjustments: string[];
    gameScripts: Record<string, string>;
  }> {
    try {
      // Prepare lineup data for AI analysis
      const lineupForAI = lineup.lineup.map(player => ({
        name: player.name,
        position: player.position,
        team: player.team,
        opponent: player.opponent,
        projectedPoints: player.projectedPoints
      }));

      // Get AI-generated narrative
      const aiNarrative = await aiService.generateLineupNarrative(
        lineupForAI,
        week,
        "Regular season fantasy lineup"
      );

      // Convert AI narrative to our format
      const insights: NarrativeInsight[] = aiNarrative.keyPlayers.map(player => ({
        insight: player.narrative,
        confidence: aiNarrative.confidenceLevel,
        narrativeScore: player.impact === "positive" ? 1.0 : player.impact === "negative" ? -1.0 : 0.5,
        aiSource: "openai" as const,
        type: "narrative_factor" as const
      }));

      // Add risk assessment as insight
      insights.push({
        insight: aiNarrative.riskAssessment,
        confidence: aiNarrative.confidenceLevel,
        narrativeScore: 0.8,
        aiSource: "openai" as const,
        type: "risk_assessment" as const
      });

      // Generate real-time adjustments using the AI context
      const adjustments = await this.generateAIAdjustments(lineup, aiNarrative);

      return {
        insights: insights.slice(0, 10),
        gameScript: aiNarrative.overallStory,
        adjustments,
        gameScripts: aiNarrative.gameScripts
      };

    } catch (error) {
      console.error("Error generating AI lineup narratives:", error);
      
      // Enhanced fallback using basic pattern matching
      const insights: NarrativeInsight[] = lineup.lineup.slice(0, 3).map(player => ({
        insight: `${player.name} is a key piece of your lineup with ${player.projectedPoints} projected points`,
        confidence: 0.6,
        narrativeScore: 0.7,
        aiSource: "local" as const,
        type: "narrative_factor" as const
      }));

      return {
        insights,
        gameScript: "Your lineup combines multiple strategic elements for a balanced approach this week.",
        adjustments: ["Monitor injury reports before lineups lock"],
        gameScripts: {}
      };
    }
  }

  /**
   * Get live data updates and breaking news
   */
  private async getLiveDataUpdates(players: any[]): Promise<string[]> {
    const updates: string[] = [];
    
    try {
      // Live data functionality disabled
      updates.push("📊 Mock: Live data updates would appear here");
    } catch (error) {
      console.error("Error getting live updates:", error);
    }
    
    return updates;
  }

  /**
   * Group players by their games
   */
  private groupPlayersByGame(players: LineupPlayer[]): Map<string, LineupPlayer[]> {
    const games = new Map<string, LineupPlayer[]>();
    
    for (const player of players) {
      // Create game ID from team matchup
      const gameId = `${player.team}_game_${Date.now()}`;
      
      if (!games.has(gameId)) {
        games.set(gameId, []);
      }
      games.get(gameId)!.push(player);
    }
    
    return games;
  }

  /**
   * Generate real-time lineup adjustments
   */
  private async generateRealTimeAdjustments(playerIds: string[]): Promise<string[]> {
    const adjustments: string[] = [];
    
    // Subscribe to breaking news for these players
    for (const playerId of playerIds.slice(0, 10)) {
      try {
        // Mock live data
        const liveData = null;
        if (liveData) {
          // Weather impacts
          const weatherData = await this.getWeatherForPlayer(playerId);
          if (weatherData?.impact) {
            adjustments.push(weatherData.impact);
          }
          
          // Late breaking news
          const newsImpact = await this.getLatestNewsImpact(playerId);
          if (newsImpact) {
            adjustments.push(newsImpact);
          }
        }
      } catch (error) {
        // Continue with other players
      }
    }
    
    return adjustments;
  }

  /**
   * Synthesize overall game script from individual games
   */
  private synthesizeOverallGameScript(
    gameScripts: Record<string, string>,
    insights: NarrativeInsight[]
  ): string {
    const scripts = Object.values(gameScripts);
    const topInsights = insights
      .sort((a, b) => (b.narrativeScore || 0) - (a.narrativeScore || 0))
      .slice(0, 3);

    if (scripts.length === 0) return "Multiple narrative factors in play for this lineup.";
    
    let combined = scripts[0];
    if (topInsights.length > 0) {
      combined += ` Key narrative: ${topInsights[0].insight}`;
    }
    
    return combined;
  }

  /**
   * Get weather impact for a specific player
   */
  private async getWeatherForPlayer(playerId: string): Promise<{ impact: string } | null> {
    // This would check weather conditions for the player's game
    // For now, return mock data
    const weatherConditions = ['clear', 'rain', 'wind', 'snow', 'dome'];
    const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    
    if (condition === 'wind') {
      return { impact: `🌪️ High winds expected - may impact passing game` };
    } else if (condition === 'rain') {
      return { impact: `🌧️ Rain in forecast - running game may get boost` };
    }
    
    return null;
  }

  /**
   * Get latest news impact for a player
   */
  private async getLatestNewsImpact(playerId: string): Promise<string | null> {
    // This would check latest news feeds
    // For now, return occasional mock news
    if (Math.random() > 0.9) {
      return `📰 Late-breaking: New information could impact player performance`;
    }
    
    return null;
  }

  /**
   * Subscribe to real-time lineup optimization updates
   */
  async subscribeToRealTimeOptimization(
    userId: string,
    leagueId: string,
    week: number,
    callback: (update: {
      type: 'player_update' | 'narrative_change' | 'optimization_alert';
      message: string;
      playerId?: string;
      recommendedAction?: string;
      urgency: 'low' | 'medium' | 'high';
    }) => void
  ): Promise<() => void> {
    // Subscribe to real-time data updates
    // Mock subscription
    const unsubscribe1 = () => {};

    // Subscribe to narrative updates
    // Mock narrative subscription
    const unsubscribe2 = () => {};

    // Return combined unsubscribe function
    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }

  // New AI helper methods

  /**
   * Calculate volatility from AI analysis
   */
  private calculateVolatilityFromAI(aiAnalysis: any): number {
    const riskFactors = aiAnalysis.riskFactors?.length || 0;
    const opportunities = aiAnalysis.opportunities?.length || 0;
    
    // More risk factors = higher volatility
    // More opportunities = moderate volatility increase
    return Math.min(0.4, (riskFactors * 0.08) + (opportunities * 0.04) + 0.1);
  }

  /**
   * Extract injury risk from AI analysis
   */
  private extractInjuryRisk(injuryRisk?: string): number {
    if (!injuryRisk) return 0.1;
    
    const risk = injuryRisk.toLowerCase();
    if (risk.includes("high") || risk.includes("concern")) return 0.3;
    if (risk.includes("moderate") || risk.includes("questionable")) return 0.2;
    if (risk.includes("low") || risk.includes("healthy")) return 0.05;
    
    return 0.1;
  }

  /**
   * Extract weather impact from AI analysis
   */
  private extractWeatherImpact(weatherImpact?: string): number {
    if (!weatherImpact) return 0;
    
    const weather = weatherImpact.toLowerCase();
    if (weather.includes("severe") || weather.includes("heavy")) return -2.0;
    if (weather.includes("wind") || weather.includes("rain")) return -1.0;
    if (weather.includes("dome") || weather.includes("favorable")) return 0.5;
    
    return 0;
  }

  /**
   * Parse matchup advantage from AI analysis
   */
  private parseMatchupAdvantage(matchupAnalysis: string): number {
    const analysis = matchupAnalysis.toLowerCase();
    
    if (analysis.includes("excellent") || analysis.includes("great")) return 2.0;
    if (analysis.includes("favorable") || analysis.includes("good")) return 1.0;
    if (analysis.includes("tough") || analysis.includes("difficult")) return -1.0;
    if (analysis.includes("very tough") || analysis.includes("terrible")) return -2.0;
    
    return 0;
  }

  /**
   * Calculate narrative bonus from AI insights
   */
  private calculateNarrativeBonusFromAI(narrativeInsights: string[]): number {
    let bonus = 0;
    
    narrativeInsights.forEach(insight => {
      const lower = insight.toLowerCase();
      
      // Positive narratives
      if (lower.includes("revenge") || lower.includes("former team")) bonus += 1.5;
      if (lower.includes("milestone") || lower.includes("record")) bonus += 1.0;
      if (lower.includes("breakout") || lower.includes("emerging")) bonus += 1.2;
      if (lower.includes("returning") || lower.includes("healthy")) bonus += 0.8;
      
      // Negative narratives
      if (lower.includes("struggling") || lower.includes("declining")) bonus -= 1.0;
      if (lower.includes("controversy") || lower.includes("distraction")) bonus -= 0.5;
    });
    
    return Math.max(-2, Math.min(3, bonus));
  }

  /**
   * Generate AI-powered real-time adjustments
   */
  private async generateAIAdjustments(
    lineup: OptimizedLineup, 
    narrative: any
  ): Promise<string[]> {
    const adjustments: string[] = [];
    
    try {
      // Extract concerns from AI narrative
      if (narrative.riskAssessment) {
        const risks = narrative.riskAssessment.toLowerCase();
        
        if (risks.includes("weather")) {
          adjustments.push("⛈️ Monitor weather conditions - may impact outdoor games");
        }
        if (risks.includes("injury")) {
          adjustments.push("🏥 Check latest injury reports before lineup lock");
        }
        if (risks.includes("news")) {
          adjustments.push("📰 Stay updated on breaking news affecting your players");
        }
      }

      // Add adjustments based on key players
      narrative.keyPlayers?.forEach((player: any) => {
        if (player.impact === "negative") {
          adjustments.push(`⚠️ Monitor ${player.name} - ${player.narrative}`);
        }
      });

      // Fallback adjustments
      if (adjustments.length === 0) {
        adjustments.push("📊 Lineup looks solid - monitor for any late breaking news");
      }

    } catch (error) {
      adjustments.push("📋 Check player status updates before games start");
    }
    
    return adjustments.slice(0, 5); // Limit to 5 adjustments
  }
}

export const aiLineupOptimizer = new AILineupOptimizer();