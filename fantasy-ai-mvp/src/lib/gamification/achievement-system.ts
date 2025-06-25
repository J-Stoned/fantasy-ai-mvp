/**
 * Achievement System
 * Unlock achievements, earn XP, and level up in Fantasy.AI
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'performance' | 'social' | 'strategy' | 'collector' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  gemReward?: number;
  unlockedAt?: Date;
  progress?: {
    current: number;
    target: number;
  };
  requirements: AchievementRequirement[];
  secret?: boolean;
}

export interface AchievementRequirement {
  type: 'win_games' | 'score_points' | 'make_trades' | 'perfect_lineup' | 
        'prediction_accuracy' | 'social_action' | 'special_event' | 'milestone';
  value: number;
  timeframe?: 'week' | 'season' | 'all-time';
  metadata?: Record<string, any>;
}

export interface UserProgress {
  userId: string;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  achievements: string[]; // Achievement IDs
  stats: UserStats;
  streaks: {
    daily: number;
    weekly: number;
    winning: number;
  };
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  earnedAt: Date;
}

export interface UserStats {
  gamesWon: number;
  perfectLineups: number;
  tradesMade: number;
  predictionsCorrect: number;
  totalPoints: number;
  highestWeeklyScore: number;
  championshipsWon: number;
  draftGrade: string;
}

export interface LevelReward {
  level: number;
  rewards: {
    gems?: number;
    features?: string[];
    badges?: Badge[];
    title?: string;
  };
}

export class AchievementSystem {
  private static instance: AchievementSystem;
  private achievements: Map<string, Achievement> = new Map();
  private userProgress: Map<string, UserProgress> = new Map();
  
  // XP requirements per level (increases exponentially)
  private readonly levelFormula = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1));
  
  // All achievements
  private readonly achievementDefinitions: Achievement[] = [
    // Performance Achievements
    {
      id: 'first_win',
      name: 'First Victory',
      description: 'Win your first fantasy matchup',
      icon: '🏆',
      category: 'performance',
      rarity: 'common',
      xpReward: 100,
      requirements: [{ type: 'win_games', value: 1 }]
    },
    {
      id: 'win_streak_5',
      name: 'Hot Streak',
      description: 'Win 5 games in a row',
      icon: '🔥',
      category: 'performance',
      rarity: 'rare',
      xpReward: 500,
      requirements: [{ type: 'win_games', value: 5, metadata: { consecutive: true } }]
    },
    {
      id: 'perfect_week',
      name: 'Perfect Week',
      description: 'Score the highest in your league for a week',
      icon: '💯',
      category: 'performance',
      rarity: 'epic',
      xpReward: 750,
      gemReward: 10,
      requirements: [{ type: 'score_points', value: 1, metadata: { highest: true } }]
    },
    {
      id: 'championship',
      name: 'Champion',
      description: 'Win a fantasy championship',
      icon: '👑',
      category: 'performance',
      rarity: 'legendary',
      xpReward: 2000,
      gemReward: 50,
      requirements: [{ type: 'milestone', value: 1, metadata: { type: 'championship' } }]
    },
    
    // Strategy Achievements
    {
      id: 'trade_master',
      name: 'Trade Master',
      description: 'Complete 10 trades in a season',
      icon: '💼',
      category: 'strategy',
      rarity: 'rare',
      xpReward: 400,
      requirements: [{ type: 'make_trades', value: 10, timeframe: 'season' }]
    },
    {
      id: 'waiver_wire_wizard',
      name: 'Waiver Wire Wizard',
      description: 'Pick up a player who scores 20+ points that week',
      icon: '🎯',
      category: 'strategy',
      rarity: 'rare',
      xpReward: 300,
      requirements: [{ type: 'special_event', value: 1, metadata: { type: 'waiver_hero' } }]
    },
    {
      id: 'perfect_draft',
      name: 'Perfect Draft',
      description: 'Receive an A+ draft grade',
      icon: '📋',
      category: 'strategy',
      rarity: 'epic',
      xpReward: 1000,
      gemReward: 25,
      requirements: [{ type: 'milestone', value: 1, metadata: { draftGrade: 'A+' } }]
    },
    {
      id: 'lineup_optimizer',
      name: 'Lineup Optimizer',
      description: 'Set the optimal lineup 10 weeks in a row',
      icon: '⚡',
      category: 'strategy',
      rarity: 'epic',
      xpReward: 800,
      requirements: [{ type: 'perfect_lineup', value: 10, metadata: { consecutive: true } }]
    },
    
    // Social Achievements
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Send 50 messages in league chat',
      icon: '💬',
      category: 'social',
      rarity: 'common',
      xpReward: 200,
      requirements: [{ type: 'social_action', value: 50, metadata: { action: 'message' } }]
    },
    {
      id: 'trash_talker',
      name: 'Trash Talker',
      description: 'Win a grudge match after trash talking',
      icon: '🗣️',
      category: 'social',
      rarity: 'rare',
      xpReward: 400,
      requirements: [{ type: 'special_event', value: 1, metadata: { type: 'grudge_match' } }]
    },
    {
      id: 'helpful_friend',
      name: 'Helpful Friend',
      description: 'Share 10 AI insights with league mates',
      icon: '🤝',
      category: 'social',
      rarity: 'common',
      xpReward: 250,
      requirements: [{ type: 'social_action', value: 10, metadata: { action: 'share' } }]
    },
    
    // Collector Achievements
    {
      id: 'player_collector',
      name: 'Player Collector',
      description: 'Roster 50 different players in a season',
      icon: '📚',
      category: 'collector',
      rarity: 'rare',
      xpReward: 500,
      requirements: [{ type: 'milestone', value: 50, metadata: { type: 'unique_players' } }]
    },
    {
      id: 'all_star_team',
      name: 'All-Star Team',
      description: 'Have 5 players score 20+ points in one week',
      icon: '⭐',
      category: 'collector',
      rarity: 'epic',
      xpReward: 750,
      requirements: [{ type: 'special_event', value: 1, metadata: { type: 'all_star_week' } }]
    },
    
    // Special/Secret Achievements
    {
      id: 'ai_believer',
      name: 'AI Believer',
      description: 'Follow AI advice 20 times and win',
      icon: '🤖',
      category: 'special',
      rarity: 'epic',
      xpReward: 1000,
      requirements: [{ type: 'prediction_accuracy', value: 20, metadata: { ai_followed: true } }],
      secret: true
    },
    {
      id: 'comeback_king',
      name: 'Comeback King',
      description: 'Win after being projected to lose by 20+ points',
      icon: '🔄',
      category: 'special',
      rarity: 'legendary',
      xpReward: 1500,
      gemReward: 30,
      requirements: [{ type: 'special_event', value: 1, metadata: { type: 'comeback' } }],
      secret: true
    },
    {
      id: 'early_adopter',
      name: 'Early Adopter',
      description: 'Be one of the first 1000 Fantasy.AI users',
      icon: '🚀',
      category: 'special',
      rarity: 'legendary',
      xpReward: 2500,
      gemReward: 100,
      requirements: [{ type: 'milestone', value: 1, metadata: { type: 'early_user' } }],
      secret: false
    }
  ];
  
  // Level rewards
  private readonly levelRewards: LevelReward[] = [
    { level: 5, rewards: { gems: 10, title: 'Rookie' } },
    { level: 10, rewards: { gems: 25, features: ['custom_avatar'], title: 'Veteran' } },
    { level: 20, rewards: { gems: 50, features: ['priority_support'], title: 'Expert' } },
    { level: 30, rewards: { gems: 100, features: ['beta_access'], title: 'Master' } },
    { level: 50, rewards: { gems: 250, features: ['vip_status'], title: 'Legend' } },
    { level: 100, rewards: { gems: 1000, features: ['lifetime_pro'], title: 'Mythic' } }
  ];
  
  private constructor() {
    this.initializeAchievements();
  }
  
  static getInstance(): AchievementSystem {
    if (!AchievementSystem.instance) {
      AchievementSystem.instance = new AchievementSystem();
    }
    return AchievementSystem.instance;
  }
  
  /**
   * Initialize achievement system
   */
  private initializeAchievements(): void {
    for (const achievement of this.achievementDefinitions) {
      this.achievements.set(achievement.id, achievement);
    }
  }
  
  /**
   * Get user progress
   */
  async getUserProgress(userId: string): Promise<UserProgress> {
    if (this.userProgress.has(userId)) {
      return this.userProgress.get(userId)!;
    }
    
    // Load from database (mock for now)
    const progress: UserProgress = {
      userId,
      level: 1,
      currentXP: 0,
      nextLevelXP: this.levelFormula(2),
      totalXP: 0,
      achievements: [],
      stats: {
        gamesWon: 0,
        perfectLineups: 0,
        tradesMade: 0,
        predictionsCorrect: 0,
        totalPoints: 0,
        highestWeeklyScore: 0,
        championshipsWon: 0,
        draftGrade: 'B'
      },
      streaks: {
        daily: 0,
        weekly: 0,
        winning: 0
      },
      badges: []
    };
    
    this.userProgress.set(userId, progress);
    return progress;
  }
  
  /**
   * Check and award achievements
   */
  async checkAchievements(
    userId: string,
    event: {
      type: 'game_result' | 'trade' | 'lineup_set' | 'social' | 'milestone';
      data: any;
    }
  ): Promise<Achievement[]> {
    const progress = await this.getUserProgress(userId);
    const newAchievements: Achievement[] = [];
    
    // Update stats based on event
    this.updateStats(progress, event);
    
    // Check each achievement
    for (const [id, achievement] of this.achievements) {
      // Skip already unlocked
      if (progress.achievements.includes(id)) continue;
      
      // Check requirements
      if (this.checkRequirements(achievement, progress, event)) {
        // Award achievement
        progress.achievements.push(id);
        progress.totalXP += achievement.xpReward;
        progress.currentXP += achievement.xpReward;
        
        // Add to new achievements
        achievement.unlockedAt = new Date();
        newAchievements.push(achievement);
        
        // Check for level up
        this.checkLevelUp(progress);
        
        // Award gems if applicable
        if (achievement.gemReward) {
          // In real app, update user's gem balance
          console.log(`Awarded ${achievement.gemReward} gems to ${userId}`);
        }
      }
    }
    
    return newAchievements;
  }
  
  /**
   * Get achievement progress
   */
  getAchievementProgress(
    achievement: Achievement,
    progress: UserProgress
  ): { current: number; target: number; percentage: number } {
    let current = 0;
    let target = 0;
    
    for (const req of achievement.requirements) {
      switch (req.type) {
        case 'win_games':
          current = progress.stats.gamesWon;
          target = req.value;
          break;
        case 'make_trades':
          current = progress.stats.tradesMade;
          target = req.value;
          break;
        case 'perfect_lineup':
          current = progress.stats.perfectLineups;
          target = req.value;
          break;
        case 'prediction_accuracy':
          current = progress.stats.predictionsCorrect;
          target = req.value;
          break;
      }
    }
    
    const percentage = Math.min((current / target) * 100, 100);
    
    return { current, target, percentage };
  }
  
  /**
   * Get all achievements with progress
   */
  async getAllAchievements(userId: string): Promise<Achievement[]> {
    const progress = await this.getUserProgress(userId);
    const achievementsWithProgress: Achievement[] = [];
    
    for (const [id, achievement] of this.achievements) {
      const isUnlocked = progress.achievements.includes(id);
      const achievementCopy = { ...achievement };
      
      if (isUnlocked) {
        achievementCopy.unlockedAt = new Date(); // Would be from DB
      } else if (!achievement.secret) {
        // Show progress for non-secret locked achievements
        const prog = this.getAchievementProgress(achievement, progress);
        achievementCopy.progress = {
          current: prog.current,
          target: prog.target
        };
      }
      
      achievementsWithProgress.push(achievementCopy);
    }
    
    return achievementsWithProgress;
  }
  
  /**
   * Get leaderboard
   */
  async getLeaderboard(
    type: 'xp' | 'achievements' | 'level',
    timeframe: 'all-time' | 'season' | 'week'
  ): Promise<Array<{
    userId: string;
    username: string;
    value: number;
    rank: number;
  }>> {
    // In real implementation, query from database
    // Mock data for now
    return [
      { userId: '1', username: 'FantasyKing', value: 15420, rank: 1 },
      { userId: '2', username: 'AIBeliever', value: 14200, rank: 2 },
      { userId: '3', username: 'TradeWizard', value: 13850, rank: 3 },
      { userId: '4', username: 'LineupGuru', value: 12500, rank: 4 },
      { userId: '5', username: 'ChampionMaker', value: 11200, rank: 5 }
    ];
  }
  
  /**
   * Calculate user title based on level
   */
  getUserTitle(level: number): string {
    const titles = this.levelRewards
      .filter(r => r.rewards.title && level >= r.level)
      .sort((a, b) => b.level - a.level);
    
    return titles[0]?.rewards.title || 'Beginner';
  }
  
  /**
   * Update user stats
   */
  private updateStats(progress: UserProgress, event: any): void {
    switch (event.type) {
      case 'game_result':
        if (event.data.won) {
          progress.stats.gamesWon++;
          progress.streaks.winning++;
        } else {
          progress.streaks.winning = 0;
        }
        progress.stats.totalPoints += event.data.points;
        if (event.data.points > progress.stats.highestWeeklyScore) {
          progress.stats.highestWeeklyScore = event.data.points;
        }
        break;
        
      case 'trade':
        progress.stats.tradesMade++;
        break;
        
      case 'lineup_set':
        if (event.data.optimal) {
          progress.stats.perfectLineups++;
        }
        break;
    }
  }
  
  /**
   * Check if requirements are met
   */
  private checkRequirements(
    achievement: Achievement,
    progress: UserProgress,
    event: any
  ): boolean {
    for (const req of achievement.requirements) {
      switch (req.type) {
        case 'win_games':
          if (req.metadata?.consecutive) {
            if (progress.streaks.winning < req.value) return false;
          } else {
            if (progress.stats.gamesWon < req.value) return false;
          }
          break;
          
        case 'make_trades':
          if (progress.stats.tradesMade < req.value) return false;
          break;
          
        case 'perfect_lineup':
          if (progress.stats.perfectLineups < req.value) return false;
          break;
          
        case 'special_event':
          if (event.type !== 'milestone' || 
              event.data.type !== req.metadata?.type) return false;
          break;
          
        case 'milestone':
          if (event.type !== 'milestone') return false;
          if (req.metadata?.type === 'championship' && 
              !event.data.championship) return false;
          if (req.metadata?.draftGrade && 
              progress.stats.draftGrade !== req.metadata.draftGrade) return false;
          break;
      }
    }
    
    return true;
  }
  
  /**
   * Check for level up
   */
  private checkLevelUp(progress: UserProgress): void {
    while (progress.currentXP >= progress.nextLevelXP) {
      progress.currentXP -= progress.nextLevelXP;
      progress.level++;
      progress.nextLevelXP = this.levelFormula(progress.level + 1);
      
      // Check for level rewards
      const levelReward = this.levelRewards.find(r => r.level === progress.level);
      if (levelReward) {
        // Award level rewards
        console.log(`Level ${progress.level} rewards:`, levelReward.rewards);
      }
    }
  }
}

// Export singleton instance
export const achievementSystem = AchievementSystem.getInstance();