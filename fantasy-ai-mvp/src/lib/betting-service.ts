"use client";

import { EventEmitter } from 'events';

export interface BettingOdds {
  id: string;
  playerId: string;
  playerName: string;
  team: string;
  position: string;
  gameId: string;
  prop: string;
  propType: 'PASSING_YARDS' | 'RUSHING_YARDS' | 'RECEIVING_YARDS' | 'TOUCHDOWNS' | 'RECEPTIONS' | 'FIELD_GOALS';
  line: number;
  overOdds: number;
  underOdds: number;
  sportsbook: string;
  lastUpdated: Date;
  confidence: number;
  isLive: boolean;
}

export interface BettingSlip {
  id: string;
  userId: string;
  selections: BettingSelection[];
  totalOdds: number;
  potentialPayout: number;
  stake: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'CANCELLED';
  placedAt: Date;
  settledAt?: Date;
}

export interface BettingSelection {
  id: string;
  playerId: string;
  playerName: string;
  prop: string;
  selection: 'OVER' | 'UNDER';
  line: number;
  odds: number;
  stake: number;
  potentialPayout: number;
}

export interface PlayerProp {
  id: string;
  playerId: string;
  playerName: string;
  team: string;
  position: string;
  gameId: string;
  opponent: string;
  propType: string;
  description: string;
  line: number;
  overOdds: number;
  underOdds: number;
  volume: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  lastGames: Array<{
    game: string;
    result: number;
    hit: boolean;
  }>;
  isLive: boolean;
  lastUpdated: Date;
}

export interface LiveOdds {
  playerId: string;
  propType: string;
  currentLine: number;
  currentOverOdds: number;
  currentUnderOdds: number;
  movement: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  volume: number;
  lastUpdate: Date;
}

export class BettingService extends EventEmitter {
  private oddsCache: Map<string, BettingOdds[]> = new Map();
  private liveOddsInterval?: NodeJS.Timeout;
  private bettingSlips: Map<string, BettingSlip> = new Map();
  private playerProps: Map<string, PlayerProp[]> = new Map();

  constructor() {
    super();
    this.initializeMockData();
    this.startLiveOddsUpdates();
  }

  private initializeMockData() {
    // Mock player props data
    const mockPlayerProps: PlayerProp[] = [
      {
        id: 'prop_1',
        playerId: 'player_1',
        playerName: 'Josh Allen',
        team: 'BUF',
        position: 'QB',
        gameId: 'game_1',
        opponent: 'MIA',
        propType: 'PASSING_YARDS',
        description: 'Josh Allen Passing Yards',
        line: 267.5,
        overOdds: -110,
        underOdds: -110,
        volume: 1250,
        trend: 'UP',
        lastGames: [
          { game: 'vs NYJ', result: 275, hit: true },
          { game: 'vs KC', result: 329, hit: true },
          { game: 'vs TB', result: 231, hit: false },
          { game: 'vs MIA', result: 304, hit: true },
          { game: 'vs WAS', result: 218, hit: false }
        ],
        isLive: true,
        lastUpdated: new Date()
      },
      {
        id: 'prop_2',
        playerId: 'player_2',
        playerName: 'Stefon Diggs',
        team: 'BUF',
        position: 'WR',
        gameId: 'game_1',
        opponent: 'MIA',
        propType: 'RECEIVING_YARDS',
        description: 'Stefon Diggs Receiving Yards',
        line: 74.5,
        overOdds: -115,
        underOdds: -105,
        volume: 890,
        trend: 'DOWN',
        lastGames: [
          { game: 'vs NYJ', result: 120, hit: true },
          { game: 'vs KC', result: 81, hit: true },
          { game: 'vs TB', result: 58, hit: false },
          { game: 'vs MIA', result: 95, hit: true },
          { game: 'vs WAS', result: 62, hit: false }
        ],
        isLive: true,
        lastUpdated: new Date()
      },
      {
        id: 'prop_3',
        playerId: 'player_3',
        playerName: 'Tua Tagovailoa',
        team: 'MIA',
        position: 'QB',
        gameId: 'game_1',
        opponent: 'BUF',
        propType: 'PASSING_TOUCHDOWNS',
        description: 'Tua Tagovailoa Passing Touchdowns',
        line: 1.5,
        overOdds: +105,
        underOdds: -125,
        volume: 650,
        trend: 'STABLE',
        lastGames: [
          { game: 'vs NYJ', result: 2, hit: true },
          { game: 'vs NE', result: 1, hit: false },
          { game: 'vs LV', result: 3, hit: true },
          { game: 'vs IND', result: 1, hit: false },
          { game: 'vs TEN', result: 2, hit: true }
        ],
        isLive: true,
        lastUpdated: new Date()
      },
      {
        id: 'prop_4',
        playerId: 'player_4',
        playerName: 'Tyreek Hill',
        team: 'MIA',
        position: 'WR',
        gameId: 'game_1',
        opponent: 'BUF',
        propType: 'RECEPTIONS',
        description: 'Tyreek Hill Receptions',
        line: 6.5,
        overOdds: -108,
        underOdds: -112,
        volume: 1450,
        trend: 'UP',
        lastGames: [
          { game: 'vs NYJ', result: 8, hit: true },
          { game: 'vs NE', result: 5, hit: false },
          { game: 'vs LV', result: 9, hit: true },
          { game: 'vs IND', result: 7, hit: true },
          { game: 'vs TEN', result: 4, hit: false }
        ],
        isLive: true,
        lastUpdated: new Date()
      },
      {
        id: 'prop_5',
        playerId: 'player_5',
        playerName: 'James Cook',
        team: 'BUF',
        position: 'RB',
        gameId: 'game_1',
        opponent: 'MIA',
        propType: 'RUSHING_YARDS',
        description: 'James Cook Rushing Yards',
        line: 65.5,
        overOdds: -105,
        underOdds: -115,
        volume: 720,
        trend: 'DOWN',
        lastGames: [
          { game: 'vs NYJ', result: 58, hit: false },
          { game: 'vs KC', result: 179, hit: true },
          { game: 'vs TB', result: 45, hit: false },
          { game: 'vs MIA', result: 78, hit: true },
          { game: 'vs WAS', result: 91, hit: true }
        ],
        isLive: true,
        lastUpdated: new Date()
      }
    ];

    this.playerProps.set('game_1', mockPlayerProps);
  }

  private startLiveOddsUpdates() {
    // Simulate live odds updates every 5 seconds
    this.liveOddsInterval = setInterval(() => {
      this.updateLiveOdds();
    }, 5000);
  }

  private updateLiveOdds() {
    for (const [gameId, props] of this.playerProps) {
      const updatedProps = props.map(prop => {
        // Simulate odds movement
        const movement = (Math.random() - 0.5) * 4; // -2 to +2 points
        const newLine = Math.max(0, prop.line + movement);
        
        // Simulate odds changes
        const oddsChange = Math.floor((Math.random() - 0.5) * 10); // -5 to +5
        
        return {
          ...prop,
          line: Number(newLine.toFixed(1)),
          overOdds: prop.overOdds + oddsChange,
          underOdds: prop.underOdds - oddsChange,
          lastUpdated: new Date(),
          trend: movement > 1 ? 'UP' as const : movement < -1 ? 'DOWN' as const : 'STABLE' as const
        };
      });
      
      this.playerProps.set(gameId, updatedProps);
    }

    this.emit('oddsUpdated', this.getAllPlayerProps());
  }

  async getPlayerProps(gameId?: string, playerId?: string): Promise<PlayerProp[]> {
    if (gameId) {
      return this.playerProps.get(gameId) || [];
    }
    
    if (playerId) {
      const allProps: PlayerProp[] = [];
      for (const props of this.playerProps.values()) {
        allProps.push(...props.filter(p => p.playerId === playerId));
      }
      return allProps;
    }
    
    return this.getAllPlayerProps();
  }

  private getAllPlayerProps(): PlayerProp[] {
    const allProps: PlayerProp[] = [];
    for (const props of this.playerProps.values()) {
      allProps.push(...props);
    }
    return allProps;
  }

  async getLiveOdds(propId: string): Promise<LiveOdds | null> {
    // Find the prop by ID
    for (const props of this.playerProps.values()) {
      const prop = props.find(p => p.id === propId);
      if (prop) {
        return {
          playerId: prop.playerId,
          propType: prop.propType,
          currentLine: prop.line,
          currentOverOdds: prop.overOdds,
          currentUnderOdds: prop.underOdds,
          movement: 0, // Would calculate based on historical data
          trend: prop.trend,
          volume: prop.volume,
          lastUpdate: prop.lastUpdated
        };
      }
    }
    return null;
  }

  async placeBet(selections: Omit<BettingSelection, 'id'>[], stake: number, userId: string): Promise<BettingSlip> {
    // Calculate total odds (for parlay, multiply; for single bet, use individual odds)
    const totalOdds = selections.length === 1 
      ? selections[0].odds 
      : selections.reduce((acc, sel) => acc * this.convertOddsToDecimal(sel.odds), 1);
    
    const potentialPayout = stake * this.convertOddsToDecimal(totalOdds);
    
    const bettingSlip: BettingSlip = {
      id: `slip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      selections: selections.map((sel, index) => ({
        ...sel,
        id: `selection_${Date.now()}_${index}`,
        potentialPayout: sel.stake * this.convertOddsToDecimal(sel.odds)
      })),
      totalOdds,
      potentialPayout,
      stake,
      status: 'PENDING',
      placedAt: new Date()
    };

    this.bettingSlips.set(bettingSlip.id, bettingSlip);
    this.emit('betPlaced', bettingSlip);
    
    return bettingSlip;
  }

  private convertOddsToDecimal(americanOdds: number): number {
    if (americanOdds > 0) {
      return (americanOdds / 100) + 1;
    } else {
      return (100 / Math.abs(americanOdds)) + 1;
    }
  }

  async getBettingHistory(userId: string): Promise<BettingSlip[]> {
    return Array.from(this.bettingSlips.values())
      .filter(slip => slip.userId === userId)
      .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime());
  }

  async getBettingSlip(slipId: string): Promise<BettingSlip | null> {
    return this.bettingSlips.get(slipId) || null;
  }

  // AI-powered betting insights
  async getBettingInsights(propId: string): Promise<{
    recommendation: 'OVER' | 'UNDER' | 'AVOID';
    confidence: number;
    reasoning: string;
    keyFactors: string[];
  }> {
    // Find the prop
    let targetProp: PlayerProp | null = null;
    for (const props of this.playerProps.values()) {
      const prop = props.find(p => p.id === propId);
      if (prop) {
        targetProp = prop;
        break;
      }
    }

    if (!targetProp) {
      return {
        recommendation: 'AVOID',
        confidence: 0,
        reasoning: 'Prop not found',
        keyFactors: []
      };
    }

    // Simple AI logic based on recent performance
    const recentHits = targetProp.lastGames.slice(0, 3).filter(g => g.hit).length;
    const averageResult = targetProp.lastGames.reduce((sum, game) => sum + game.result, 0) / targetProp.lastGames.length;
    
    let recommendation: 'OVER' | 'UNDER' | 'AVOID';
    let confidence: number;
    let reasoning: string;
    const keyFactors: string[] = [];

    if (averageResult > targetProp.line * 1.1) {
      recommendation = 'OVER';
      confidence = Math.min(85, 60 + (recentHits * 8));
      reasoning = `Player averaging ${averageResult.toFixed(1)} vs line of ${targetProp.line}`;
      keyFactors.push(`Strong recent average (${averageResult.toFixed(1)})`);
    } else if (averageResult < targetProp.line * 0.9) {
      recommendation = 'UNDER';
      confidence = Math.min(85, 60 + ((3 - recentHits) * 8));
      reasoning = `Player averaging ${averageResult.toFixed(1)} vs line of ${targetProp.line}`;
      keyFactors.push(`Below average recent performance (${averageResult.toFixed(1)})`);
    } else {
      recommendation = 'AVOID';
      confidence = 45;
      reasoning = 'Line appears fairly set, no clear edge';
      keyFactors.push('Balanced recent performance');
    }

    // Add trend factor
    if (targetProp.trend === 'UP') {
      keyFactors.push('Odds trending up (increased action on over)');
    } else if (targetProp.trend === 'DOWN') {
      keyFactors.push('Odds trending down (increased action on under)');
    }

    // Add volume factor
    if (targetProp.volume > 1000) {
      keyFactors.push('High betting volume indicates sharp interest');
    }

    return {
      recommendation,
      confidence,
      reasoning,
      keyFactors
    };
  }

  // Clean up intervals
  destroy() {
    if (this.liveOddsInterval) {
      clearInterval(this.liveOddsInterval);
    }
  }
}

export const bettingService = new BettingService();