import { EventEmitter } from "events";

/**
 * Knowledge Graph Service - MCP Enhanced
 * Creates intelligent relationship mapping for fantasy sports decision making
 */

export interface PlayerEntity {
  id: string;
  name: string;
  position: string;
  team: string;
  attributes: {
    experience: number;
    consistency: number;
    ceiling: number;
    floor: number;
    injuryProneness: number;
    weatherSensitivity: number;
    clutchFactor: number;
  };
  lastUpdated: Date;
}

export interface TeamEntity {
  id: string;
  name: string;
  city: string;
  conference: string;
  division: string;
  attributes: {
    offensiveRank: number;
    defensiveRank: number;
    homeFieldAdvantage: number;
    pace: number;
    redZoneEfficiency: number;
    turnoversForced: number;
    strengthOfSchedule: number;
  };
  lastUpdated: Date;
}

export interface MatchupEntity {
  id: string;
  homeTeam: string;
  awayTeam: string;
  week: number;
  season: number;
  gameTime: Date;
  attributes: {
    totalProjection: number;
    pace: number;
    competitiveness: number;
    weatherImpact: number;
    primetime: boolean;
    divisionGame: boolean;
    playoffImplications: boolean;
  };
  lastUpdated: Date;
}

export interface Relationship {
  id: string;
  sourceEntity: string;
  targetEntity: string;
  relationshipType: string;
  strength: number; // 0-1
  confidence: number; // 0-1
  attributes: Record<string, any>;
  createdAt: Date;
  lastUpdated: Date;
}

export interface PerformancePattern {
  id: string;
  playerId: string;
  patternType: "vs_team" | "vs_position" | "home_away" | "weather" | "rest" | "primetime" | "division";
  context: string;
  metrics: {
    games: number;
    avgPoints: number;
    consistency: number;
    ceiling: number;
    floor: number;
    trend: "improving" | "declining" | "stable";
  };
  confidence: number;
  lastUpdated: Date;
}

export interface InsightQuery {
  playerId?: string;
  teamId?: string;
  matchupId?: string;
  week?: number;
  opponent?: string;
  position?: string;
  relationshipTypes?: string[];
  minConfidence?: number;
  limit?: number;
}

export interface GraphInsight {
  type: "player_advantage" | "matchup_exploit" | "stack_opportunity" | "avoid_situation" | "sleeper_pick";
  confidence: number;
  reasoning: string[];
  supportingData: {
    relationships: Relationship[];
    patterns: PerformancePattern[];
    entities: (PlayerEntity | TeamEntity | MatchupEntity)[];
  };
  actionableAdvice: string;
  estimatedImpact: number;
}

export class KnowledgeGraphService extends EventEmitter {
  private playerEntities: Map<string, PlayerEntity> = new Map();
  private teamEntities: Map<string, TeamEntity> = new Map();
  private matchupEntities: Map<string, MatchupEntity> = new Map();
  private relationships: Map<string, Relationship> = new Map();
  private performancePatterns: Map<string, PerformancePattern> = new Map();
  
  // MCP Knowledge Graph service (would connect to actual MCP server)
  private mcpKnowledgeGraph: any;

  constructor() {
    super();
    
    // Skip initialization during build time
    if (process.env.SKIP_MCP_INIT !== 'true' && !process.env.VERCEL_ENV) {
      this.initializeMCPConnection();
      this.seedInitialData();
    } else {
      console.log("⏳ Deferring Knowledge Graph initialization to runtime...");
      // Set up minimal mock connection for build time
      this.mcpKnowledgeGraph = {
        storeEntity: async () => ({ success: true }),
        storeRelationship: async () => ({ success: true }),
        queryGraph: async () => [],
        findPatterns: async () => []
      };
    }
  }

  /**
   * Initialize MCP Knowledge Graph connection
   */
  private initializeMCPConnection() {
    // In production, this would connect to the Knowledge Graph MCP server
    this.mcpKnowledgeGraph = {
      storeEntity: async (entity: any) => {
        console.log("🧠 Knowledge Graph MCP: Storing entity", entity.id);
        return { success: true, entityId: entity.id };
      },
      storeRelationship: async (relationship: Relationship) => {
        console.log("🔗 Knowledge Graph MCP: Storing relationship", relationship.relationshipType);
        return { success: true, relationshipId: relationship.id };
      },
      queryGraph: async (query: any) => {
        console.log("🔍 Knowledge Graph MCP: Querying", query);
        return this.simulateGraphQuery(query);
      },
      findPatterns: async (criteria: any) => {
        console.log("📊 Knowledge Graph MCP: Finding patterns", criteria);
        return this.simulatePatternDetection(criteria);
      }
    };
  }

  /**
   * Seed initial player and team data
   */
  private seedInitialData() {
    // Add sample players
    this.addPlayer({
      id: "cmc",
      name: "Christian McCaffrey",
      position: "RB",
      team: "SF",
      attributes: {
        experience: 7,
        consistency: 0.85,
        ceiling: 0.95,
        floor: 0.75,
        injuryProneness: 0.6,
        weatherSensitivity: 0.2,
        clutchFactor: 0.9
      },
      lastUpdated: new Date()
    });

    this.addPlayer({
      id: "ja",
      name: "Josh Allen",
      position: "QB",
      team: "BUF",
      attributes: {
        experience: 6,
        consistency: 0.8,
        ceiling: 0.98,
        floor: 0.7,
        injuryProneness: 0.3,
        weatherSensitivity: 0.4,
        clutchFactor: 0.95
      },
      lastUpdated: new Date()
    });

    // Add sample teams
    this.addTeam({
      id: "SF",
      name: "49ers",
      city: "San Francisco",
      conference: "NFC",
      division: "West",
      attributes: {
        offensiveRank: 5,
        defensiveRank: 8,
        homeFieldAdvantage: 0.7,
        pace: 0.6,
        redZoneEfficiency: 0.75,
        turnoversForced: 0.65,
        strengthOfSchedule: 0.55
      },
      lastUpdated: new Date()
    });

    // Create some initial relationships
    this.createRelationship({
      id: "cmc_sf_synergy",
      sourceEntity: "cmc",
      targetEntity: "SF",
      relationshipType: "player_team_synergy",
      strength: 0.9,
      confidence: 0.95,
      attributes: {
        offensive_scheme_fit: 0.95,
        coaching_compatibility: 0.9,
        usage_rate: 0.85
      },
      createdAt: new Date(),
      lastUpdated: new Date()
    });
  }

  /**
   * Add or update a player entity
   */
  async addPlayer(player: PlayerEntity): Promise<void> {
    this.playerEntities.set(player.id, player);
    await this.mcpKnowledgeGraph.storeEntity({
      type: "player",
      ...player
    });
    
    this.emit("playerAdded", player);
  }

  /**
   * Add or update a team entity
   */
  async addTeam(team: TeamEntity): Promise<void> {
    this.teamEntities.set(team.id, team);
    await this.mcpKnowledgeGraph.storeEntity({
      type: "team",
      ...team
    });
    
    this.emit("teamAdded", team);
  }

  /**
   * Add or update a matchup entity
   */
  async addMatchup(matchup: MatchupEntity): Promise<void> {
    this.matchupEntities.set(matchup.id, matchup);
    await this.mcpKnowledgeGraph.storeEntity({
      type: "matchup",
      ...matchup
    });
    
    this.emit("matchupAdded", matchup);
  }

  /**
   * Create a relationship between entities
   */
  async createRelationship(relationship: Relationship): Promise<void> {
    this.relationships.set(relationship.id, relationship);
    await this.mcpKnowledgeGraph.storeRelationship(relationship);
    
    this.emit("relationshipCreated", relationship);
  }

  /**
   * Add performance pattern
   */
  async addPerformancePattern(pattern: PerformancePattern): Promise<void> {
    this.performancePatterns.set(pattern.id, pattern);
    
    // Store in MCP Knowledge Graph
    await this.mcpKnowledgeGraph.storeEntity({
      type: "performance_pattern",
      ...pattern
    });
    
    this.emit("patternAdded", pattern);
  }

  /**
   * Get intelligent insights for a player/matchup
   */
  async getInsights(query: InsightQuery): Promise<GraphInsight[]> {
    console.log("🔍 Generating insights for:", query);
    
    const insights: GraphInsight[] = [];
    
    // Query the knowledge graph for relevant data
    const graphData = await this.mcpKnowledgeGraph.queryGraph(query);
    
    // Generate different types of insights
    if (query.playerId) {
      const playerInsights = await this.generatePlayerInsights(query.playerId, graphData);
      insights.push(...playerInsights);
    }
    
    if (query.opponent) {
      const matchupInsights = await this.generateMatchupInsights(query, graphData);
      insights.push(...matchupInsights);
    }
    
    // Find stack opportunities
    const stackInsights = await this.findStackOpportunities(query, graphData);
    insights.push(...stackInsights);
    
    // Sort by confidence and impact
    return insights
      .filter(insight => insight.confidence >= (query.minConfidence || 0.6))
      .sort((a, b) => (b.confidence * b.estimatedImpact) - (a.confidence * a.estimatedImpact))
      .slice(0, query.limit || 10);
  }

  /**
   * Generate player-specific insights
   */
  private async generatePlayerInsights(playerId: string, graphData: any): Promise<GraphInsight[]> {
    const insights: GraphInsight[] = [];
    const player = this.playerEntities.get(playerId);
    
    if (!player) return insights;
    
    // Check for advantageous matchups
    const favorableMatchups = graphData.relationships?.filter((rel: Relationship) => 
      rel.sourceEntity === playerId && 
      rel.relationshipType === "favorable_matchup" && 
      rel.strength > 0.7
    ) || [];
    
    for (const matchup of favorableMatchups) {
      insights.push({
        type: "player_advantage",
        confidence: matchup.confidence,
        reasoning: [
          `${player.name} has historically performed well in this matchup type`,
          `Strength rating: ${(matchup.strength * 100).toFixed(0)}%`,
          `Based on ${matchup.attributes.sampleSize || 5}+ previous encounters`
        ],
        supportingData: {
          relationships: [matchup],
          patterns: this.getPlayerPatterns(playerId),
          entities: [player]
        },
        actionableAdvice: `Consider ${player.name} as a strong play this week`,
        estimatedImpact: matchup.strength * player.attributes.ceiling * 25 // Points boost
      });
    }
    
    // Check for injury risk patterns
    if (player.attributes.injuryProneness > 0.7) {
      insights.push({
        type: "avoid_situation",
        confidence: 0.8,
        reasoning: [
          `${player.name} has elevated injury risk`,
          `Historical injury proneness: ${(player.attributes.injuryProneness * 100).toFixed(0)}%`,
          "Consider handcuff or alternative options"
        ],
        supportingData: {
          relationships: [],
          patterns: [],
          entities: [player]
        },
        actionableAdvice: `Monitor ${player.name}'s status closely and have backup plan`,
        estimatedImpact: -5
      });
    }
    
    return insights;
  }

  /**
   * Generate matchup-specific insights
   */
  private async generateMatchupInsights(query: InsightQuery, graphData: any): Promise<GraphInsight[]> {
    const insights: GraphInsight[] = [];
    
    // Simulate matchup exploitation opportunities
    if (query.opponent && query.playerId) {
      const player = this.playerEntities.get(query.playerId);
      const opponentTeam = this.teamEntities.get(query.opponent);
      
      if (player && opponentTeam) {
        // Check if opponent is weak against this position
        const positionWeakness = this.calculatePositionWeakness(opponentTeam, player.position);
        
        if (positionWeakness > 0.7) {
          insights.push({
            type: "matchup_exploit",
            confidence: 0.85,
            reasoning: [
              `${opponentTeam.name} struggles against ${player.position} position`,
              `Defensive rank vs ${player.position}: ${positionWeakness * 32} (worst = 32)`,
              `${player.name} should see increased opportunities`
            ],
            supportingData: {
              relationships: [],
              patterns: [],
              entities: [player, opponentTeam]
            },
            actionableAdvice: `Target ${player.name} against ${opponentTeam.name}'s weak ${player.position} defense`,
            estimatedImpact: positionWeakness * 8
          });
        }
      }
    }
    
    return insights;
  }

  /**
   * Find stack opportunities (correlated players)
   */
  private async findStackOpportunities(query: InsightQuery, graphData: any): Promise<GraphInsight[]> {
    const insights: GraphInsight[] = [];
    
    // Find QB-WR stacks, RB-DEF stacks, etc.
    const stackRelationships = graphData.relationships?.filter((rel: Relationship) => 
      rel.relationshipType === "stack_synergy" && rel.strength > 0.6
    ) || [];
    
    for (const stack of stackRelationships) {
      const sourcePlayer = this.playerEntities.get(stack.sourceEntity);
      const targetPlayer = this.playerEntities.get(stack.targetEntity);
      
      if (sourcePlayer && targetPlayer) {
        insights.push({
          type: "stack_opportunity",
          confidence: stack.confidence,
          reasoning: [
            `${sourcePlayer.name} and ${targetPlayer.name} have positive correlation`,
            `Stack strength: ${(stack.strength * 100).toFixed(0)}%`,
            `Both players benefit when one performs well`
          ],
          supportingData: {
            relationships: [stack],
            patterns: [],
            entities: [sourcePlayer, targetPlayer]
          },
          actionableAdvice: `Consider stacking ${sourcePlayer.name} with ${targetPlayer.name}`,
          estimatedImpact: stack.strength * 6
        });
      }
    }
    
    return insights;
  }

  /**
   * Update entity attributes based on new data
   */
  async updatePlayerAttributes(playerId: string, newData: any): Promise<void> {
    const player = this.playerEntities.get(playerId);
    if (!player) return;
    
    // Update attributes based on performance data
    if (newData.fantasyPoints) {
      const consistency = this.calculateConsistency(newData.recentGames || []);
      player.attributes.consistency = (player.attributes.consistency * 0.9) + (consistency * 0.1);
    }
    
    if (newData.injury) {
      player.attributes.injuryProneness = Math.min(1, player.attributes.injuryProneness + 0.1);
    }
    
    player.lastUpdated = new Date();
    await this.addPlayer(player);
    
    this.emit("playerUpdated", player);
  }

  /**
   * Learn from new game results
   */
  async learnFromGameResult(gameData: any): Promise<void> {
    console.log("📚 Learning from game result:", gameData.gameId);
    
    // Update performance patterns
    for (const playerStat of gameData.playerStats || []) {
      await this.updatePerformancePatterns(playerStat);
    }
    
    // Update relationships based on performance correlations
    await this.updateRelationshipStrengths(gameData);
    
    this.emit("learningCompleted", { gameId: gameData.gameId });
  }

  /**
   * Helper methods
   */
  private calculatePositionWeakness(team: TeamEntity, position: string): number {
    // Simulate position-specific defensive weakness
    const positionRankings: Record<string, number> = {
      "QB": team.attributes.defensiveRank * 0.8,
      "RB": team.attributes.defensiveRank * 1.2,
      "WR": team.attributes.defensiveRank * 1.0,
      "TE": team.attributes.defensiveRank * 0.9
    };
    
    return Math.min(1, (positionRankings[position] || team.attributes.defensiveRank) / 32);
  }

  private calculateConsistency(recentGames: number[]): number {
    if (recentGames.length < 3) return 0.5;
    
    const mean = recentGames.reduce((sum, game) => sum + game, 0) / recentGames.length;
    const variance = recentGames.reduce((sum, game) => sum + Math.pow(game - mean, 2), 0) / recentGames.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, 1 - (stdDev / mean));
  }

  private getPlayerPatterns(playerId: string): PerformancePattern[] {
    return Array.from(this.performancePatterns.values())
      .filter(pattern => pattern.playerId === playerId);
  }

  private async updatePerformancePatterns(playerStat: any): Promise<void> {
    // Update or create performance patterns based on new data
    // This would analyze vs team, weather, rest days, etc.
  }

  private async updateRelationshipStrengths(gameData: any): Promise<void> {
    // Update relationship strengths based on observed correlations
  }

  private simulateGraphQuery(query: any): any {
    // Simulate MCP Knowledge Graph query response
    return {
      relationships: Array.from(this.relationships.values()),
      entities: [
        ...Array.from(this.playerEntities.values()),
        ...Array.from(this.teamEntities.values())
      ],
      patterns: Array.from(this.performancePatterns.values())
    };
  }

  private simulatePatternDetection(criteria: any): any {
    // Simulate pattern detection response
    return {
      patterns: Array.from(this.performancePatterns.values()),
      confidence: 0.8
    };
  }

  /**
   * Get knowledge graph statistics
   */
  getGraphStats() {
    return {
      players: this.playerEntities.size,
      teams: this.teamEntities.size,
      matchups: this.matchupEntities.size,
      relationships: this.relationships.size,
      patterns: this.performancePatterns.size,
      lastUpdated: new Date()
    };
  }
}

export const knowledgeGraphService = new KnowledgeGraphService();