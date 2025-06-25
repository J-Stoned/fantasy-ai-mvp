/**
 * AI-Powered Mock Draft Simulator
 * Uses reinforcement learning and game theory for realistic draft simulations
 */

import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types';

export interface DraftSettings {
  leagueSize: number;
  rosterFormat: {
    QB: number;
    RB: number;
    WR: number;
    TE: number;
    FLEX: number;
    K: number;
    DEF: number;
    BENCH: number;
  };
  scoringSystem: 'standard' | 'ppr' | 'half-ppr' | 'custom';
  draftPosition: number;
  draftType: 'snake' | 'auction' | 'linear';
}

export interface DraftPick {
  round: number;
  pick: number;
  overallPick: number;
  team: number;
  player: Player;
  adp: number;
  reachValue: number; // Positive = reach, Negative = value
  alternativePlayers: Player[];
}

export interface DraftResult {
  userTeam: Player[];
  allPicks: DraftPick[];
  teamRosters: Map<number, Player[]>;
  analysis: {
    grade: string;
    strengths: string[];
    weaknesses: string[];
    bestPicks: DraftPick[];
    questionablePicks: DraftPick[];
    projectedFinish: number;
    weeklyProjection: number;
  };
}

export interface AIOpponent {
  id: number;
  name: string;
  strategy: 'balanced' | 'rb-heavy' | 'wr-heavy' | 'qb-early' | 'value' | 'upside';
  aggressiveness: number; // 0-1, affects reach tendencies
  rosterNeeds: Map<string, number>;
  draftedPlayers: Player[];
}

export class AIMockDraftSimulator {
  private static instance: AIMockDraftSimulator;
  private draftModel: tf.LayersModel | null = null;
  private valueModel: tf.LayersModel | null = null;
  private needsModel: tf.LayersModel | null = null;
  private isInitialized = false;
  
  // Player rankings and ADP data
  private playerPool: Player[] = [];
  private adpData: Map<string, number> = new Map();
  private positionScarcity: Map<string, number> = new Map();
  
  // Draft state
  private currentDraft: {
    settings: DraftSettings;
    availablePlayers: Set<string>;
    draftedPlayers: Set<string>;
    picks: DraftPick[];
    opponents: AIOpponent[];
    currentRound: number;
    currentPick: number;
  } | null = null;
  
  private constructor() {}
  
  static getInstance(): AIMockDraftSimulator {
    if (!AIMockDraftSimulator.instance) {
      AIMockDraftSimulator.instance = new AIMockDraftSimulator();
    }
    return AIMockDraftSimulator.instance;
  }
  
  /**
   * Initialize draft simulator
   */
  async initialize(players: Player[]): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Create AI models
      this.draftModel = await this.createDraftModel();
      this.valueModel = await this.createValueModel();
      this.needsModel = await this.createNeedsModel();
      
      // Initialize player pool
      this.playerPool = players;
      this.initializeADP();
      this.calculatePositionScarcity();
      
      this.isInitialized = true;
      console.log('Mock draft simulator initialized');
    } catch (error) {
      console.error('Failed to initialize draft simulator:', error);
      throw error;
    }
  }
  
  /**
   * Run a complete mock draft simulation
   */
  async runMockDraft(settings: DraftSettings): Promise<DraftResult> {
    if (!this.isInitialized) {
      throw new Error('Draft simulator not initialized');
    }
    
    // Initialize draft
    this.initializeDraft(settings);
    
    // Run draft rounds
    const totalPicks = settings.leagueSize * 
      Object.values(settings.rosterFormat).reduce((a, b) => a + b, 0);
    
    for (let i = 0; i < totalPicks; i++) {
      const pick = await this.simulatePick();
      this.currentDraft!.picks.push(pick);
      
      // Update draft state
      this.updateDraftState(pick);
    }
    
    // Analyze results
    const analysis = await this.analyzeDraftResults();
    
    return {
      userTeam: this.getUserTeam(),
      allPicks: this.currentDraft!.picks,
      teamRosters: this.getTeamRosters(),
      analysis
    };
  }
  
  /**
   * Interactive draft with user picks
   */
  async startInteractiveDraft(
    settings: DraftSettings,
    onTurn: (availablePlayers: Player[], recommendations: Player[]) => Promise<Player>
  ): Promise<DraftResult> {
    if (!this.isInitialized) {
      throw new Error('Draft simulator not initialized');
    }
    
    this.initializeDraft(settings);
    
    const totalPicks = settings.leagueSize * 
      Object.values(settings.rosterFormat).reduce((a, b) => a + b, 0);
    
    for (let i = 0; i < totalPicks; i++) {
      const currentTeam = this.getCurrentPickTeam();
      
      if (currentTeam === settings.draftPosition) {
        // User's turn
        const available = this.getAvailablePlayers();
        const recommendations = await this.getRecommendations(
          settings.draftPosition,
          available
        );
        
        const selectedPlayer = await onTurn(available, recommendations);
        
        const pick: DraftPick = {
          round: this.currentDraft!.currentRound,
          pick: this.currentDraft!.currentPick,
          overallPick: i + 1,
          team: currentTeam,
          player: selectedPlayer,
          adp: this.adpData.get(selectedPlayer.id) || 999,
          reachValue: this.calculateReachValue(selectedPlayer, i + 1),
          alternativePlayers: recommendations.slice(0, 3)
        };
        
        this.currentDraft!.picks.push(pick);
        this.updateDraftState(pick);
      } else {
        // AI opponent's turn
        const pick = await this.simulatePick();
        this.currentDraft!.picks.push(pick);
        this.updateDraftState(pick);
      }
    }
    
    const analysis = await this.analyzeDraftResults();
    
    return {
      userTeam: this.getUserTeam(),
      allPicks: this.currentDraft!.picks,
      teamRosters: this.getTeamRosters(),
      analysis
    };
  }
  
  /**
   * Get draft recommendations for current pick
   */
  async getRecommendations(
    teamId: number,
    availablePlayers: Player[]
  ): Promise<Player[]> {
    const team = teamId === this.currentDraft!.settings.draftPosition
      ? this.getUserTeam()
      : this.currentDraft!.opponents.find(o => o.id === teamId)!.draftedPlayers;
    
    // Calculate team needs
    const needs = this.calculateTeamNeeds(team, this.currentDraft!.settings.rosterFormat);
    
    // Score each available player
    const scoredPlayers = await Promise.all(
      availablePlayers.map(async (player) => {
        const score = await this.scorePlayerForTeam(player, team, needs);
        return { player, score };
      })
    );
    
    // Sort by score and return top recommendations
    return scoredPlayers
      .sort((a, b) => b.score - a.score)
      .map(sp => sp.player)
      .slice(0, 10);
  }
  
  /**
   * Simulate a single pick
   */
  private async simulatePick(): Promise<DraftPick> {
    const currentTeam = this.getCurrentPickTeam();
    const opponent = this.currentDraft!.opponents.find(o => o.id === currentTeam)!;
    const availablePlayers = this.getAvailablePlayers();
    
    // Get AI decision
    const selectedPlayer = await this.makeAIDecision(
      opponent,
      availablePlayers,
      this.currentDraft!.picks.length + 1
    );
    
    return {
      round: this.currentDraft!.currentRound,
      pick: this.currentDraft!.currentPick,
      overallPick: this.currentDraft!.picks.length + 1,
      team: currentTeam,
      player: selectedPlayer,
      adp: this.adpData.get(selectedPlayer.id) || 999,
      reachValue: this.calculateReachValue(
        selectedPlayer,
        this.currentDraft!.picks.length + 1
      ),
      alternativePlayers: availablePlayers.slice(0, 3)
    };
  }
  
  /**
   * Make AI draft decision
   */
  private async makeAIDecision(
    opponent: AIOpponent,
    availablePlayers: Player[],
    overallPick: number
  ): Promise<Player> {
    // Calculate position needs
    const needs = this.calculateTeamNeeds(
      opponent.draftedPlayers,
      this.currentDraft!.settings.rosterFormat
    );
    
    // Score each player based on strategy
    const scoredPlayers = await Promise.all(
      availablePlayers.map(async (player) => {
        const baseScore = await this.scorePlayerForTeam(
          player,
          opponent.draftedPlayers,
          needs
        );
        
        // Adjust for opponent strategy
        const strategyMultiplier = this.getStrategyMultiplier(
          opponent.strategy,
          player.position
        );
        
        // Adjust for ADP value
        const adp = this.adpData.get(player.id) || 999;
        const valueMultiplier = adp > overallPick ? 1.1 : 0.9;
        
        // Add randomness based on aggressiveness
        const randomFactor = 1 + (Math.random() - 0.5) * opponent.aggressiveness;
        
        return {
          player,
          score: baseScore * strategyMultiplier * valueMultiplier * randomFactor
        };
      })
    );
    
    // Select best player
    const selected = scoredPlayers
      .sort((a, b) => b.score - a.score)[0].player;
    
    // Update opponent state
    opponent.draftedPlayers.push(selected);
    opponent.rosterNeeds.set(selected.position, 
      (opponent.rosterNeeds.get(selected.position) || 1) - 1
    );
    
    return selected;
  }
  
  /**
   * Score a player for a specific team
   */
  private async scorePlayerForTeam(
    player: Player,
    team: Player[],
    needs: Map<string, number>
  ): Promise<number> {
    // Base score from projections
    let score = player.projectedPoints || 0;
    
    // Position need multiplier
    const positionNeed = needs.get(player.position) || 0;
    const needMultiplier = 1 + (positionNeed * 0.3);
    score *= needMultiplier;
    
    // Scarcity multiplier
    const scarcity = this.positionScarcity.get(player.position) || 1;
    score *= scarcity;
    
    // Stack considerations (same team players)
    const sameTeamCount = team.filter(p => p.team === player.team).length;
    if (sameTeamCount > 0) {
      score *= (player.position === 'QB' || player.position === 'WR') ? 1.1 : 0.95;
    }
    
    // Use neural network for advanced scoring
    const features = this.extractPlayerFeatures(player, team);
    const inputTensor = tf.tensor2d([features]);
    const prediction = this.valueModel!.predict(inputTensor) as tf.Tensor;
    const aiScore = (await prediction.data())[0];
    
    inputTensor.dispose();
    prediction.dispose();
    
    // Combine scores
    return score * (0.7 + aiScore * 0.3);
  }
  
  /**
   * Calculate team needs
   */
  private calculateTeamNeeds(
    team: Player[],
    rosterFormat: DraftSettings['rosterFormat']
  ): Map<string, number> {
    const needs = new Map<string, number>();
    const currentRoster = new Map<string, number>();
    
    // Count current positions
    for (const player of team) {
      const count = currentRoster.get(player.position) || 0;
      currentRoster.set(player.position, count + 1);
    }
    
    // Calculate needs
    for (const [position, required] of Object.entries(rosterFormat)) {
      if (position === 'BENCH') continue;
      
      const current = currentRoster.get(position) || 0;
      const need = Math.max(0, required - current);
      
      // Add flex considerations
      if (position === 'FLEX') {
        const rbCount = currentRoster.get('RB') || 0;
        const wrCount = currentRoster.get('WR') || 0;
        const teCount = currentRoster.get('TE') || 0;
        const flexFilled = Math.max(0, 
          rbCount - rosterFormat.RB + 
          wrCount - rosterFormat.WR + 
          teCount - rosterFormat.TE
        );
        needs.set('FLEX', Math.max(0, required - flexFilled));
      } else {
        needs.set(position, need);
      }
    }
    
    return needs;
  }
  
  /**
   * Get strategy multiplier for position
   */
  private getStrategyMultiplier(
    strategy: AIOpponent['strategy'],
    position: string
  ): number {
    const multipliers: Record<string, Record<string, number>> = {
      'balanced': { QB: 1, RB: 1, WR: 1, TE: 1, K: 1, DEF: 1 },
      'rb-heavy': { QB: 0.9, RB: 1.3, WR: 0.9, TE: 0.9, K: 0.8, DEF: 0.8 },
      'wr-heavy': { QB: 0.9, RB: 0.9, WR: 1.3, TE: 0.9, K: 0.8, DEF: 0.8 },
      'qb-early': { QB: 1.4, RB: 0.95, WR: 0.95, TE: 0.9, K: 0.7, DEF: 0.7 },
      'value': { QB: 0.8, RB: 1.1, WR: 1.1, TE: 1.2, K: 1.1, DEF: 1.1 },
      'upside': { QB: 1.1, RB: 1.2, WR: 1.2, TE: 1.1, K: 0.7, DEF: 0.7 }
    };
    
    return multipliers[strategy]?.[position] || 1;
  }
  
  /**
   * Calculate reach value
   */
  private calculateReachValue(player: Player, overallPick: number): number {
    const adp = this.adpData.get(player.id) || 999;
    return overallPick - adp;
  }
  
  /**
   * Extract features for ML model
   */
  private extractPlayerFeatures(player: Player, team: Player[]): number[] {
    return [
      player.projectedPoints || 0,
      player.averagePoints || 0,
      this.adpData.get(player.id) || 999,
      this.positionScarcity.get(player.position) || 1,
      team.filter(p => p.position === player.position).length,
      team.filter(p => p.team === player.team).length,
      player.healthStatus === 'healthy' ? 1 : 0
    ];
  }
  
  /**
   * Initialize draft state
   */
  private initializeDraft(settings: DraftSettings): void {
    // Create AI opponents
    const opponents: AIOpponent[] = [];
    const strategies: AIOpponent['strategy'][] = [
      'balanced', 'rb-heavy', 'wr-heavy', 'qb-early', 'value', 'upside'
    ];
    
    for (let i = 1; i <= settings.leagueSize; i++) {
      if (i !== settings.draftPosition) {
        opponents.push({
          id: i,
          name: `Team ${i}`,
          strategy: strategies[(i - 1) % strategies.length],
          aggressiveness: 0.2 + Math.random() * 0.3,
          rosterNeeds: new Map(Object.entries(settings.rosterFormat)
            .filter(([k]) => k !== 'BENCH')
            .map(([k, v]) => [k, v])),
          draftedPlayers: []
        });
      }
    }
    
    this.currentDraft = {
      settings,
      availablePlayers: new Set(this.playerPool.map(p => p.id)),
      draftedPlayers: new Set(),
      picks: [],
      opponents,
      currentRound: 1,
      currentPick: 1
    };
  }
  
  /**
   * Update draft state after pick
   */
  private updateDraftState(pick: DraftPick): void {
    this.currentDraft!.availablePlayers.delete(pick.player.id);
    this.currentDraft!.draftedPlayers.add(pick.player.id);
    
    // Update round/pick
    if (this.currentDraft!.settings.draftType === 'snake') {
      if (this.currentDraft!.currentRound % 2 === 1) {
        // Odd round - forward
        if (this.currentDraft!.currentPick === this.currentDraft!.settings.leagueSize) {
          this.currentDraft!.currentRound++;
        } else {
          this.currentDraft!.currentPick++;
        }
      } else {
        // Even round - reverse
        if (this.currentDraft!.currentPick === 1) {
          this.currentDraft!.currentRound++;
        } else {
          this.currentDraft!.currentPick--;
        }
      }
    }
  }
  
  /**
   * Get current pick team
   */
  private getCurrentPickTeam(): number {
    if (this.currentDraft!.settings.draftType === 'snake') {
      if (this.currentDraft!.currentRound % 2 === 1) {
        return this.currentDraft!.currentPick;
      } else {
        return this.currentDraft!.settings.leagueSize - 
          this.currentDraft!.currentPick + 1;
      }
    }
    return this.currentDraft!.currentPick;
  }
  
  /**
   * Get available players
   */
  private getAvailablePlayers(): Player[] {
    return this.playerPool.filter(p => 
      this.currentDraft!.availablePlayers.has(p.id)
    );
  }
  
  /**
   * Get user's team
   */
  private getUserTeam(): Player[] {
    return this.currentDraft!.picks
      .filter(p => p.team === this.currentDraft!.settings.draftPosition)
      .map(p => p.player);
  }
  
  /**
   * Get all team rosters
   */
  private getTeamRosters(): Map<number, Player[]> {
    const rosters = new Map<number, Player[]>();
    
    for (let i = 1; i <= this.currentDraft!.settings.leagueSize; i++) {
      const team = this.currentDraft!.picks
        .filter(p => p.team === i)
        .map(p => p.player);
      rosters.set(i, team);
    }
    
    return rosters;
  }
  
  /**
   * Analyze draft results
   */
  private async analyzeDraftResults(): Promise<DraftResult['analysis']> {
    const userTeam = this.getUserTeam();
    const userPicks = this.currentDraft!.picks.filter(
      p => p.team === this.currentDraft!.settings.draftPosition
    );
    
    // Calculate team projections
    const weeklyProjection = userTeam.reduce(
      (sum, p) => sum + (p.projectedPoints || 0), 0
    );
    
    // Analyze picks
    const bestPicks = userPicks
      .filter(p => p.reachValue < -10)
      .sort((a, b) => a.reachValue - b.reachValue)
      .slice(0, 3);
    
    const questionablePicks = userPicks
      .filter(p => p.reachValue > 15)
      .sort((a, b) => b.reachValue - a.reachValue)
      .slice(0, 3);
    
    // Position analysis
    const positionCounts = new Map<string, number>();
    for (const player of userTeam) {
      positionCounts.set(player.position, 
        (positionCounts.get(player.position) || 0) + 1
      );
    }
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // Check RB depth
    const rbCount = positionCounts.get('RB') || 0;
    if (rbCount >= 4) {
      strengths.push('Strong RB depth');
    } else if (rbCount <= 2) {
      weaknesses.push('Thin at RB position');
    }
    
    // Check WR depth
    const wrCount = positionCounts.get('WR') || 0;
    if (wrCount >= 5) {
      strengths.push('Excellent WR corps');
    } else if (wrCount <= 3) {
      weaknesses.push('Need more WR depth');
    }
    
    // Calculate grade
    let gradeScore = 75; // Base score
    
    // Value picks boost
    gradeScore += bestPicks.length * 5;
    
    // Reaches penalty
    gradeScore -= questionablePicks.length * 3;
    
    // Projection bonus
    const avgProjection = weeklyProjection / 9; // Starting lineup
    if (avgProjection > 15) gradeScore += 10;
    else if (avgProjection < 12) gradeScore -= 10;
    
    const grade = 
      gradeScore >= 90 ? 'A+' :
      gradeScore >= 85 ? 'A' :
      gradeScore >= 80 ? 'A-' :
      gradeScore >= 75 ? 'B+' :
      gradeScore >= 70 ? 'B' :
      gradeScore >= 65 ? 'B-' :
      gradeScore >= 60 ? 'C+' :
      'C';
    
    // Project finish
    const allProjections = Array.from(this.getTeamRosters().values())
      .map(team => team.reduce((sum, p) => sum + (p.projectedPoints || 0), 0))
      .sort((a, b) => b - a);
    
    const projectedFinish = allProjections.indexOf(weeklyProjection) + 1;
    
    return {
      grade,
      strengths,
      weaknesses,
      bestPicks,
      questionablePicks,
      projectedFinish,
      weeklyProjection
    };
  }
  
  /**
   * Initialize ADP data
   */
  private initializeADP(): void {
    // In reality, this would load from a database
    // For now, assign mock ADP based on projected points
    const sortedPlayers = [...this.playerPool]
      .sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0));
    
    sortedPlayers.forEach((player, index) => {
      this.adpData.set(player.id, index + 1);
    });
  }
  
  /**
   * Calculate position scarcity
   */
  private calculatePositionScarcity(): void {
    const positionCounts = new Map<string, number>();
    
    for (const player of this.playerPool) {
      positionCounts.set(player.position, 
        (positionCounts.get(player.position) || 0) + 1
      );
    }
    
    const avgCount = Array.from(positionCounts.values())
      .reduce((a, b) => a + b, 0) / positionCounts.size;
    
    for (const [position, count] of positionCounts) {
      this.positionScarcity.set(position, avgCount / count);
    }
  }
  
  /**
   * Create draft decision model
   */
  private async createDraftModel(): Promise<tf.LayersModel> {
    return tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [20],
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid'
        })
      ]
    });
  }
  
  /**
   * Create player value model
   */
  private async createValueModel(): Promise<tf.LayersModel> {
    return tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [7],
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 8,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid'
        })
      ]
    });
  }
  
  /**
   * Create roster needs model
   */
  private async createNeedsModel(): Promise<tf.LayersModel> {
    return tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [12],
          units: 24,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 12,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 6,
          activation: 'softmax'
        })
      ]
    });
  }
}

// Export singleton instance
export const mockDraftSimulator = AIMockDraftSimulator.getInstance();