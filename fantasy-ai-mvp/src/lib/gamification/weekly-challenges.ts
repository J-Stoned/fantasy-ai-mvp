/**
 * Weekly Challenges System
 * Dynamic challenges that keep users engaged week after week
 */

export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'individual' | 'league' | 'global';
  category: 'scoring' | 'roster' | 'prediction' | 'social' | 'special';
  difficulty: 'easy' | 'medium' | 'hard' | 'insane';
  requirements: ChallengeRequirement[];
  rewards: {
    xp: number;
    gems?: number;
    badges?: string[];
    items?: string[];
  };
  timeLimit: {
    start: Date;
    end: Date;
  };
  progress?: {
    current: number;
    target: number;
    participants: number;
  };
  leaderboard?: ChallengeLeaderboard;
}

export interface ChallengeRequirement {
  type: 'score' | 'lineup' | 'win' | 'predict' | 'collect' | 'social';
  condition: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface ChallengeLeaderboard {
  entries: Array<{
    userId: string;
    username: string;
    score: number;
    completedAt?: Date;
    rank?: number;
  }>;
  lastUpdated: Date;
}

export interface WeeklyChallengeSet {
  week: number;
  season: string;
  theme?: string;
  challenges: Challenge[];
  bonusChallenge?: Challenge;
  communityGoal?: CommunityChallenge;
}

export interface CommunityChallenge {
  id: string;
  name: string;
  description: string;
  currentProgress: number;
  targetProgress: number;
  participants: number;
  rewards: {
    tier1: { progress: number; reward: string };
    tier2: { progress: number; reward: string };
    tier3: { progress: number; reward: string };
  };
  deadline: Date;
}

export interface UserChallengeProgress {
  userId: string;
  completedChallenges: string[];
  currentChallenges: Map<string, {
    startedAt: Date;
    progress: number;
    bestAttempt?: number;
  }>;
  weeklyStreak: number;
  totalChallengesCompleted: number;
  favoriteCategory: string;
}

export class WeeklyChallengeSystem {
  private static instance: WeeklyChallengeSystem;
  private activeChallenges: Map<string, Challenge> = new Map();
  private userProgress: Map<string, UserChallengeProgress> = new Map();
  private challengeHistory: Map<number, WeeklyChallengeSet> = new Map();
  
  // Challenge templates for dynamic generation
  private readonly challengeTemplates = {
    scoring: [
      {
        name: 'Century Club',
        description: 'Score 100+ points in a single week',
        icon: '💯',
        requirements: [{ type: 'score' as const, condition: 'weekly_total', value: 100 }],
        difficulty: 'easy' as const
      },
      {
        name: 'Point Machine',
        description: 'Score 150+ points in a single week',
        icon: '🚀',
        requirements: [{ type: 'score' as const, condition: 'weekly_total', value: 150 }],
        difficulty: 'hard' as const
      },
      {
        name: 'Monday Night Miracle',
        description: 'Win by less than 5 points with MNF players',
        icon: '🌙',
        requirements: [{ type: 'win' as const, condition: 'close_mnf', value: 5 }],
        difficulty: 'hard' as const
      }
    ],
    roster: [
      {
        name: 'Streaming Success',
        description: 'Add a player who scores 15+ points same week',
        icon: '📈',
        requirements: [{ type: 'lineup' as const, condition: 'waiver_hero', value: 15 }],
        difficulty: 'medium' as const
      },
      {
        name: 'Perfect Lineup',
        description: 'Start the optimal lineup (no points left on bench)',
        icon: '✨',
        requirements: [{ type: 'lineup' as const, condition: 'optimal', value: 1 }],
        difficulty: 'hard' as const
      },
      {
        name: 'Trust the Process',
        description: 'Keep the same lineup for 3 weeks',
        icon: '🔒',
        requirements: [{ type: 'lineup' as const, condition: 'unchanged', value: 3 }],
        difficulty: 'medium' as const
      }
    ],
    prediction: [
      {
        name: 'Oracle',
        description: 'Correctly predict 5 game outcomes',
        icon: '🔮',
        requirements: [{ type: 'predict' as const, condition: 'correct_games', value: 5 }],
        difficulty: 'medium' as const
      },
      {
        name: 'Nostradamus',
        description: 'Predict the highest scoring player of the week',
        icon: '🎯',
        requirements: [{ type: 'predict' as const, condition: 'top_scorer', value: 1 }],
        difficulty: 'hard' as const
      },
      {
        name: 'Upset Alert',
        description: 'Correctly predict an underdog victory',
        icon: '😱',
        requirements: [{ type: 'predict' as const, condition: 'upset', value: 1 }],
        difficulty: 'medium' as const
      }
    ],
    social: [
      {
        name: 'Trash Talk Champion',
        description: 'Get 10+ reactions on a single post',
        icon: '🗣️',
        requirements: [{ type: 'social' as const, condition: 'reactions', value: 10 }],
        difficulty: 'easy' as const
      },
      {
        name: 'Helpful Teammate',
        description: 'Share 3 AI insights with your league',
        icon: '🤝',
        requirements: [{ type: 'social' as const, condition: 'share_insights', value: 3 }],
        difficulty: 'easy' as const
      },
      {
        name: 'Meme Lord',
        description: 'Post a meme that gets 20+ reactions',
        icon: '😂',
        requirements: [{ type: 'social' as const, condition: 'meme_reactions', value: 20 }],
        difficulty: 'medium' as const
      }
    ],
    special: [
      {
        name: 'AI Believer',
        description: 'Follow AI advice and win your matchup',
        icon: '🤖',
        requirements: [{ type: 'win' as const, condition: 'ai_lineup', value: 1 }],
        difficulty: 'medium' as const
      },
      {
        name: 'Comeback Kid',
        description: 'Win after being down 20+ points',
        icon: '🔄',
        requirements: [{ type: 'win' as const, condition: 'comeback', value: 20 }],
        difficulty: 'hard' as const
      },
      {
        name: 'Lucky Number 7',
        description: 'Have exactly 7 players score in double digits',
        icon: '7️⃣',
        requirements: [{ type: 'collect' as const, condition: 'double_digit_players', value: 7 }],
        difficulty: 'insane' as const
      }
    ]
  };
  
  // Seasonal themes
  private readonly themes = [
    { weeks: [1, 2, 3], theme: 'Season Kickoff', bonus: 1.5 },
    { weeks: [4, 5, 6], theme: 'Autumn Assault', bonus: 1.2 },
    { weeks: [7, 8, 9], theme: 'Midseason Madness', bonus: 1.3 },
    { weeks: [10, 11, 12], theme: 'Playoff Push', bonus: 1.4 },
    { weeks: [13, 14, 15], theme: 'Championship Chase', bonus: 1.5 },
    { weeks: [16, 17], theme: 'Final Countdown', bonus: 2.0 }
  ];
  
  private constructor() {}
  
  static getInstance(): WeeklyChallengeSystem {
    if (!WeeklyChallengeSystem.instance) {
      WeeklyChallengeSystem.instance = new WeeklyChallengeSystem();
    }
    return WeeklyChallengeSystem.instance;
  }
  
  /**
   * Generate weekly challenges
   */
  async generateWeeklyChallenges(week: number, season: string): Promise<WeeklyChallengeSet> {
    const theme = this.themes.find(t => t.weeks.includes(week));
    const challenges: Challenge[] = [];
    
    // Select 2-3 challenges from each category
    const categories = Object.keys(this.challengeTemplates) as Array<keyof typeof this.challengeTemplates>;
    
    for (const category of categories) {
      const templates = this.challengeTemplates[category];
      const count = category === 'special' ? 1 : 2;
      const selected = this.selectRandomChallenges(templates, count);
      
      for (const template of selected) {
        const challenge = this.createChallengeFromTemplate(template, week, category);
        challenges.push(challenge);
        this.activeChallenges.set(challenge.id, challenge);
      }
    }
    
    // Create bonus challenge
    const bonusChallenge = this.createBonusChallenge(week);
    
    // Create community challenge
    const communityGoal = this.createCommunityChallenge(week);
    
    const challengeSet: WeeklyChallengeSet = {
      week,
      season,
      theme: theme?.theme,
      challenges,
      bonusChallenge,
      communityGoal
    };
    
    this.challengeHistory.set(week, challengeSet);
    
    return challengeSet;
  }
  
  /**
   * Check challenge progress
   */
  async checkChallengeProgress(
    userId: string,
    event: {
      type: 'game_complete' | 'lineup_set' | 'prediction' | 'social' | 'roster_move';
      data: any;
    }
  ): Promise<Challenge[]> {
    const progress = await this.getUserProgress(userId);
    const completedChallenges: Challenge[] = [];
    
    for (const [challengeId, challenge] of this.activeChallenges) {
      // Skip if already completed
      if (progress.completedChallenges.includes(challengeId)) continue;
      
      // Check if challenge requirements are met
      const userChallengeProgress = progress.currentChallenges.get(challengeId) || {
        startedAt: new Date(),
        progress: 0
      };
      
      const newProgress = this.calculateProgress(challenge, event, userChallengeProgress);
      
      if (newProgress.progress >= challenge.requirements[0].value) {
        // Challenge completed!
        progress.completedChallenges.push(challengeId);
        progress.currentChallenges.delete(challengeId);
        progress.totalChallengesCompleted++;
        
        // Update challenge leaderboard
        await this.updateLeaderboard(challenge, userId, newProgress.progress);
        
        completedChallenges.push(challenge);
      } else if (newProgress.progress > userChallengeProgress.progress) {
        // Update progress
        progress.currentChallenges.set(challengeId, newProgress);
      }
    }
    
    return completedChallenges;
  }
  
  /**
   * Get user's active challenges
   */
  async getActiveChallenges(userId: string): Promise<Challenge[]> {
    const progress = await this.getUserProgress(userId);
    const activeChallenges: Challenge[] = [];
    
    for (const [id, challenge] of this.activeChallenges) {
      if (!progress.completedChallenges.includes(id)) {
        // Add progress info
        const userProgress = progress.currentChallenges.get(id);
        if (userProgress) {
          challenge.progress = {
            current: userProgress.progress,
            target: challenge.requirements[0].value,
            participants: await this.getChallengeParticipants(id)
          };
        }
        activeChallenges.push(challenge);
      }
    }
    
    return activeChallenges;
  }
  
  /**
   * Get challenge leaderboard
   */
  async getChallengeLeaderboard(challengeId: string): Promise<ChallengeLeaderboard | null> {
    const challenge = this.activeChallenges.get(challengeId);
    return challenge?.leaderboard || null;
  }
  
  /**
   * Claim challenge rewards
   */
  async claimRewards(userId: string, challengeId: string): Promise<Challenge['rewards']> {
    const challenge = this.activeChallenges.get(challengeId);
    if (!challenge) throw new Error('Challenge not found');
    
    const progress = await this.getUserProgress(userId);
    if (!progress.completedChallenges.includes(challengeId)) {
      throw new Error('Challenge not completed');
    }
    
    // In real implementation, update user's currency/items
    console.log(`User ${userId} claimed rewards:`, challenge.rewards);
    
    return challenge.rewards;
  }
  
  /**
   * Get weekly streak
   */
  async getWeeklyStreak(userId: string): Promise<number> {
    const progress = await this.getUserProgress(userId);
    return progress.weeklyStreak;
  }
  
  // Private helper methods
  
  private async getUserProgress(userId: string): Promise<UserChallengeProgress> {
    if (!this.userProgress.has(userId)) {
      this.userProgress.set(userId, {
        userId,
        completedChallenges: [],
        currentChallenges: new Map(),
        weeklyStreak: 0,
        totalChallengesCompleted: 0,
        favoriteCategory: 'scoring'
      });
    }
    return this.userProgress.get(userId)!;
  }
  
  private selectRandomChallenges<T>(templates: T[], count: number): T[] {
    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
  
  private createChallengeFromTemplate(
    template: any,
    week: number,
    category: string
  ): Challenge {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    const baseXP = {
      easy: 100,
      medium: 250,
      hard: 500,
      insane: 1000
    };
    
    const challenge: Challenge = {
      id: `challenge_w${week}_${category}_${Date.now()}`,
      name: template.name,
      description: template.description,
      icon: template.icon,
      type: 'individual',
      category: category as Challenge['category'],
      difficulty: template.difficulty,
      requirements: template.requirements,
      rewards: {
        xp: baseXP[template.difficulty],
        gems: template.difficulty === 'hard' ? 10 : template.difficulty === 'insane' ? 25 : undefined
      },
      timeLimit: {
        start: startDate,
        end: endDate
      },
      leaderboard: {
        entries: [],
        lastUpdated: new Date()
      }
    };
    
    return challenge;
  }
  
  private createBonusChallenge(week: number): Challenge {
    const bonusChallenges = [
      {
        name: 'Triple Crown',
        description: 'Complete 3 challenges in different categories',
        icon: '👑',
        requirements: [{ type: 'collect' as const, condition: 'challenges', value: 3 }]
      },
      {
        name: 'Speed Demon',
        description: 'Complete any challenge within 24 hours',
        icon: '⚡',
        requirements: [{ type: 'collect' as const, condition: 'speed_complete', value: 1 }]
      },
      {
        name: 'Perfectionist',
        description: 'Complete all challenges this week',
        icon: '💎',
        requirements: [{ type: 'collect' as const, condition: 'all_challenges', value: 1 }]
      }
    ];
    
    const selected = bonusChallenges[week % bonusChallenges.length];
    
    return {
      id: `bonus_w${week}`,
      name: selected.name,
      description: selected.description,
      icon: selected.icon,
      type: 'individual',
      category: 'special',
      difficulty: 'insane',
      requirements: selected.requirements,
      rewards: {
        xp: 2000,
        gems: 50,
        badges: ['weekly_champion']
      },
      timeLimit: {
        start: new Date(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    };
  }
  
  private createCommunityChallenge(week: number): CommunityChallenge {
    const challenges = [
      {
        name: 'Score Surge',
        description: 'Community total: 1,000,000 fantasy points',
        target: 1000000
      },
      {
        name: 'Trade Frenzy',
        description: 'Community total: 500 trades completed',
        target: 500
      },
      {
        name: 'Perfect Week',
        description: 'Community total: 100 optimal lineups',
        target: 100
      }
    ];
    
    const selected = challenges[week % challenges.length];
    
    return {
      id: `community_w${week}`,
      name: selected.name,
      description: selected.description,
      currentProgress: 0,
      targetProgress: selected.target,
      participants: 0,
      rewards: {
        tier1: { progress: 0.25, reward: '5 gems for all participants' },
        tier2: { progress: 0.5, reward: '10 gems for all participants' },
        tier3: { progress: 1.0, reward: '25 gems + exclusive badge' }
      },
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
  }
  
  private calculateProgress(
    challenge: Challenge,
    event: any,
    currentProgress: any
  ): { progress: number; startedAt: Date } {
    let progress = currentProgress.progress || 0;
    
    for (const req of challenge.requirements) {
      switch (req.type) {
        case 'score':
          if (event.type === 'game_complete' && req.condition === 'weekly_total') {
            progress = event.data.weeklyScore || 0;
          }
          break;
          
        case 'win':
          if (event.type === 'game_complete' && event.data.won) {
            if (req.condition === 'ai_lineup' && event.data.usedAILineup) {
              progress++;
            } else if (req.condition === 'comeback' && event.data.comebackMargin >= req.value) {
              progress++;
            } else if (req.condition === 'close_mnf' && event.data.mnfDecided && event.data.margin <= req.value) {
              progress++;
            }
          }
          break;
          
        case 'lineup':
          if (event.type === 'lineup_set') {
            if (req.condition === 'optimal' && event.data.isOptimal) {
              progress++;
            } else if (req.condition === 'waiver_hero' && event.data.waiverPlayerPoints >= req.value) {
              progress++;
            }
          }
          break;
          
        case 'predict':
          if (event.type === 'prediction' && event.data.correct) {
            progress++;
          }
          break;
          
        case 'social':
          if (event.type === 'social') {
            if (req.condition === 'reactions' && event.data.reactionCount >= req.value) {
              progress = req.value;
            } else if (req.condition === 'share_insights' && event.data.action === 'share') {
              progress++;
            }
          }
          break;
      }
    }
    
    return {
      progress,
      startedAt: currentProgress.startedAt || new Date()
    };
  }
  
  private async updateLeaderboard(
    challenge: Challenge,
    userId: string,
    score: number
  ): Promise<void> {
    if (!challenge.leaderboard) {
      challenge.leaderboard = {
        entries: [],
        lastUpdated: new Date()
      };
    }
    
    // Add or update entry
    const existingEntry = challenge.leaderboard.entries.find(e => e.userId === userId);
    
    if (existingEntry) {
      existingEntry.score = Math.max(existingEntry.score, score);
      existingEntry.completedAt = new Date();
    } else {
      challenge.leaderboard.entries.push({
        userId,
        username: `User${userId}`, // Would get from user service
        score,
        completedAt: new Date()
      });
    }
    
    // Sort and assign ranks
    challenge.leaderboard.entries.sort((a, b) => b.score - a.score);
    challenge.leaderboard.entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    challenge.leaderboard.lastUpdated = new Date();
  }
  
  private async getChallengeParticipants(challengeId: string): Promise<number> {
    // In real implementation, count from database
    const challenge = this.activeChallenges.get(challengeId);
    return challenge?.leaderboard?.entries.length || 0;
  }
}

// Export singleton instance
export const weeklyChallenges = WeeklyChallengeSystem.getInstance();