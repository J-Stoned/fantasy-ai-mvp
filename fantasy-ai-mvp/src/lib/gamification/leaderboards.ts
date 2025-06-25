/**
 * Leaderboards and Rankings System
 * Global, league, and category-specific leaderboards with real-time updates
 */

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  level?: number;
  score: number;
  rank: number;
  previousRank?: number;
  trend: 'up' | 'down' | 'same' | 'new';
  metadata?: {
    wins?: number;
    losses?: number;
    winRate?: number;
    avgPoints?: number;
    highScore?: number;
    achievements?: number;
    title?: string;
  };
  lastUpdated: Date;
}

export interface Leaderboard {
  id: string;
  name: string;
  type: 'global' | 'league' | 'friends' | 'category';
  category?: 'overall' | 'weekly' | 'accuracy' | 'trading' | 'social' | 'achievements';
  timeframe: 'all-time' | 'season' | 'month' | 'week' | 'daily';
  entries: LeaderboardEntry[];
  lastUpdated: Date;
  metadata?: {
    totalParticipants: number;
    averageScore: number;
    topScore: number;
  };
}

export interface PowerRanking {
  userId: string;
  username: string;
  team: string;
  rank: number;
  previousRank: number;
  record: { wins: number; losses: number };
  pointsFor: number;
  pointsAgainst: number;
  streak: { type: 'W' | 'L'; count: number };
  schedule: {
    past: { difficulty: number; avgOpponentRank: number };
    future: { difficulty: number; avgOpponentRank: number };
  };
  aiProjection: {
    projectedWins: number;
    playoffOdds: number;
    championshipOdds: number;
  };
  momentum: number; // -100 to 100
}

export interface RankingHistory {
  userId: string;
  history: Array<{
    week: number;
    rank: number;
    score: number;
    event?: string;
  }>;
}

export interface LeaderboardFilter {
  timeframe?: Leaderboard['timeframe'];
  category?: Leaderboard['category'];
  leagueId?: string;
  friendsOnly?: boolean;
  topN?: number;
}

export interface RankingFormula {
  id: string;
  name: string;
  description: string;
  weights: {
    wins: number;
    totalPoints: number;
    consistency: number;
    streakBonus: number;
    scheduleStrength: number;
    recentForm: number;
  };
}

export class LeaderboardSystem {
  private static instance: LeaderboardSystem;
  private leaderboards: Map<string, Leaderboard> = new Map();
  private powerRankings: Map<string, PowerRanking[]> = new Map(); // leagueId -> rankings
  private rankingHistory: Map<string, RankingHistory> = new Map();
  private updateQueue: Set<string> = new Set();
  
  // Ranking formulas
  private readonly rankingFormulas: Map<string, RankingFormula> = new Map([
    ['standard', {
      id: 'standard',
      name: 'Standard Power Rankings',
      description: 'Balanced formula considering wins, points, and consistency',
      weights: {
        wins: 0.4,
        totalPoints: 0.25,
        consistency: 0.15,
        streakBonus: 0.1,
        scheduleStrength: 0.05,
        recentForm: 0.05
      }
    }],
    ['aggressive', {
      id: 'aggressive',
      name: 'Points-Heavy Rankings',
      description: 'Emphasizes scoring and recent performance',
      weights: {
        wins: 0.25,
        totalPoints: 0.35,
        consistency: 0.1,
        streakBonus: 0.15,
        scheduleStrength: 0.05,
        recentForm: 0.1
      }
    }],
    ['predictive', {
      id: 'predictive',
      name: 'AI Predictive Rankings',
      description: 'Forward-looking rankings based on AI projections',
      weights: {
        wins: 0.2,
        totalPoints: 0.2,
        consistency: 0.2,
        streakBonus: 0.1,
        scheduleStrength: 0.15,
        recentForm: 0.15
      }
    }]
  ]);
  
  // Achievement points for leaderboard
  private readonly achievementPoints = {
    common: 10,
    rare: 25,
    epic: 50,
    legendary: 100
  };
  
  private constructor() {
    this.initializeGlobalLeaderboards();
    this.startPeriodicUpdates();
  }
  
  static getInstance(): LeaderboardSystem {
    if (!LeaderboardSystem.instance) {
      LeaderboardSystem.instance = new LeaderboardSystem();
    }
    return LeaderboardSystem.instance;
  }
  
  /**
   * Get leaderboard
   */
  async getLeaderboard(
    type: Leaderboard['type'],
    filter: LeaderboardFilter = {}
  ): Promise<Leaderboard> {
    const leaderboardId = this.getLeaderboardId(type, filter);
    
    if (!this.leaderboards.has(leaderboardId)) {
      const leaderboard = await this.createLeaderboard(type, filter);
      this.leaderboards.set(leaderboardId, leaderboard);
    }
    
    const leaderboard = this.leaderboards.get(leaderboardId)!;
    
    // Apply filters
    let entries = [...leaderboard.entries];
    
    if (filter.friendsOnly) {
      // In real implementation, filter by user's friends
      entries = entries.slice(0, 10);
    }
    
    if (filter.topN) {
      entries = entries.slice(0, filter.topN);
    }
    
    return {
      ...leaderboard,
      entries
    };
  }
  
  /**
   * Update user score
   */
  async updateScore(
    userId: string,
    scoreUpdate: {
      type: 'game' | 'achievement' | 'challenge' | 'social';
      category?: Leaderboard['category'];
      points: number;
      metadata?: any;
    }
  ): Promise<void> {
    // Queue leaderboard updates
    const leaderboardsToUpdate = this.getAffectedLeaderboards(scoreUpdate);
    
    for (const leaderboardId of leaderboardsToUpdate) {
      this.updateQueue.add(leaderboardId);
    }
    
    // Process updates in batch
    if (this.updateQueue.size > 0) {
      await this.processUpdateQueue();
    }
  }
  
  /**
   * Get power rankings for league
   */
  async getPowerRankings(
    leagueId: string,
    formulaId: string = 'standard'
  ): Promise<PowerRanking[]> {
    if (!this.powerRankings.has(leagueId)) {
      await this.calculatePowerRankings(leagueId, formulaId);
    }
    
    return this.powerRankings.get(leagueId) || [];
  }
  
  /**
   * Get user's rank across different leaderboards
   */
  async getUserRanks(userId: string): Promise<Array<{
    leaderboardId: string;
    name: string;
    rank: number;
    percentile: number;
    score: number;
  }>> {
    const ranks = [];
    
    for (const [id, leaderboard] of this.leaderboards) {
      const entry = leaderboard.entries.find(e => e.userId === userId);
      if (entry) {
        const percentile = ((leaderboard.entries.length - entry.rank + 1) / 
          leaderboard.entries.length) * 100;
        
        ranks.push({
          leaderboardId: id,
          name: leaderboard.name,
          rank: entry.rank,
          percentile,
          score: entry.score
        });
      }
    }
    
    return ranks;
  }
  
  /**
   * Get ranking history
   */
  async getRankingHistory(
    userId: string,
    leaderboardType: Leaderboard['type'] = 'global'
  ): Promise<RankingHistory> {
    const historyKey = `${userId}_${leaderboardType}`;
    
    if (!this.rankingHistory.has(historyKey)) {
      // Generate mock history
      const history: RankingHistory = {
        userId,
        history: this.generateMockHistory()
      };
      this.rankingHistory.set(historyKey, history);
    }
    
    return this.rankingHistory.get(historyKey)!;
  }
  
  /**
   * Compare users head-to-head
   */
  async compareUsers(
    userId1: string,
    userId2: string
  ): Promise<{
    user1: { stats: any; advantages: string[] };
    user2: { stats: any; advantages: string[] };
    prediction: { favorite: string; confidence: number };
  }> {
    // Get user stats
    const user1Stats = await this.getUserStats(userId1);
    const user2Stats = await this.getUserStats(userId2);
    
    // Analyze advantages
    const user1Advantages = [];
    const user2Advantages = [];
    
    if (user1Stats.winRate > user2Stats.winRate) {
      user1Advantages.push(`Higher win rate (${(user1Stats.winRate * 100).toFixed(1)}%)`);
    } else {
      user2Advantages.push(`Higher win rate (${(user2Stats.winRate * 100).toFixed(1)}%)`);
    }
    
    if (user1Stats.avgPoints > user2Stats.avgPoints) {
      user1Advantages.push(`Higher average score (${user1Stats.avgPoints.toFixed(1)})`);
    } else {
      user2Advantages.push(`Higher average score (${user2Stats.avgPoints.toFixed(1)})`);
    }
    
    if (user1Stats.consistency > user2Stats.consistency) {
      user1Advantages.push('More consistent scorer');
    } else {
      user2Advantages.push('More consistent scorer');
    }
    
    // Make prediction
    const user1Score = this.calculateUserScore(user1Stats);
    const user2Score = this.calculateUserScore(user2Stats);
    const totalScore = user1Score + user2Score;
    
    const favorite = user1Score > user2Score ? userId1 : userId2;
    const confidence = Math.abs(user1Score - user2Score) / totalScore;
    
    return {
      user1: { stats: user1Stats, advantages: user1Advantages },
      user2: { stats: user2Stats, advantages: user2Advantages },
      prediction: { favorite, confidence }
    };
  }
  
  /**
   * Get achievement leaderboard
   */
  async getAchievementLeaderboard(
    timeframe: Leaderboard['timeframe'] = 'all-time'
  ): Promise<Leaderboard> {
    return this.getLeaderboard('global', { 
      category: 'achievements',
      timeframe 
    });
  }
  
  /**
   * Calculate percentile rank
   */
  getPercentileRank(rank: number, totalParticipants: number): string {
    const percentile = ((totalParticipants - rank + 1) / totalParticipants) * 100;
    
    if (percentile >= 99) return 'Top 1%';
    if (percentile >= 95) return 'Top 5%';
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Top 50%';
    return `Top ${Math.ceil(100 - percentile)}%`;
  }
  
  // Private methods
  
  private initializeGlobalLeaderboards(): void {
    // Create default global leaderboards
    const categories: Leaderboard['category'][] = [
      'overall', 'weekly', 'accuracy', 'trading', 'social', 'achievements'
    ];
    
    const timeframes: Leaderboard['timeframe'][] = [
      'all-time', 'season', 'month', 'week'
    ];
    
    for (const category of categories) {
      for (const timeframe of timeframes) {
        const leaderboard: Leaderboard = {
          id: `global_${category}_${timeframe}`,
          name: `${this.formatName(category)} - ${this.formatName(timeframe)}`,
          type: 'global',
          category,
          timeframe,
          entries: this.generateMockEntries(100),
          lastUpdated: new Date(),
          metadata: {
            totalParticipants: 10000,
            averageScore: 1000,
            topScore: 5000
          }
        };
        
        this.leaderboards.set(leaderboard.id, leaderboard);
      }
    }
  }
  
  private async createLeaderboard(
    type: Leaderboard['type'],
    filter: LeaderboardFilter
  ): Promise<Leaderboard> {
    const id = this.getLeaderboardId(type, filter);
    
    return {
      id,
      name: this.getLeaderboardName(type, filter),
      type,
      category: filter.category,
      timeframe: filter.timeframe || 'all-time',
      entries: this.generateMockEntries(50),
      lastUpdated: new Date()
    };
  }
  
  private getLeaderboardId(type: Leaderboard['type'], filter: LeaderboardFilter): string {
    const parts = [type];
    if (filter.leagueId) parts.push(filter.leagueId);
    if (filter.category) parts.push(filter.category);
    if (filter.timeframe) parts.push(filter.timeframe);
    return parts.join('_');
  }
  
  private getLeaderboardName(type: Leaderboard['type'], filter: LeaderboardFilter): string {
    const parts = [];
    if (type === 'league') parts.push('League');
    if (filter.category) parts.push(this.formatName(filter.category));
    if (filter.timeframe) parts.push(this.formatName(filter.timeframe));
    return parts.join(' - ');
  }
  
  private formatName(str: string): string {
    return str.split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  private getAffectedLeaderboards(scoreUpdate: any): string[] {
    const affected = [];
    
    // Global leaderboards
    affected.push('global_overall_all-time');
    affected.push('global_overall_season');
    affected.push('global_overall_week');
    
    // Category specific
    if (scoreUpdate.category) {
      affected.push(`global_${scoreUpdate.category}_all-time`);
      affected.push(`global_${scoreUpdate.category}_season`);
    }
    
    return affected;
  }
  
  private async processUpdateQueue(): Promise<void> {
    const updates = Array.from(this.updateQueue);
    this.updateQueue.clear();
    
    for (const leaderboardId of updates) {
      const leaderboard = this.leaderboards.get(leaderboardId);
      if (leaderboard) {
        // Re-sort and update ranks
        leaderboard.entries.sort((a, b) => b.score - a.score);
        
        leaderboard.entries.forEach((entry, index) => {
          const newRank = index + 1;
          if (entry.rank !== newRank) {
            entry.previousRank = entry.rank;
            entry.rank = newRank;
            entry.trend = newRank < entry.previousRank ? 'up' : 
                          newRank > entry.previousRank ? 'down' : 'same';
          }
          entry.lastUpdated = new Date();
        });
        
        leaderboard.lastUpdated = new Date();
      }
    }
  }
  
  private async calculatePowerRankings(
    leagueId: string,
    formulaId: string
  ): Promise<void> {
    const formula = this.rankingFormulas.get(formulaId) || this.rankingFormulas.get('standard')!;
    
    // In real implementation, get league teams and calculate
    const mockRankings: PowerRanking[] = [
      {
        userId: 'user1',
        username: 'AlphaGamer',
        team: 'Alpha Squad',
        rank: 1,
        previousRank: 2,
        record: { wins: 8, losses: 2 },
        pointsFor: 1234.5,
        pointsAgainst: 1100.2,
        streak: { type: 'W', count: 4 },
        schedule: {
          past: { difficulty: 0.65, avgOpponentRank: 4.2 },
          future: { difficulty: 0.45, avgOpponentRank: 6.8 }
        },
        aiProjection: {
          projectedWins: 12,
          playoffOdds: 0.92,
          championshipOdds: 0.28
        },
        momentum: 85
      },
      // Add more mock rankings...
    ];
    
    this.powerRankings.set(leagueId, mockRankings);
  }
  
  private async getUserStats(userId: string): Promise<any> {
    // Mock user stats
    return {
      userId,
      wins: Math.floor(Math.random() * 10),
      losses: Math.floor(Math.random() * 10),
      winRate: 0.5 + Math.random() * 0.3,
      avgPoints: 100 + Math.random() * 50,
      highScore: 150 + Math.random() * 50,
      consistency: Math.random(),
      recentForm: Math.random()
    };
  }
  
  private calculateUserScore(stats: any): number {
    return stats.winRate * 100 + 
           stats.avgPoints * 0.5 + 
           stats.consistency * 50 +
           stats.recentForm * 25;
  }
  
  private generateMockEntries(count: number): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];
    const usernames = ['FantasyKing', 'AIBeliever', 'TradeWizard', 'LineupGuru', 'ChampionMaker'];
    
    for (let i = 0; i < count; i++) {
      entries.push({
        userId: `user${i + 1}`,
        username: usernames[i % usernames.length] + (i + 1),
        level: Math.floor(Math.random() * 50) + 1,
        score: Math.floor(5000 - (i * 50) + Math.random() * 100),
        rank: i + 1,
        previousRank: i + 1 + Math.floor(Math.random() * 5 - 2),
        trend: 'same',
        metadata: {
          wins: Math.floor(Math.random() * 100),
          losses: Math.floor(Math.random() * 50),
          winRate: 0.5 + Math.random() * 0.4,
          avgPoints: 100 + Math.random() * 50,
          highScore: 150 + Math.random() * 100,
          achievements: Math.floor(Math.random() * 50)
        },
        lastUpdated: new Date()
      });
    }
    
    // Calculate trends
    entries.forEach(entry => {
      if (entry.previousRank && entry.previousRank !== entry.rank) {
        entry.trend = entry.rank < entry.previousRank ? 'up' : 'down';
      }
    });
    
    return entries;
  }
  
  private generateMockHistory(): RankingHistory['history'] {
    const history = [];
    let currentRank = 50;
    
    for (let week = 1; week <= 10; week++) {
      currentRank += Math.floor(Math.random() * 10 - 5);
      currentRank = Math.max(1, Math.min(100, currentRank));
      
      history.push({
        week,
        rank: currentRank,
        score: 1000 + Math.random() * 500,
        event: week === 5 ? 'Won Championship' : undefined
      });
    }
    
    return history;
  }
  
  private startPeriodicUpdates(): void {
    // Update leaderboards every 5 minutes
    setInterval(() => {
      this.updateAllLeaderboards();
    }, 5 * 60 * 1000);
  }
  
  private async updateAllLeaderboards(): Promise<void> {
    for (const [id, leaderboard] of this.leaderboards) {
      // Simulate score changes
      leaderboard.entries.forEach(entry => {
        entry.score += Math.floor(Math.random() * 10);
      });
      
      // Re-sort and update
      this.updateQueue.add(id);
    }
    
    await this.processUpdateQueue();
  }
}

// Export singleton instance
export const leaderboardSystem = LeaderboardSystem.getInstance();