/**
 * Friend System & Head-to-Head Features
 * Social connections, rivalries, and direct competitions
 */

export interface Friend {
  userId: string;
  username: string;
  avatar?: string;
  level?: number;
  status: 'pending' | 'accepted' | 'blocked';
  friendsSince?: Date;
  mutualFriends?: number;
  stats?: FriendStats;
}

export interface FriendStats {
  headToHeadRecord: { wins: number; losses: number; ties: number };
  lastMatchup?: Date;
  totalPointsFor: number;
  totalPointsAgainst: number;
  biggestWin?: { margin: number; date: Date };
  biggestLoss?: { margin: number; date: Date };
  currentStreak: { type: 'W' | 'L' | 'T'; count: number };
  favoriteTrashTalk?: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromAvatar?: string;
  toUserId: string;
  message?: string;
  sentAt: Date;
  commonLeagues?: string[];
}

export interface HeadToHeadChallenge {
  id: string;
  challengerId: string;
  challengerName: string;
  challengedId: string;
  challengedName: string;
  type: 'weekly' | 'season' | 'custom';
  stakes: ChallengeStakes;
  conditions: ChallengeConditions;
  status: 'pending' | 'active' | 'completed' | 'declined';
  startDate: Date;
  endDate: Date;
  result?: ChallengeResult;
}

export interface ChallengeStakes {
  type: 'bragging_rights' | 'gems' | 'badge' | 'custom';
  amount?: number;
  customStake?: string;
  loserId?: string; // Loser ID after completion
}

export interface ChallengeConditions {
  metric: 'total_points' | 'h2h_wins' | 'perfect_lineups' | 'trade_success' | 'accuracy';
  duration: number; // weeks
  leagues?: string[]; // Specific leagues or all
  customRules?: string[];
}

export interface ChallengeResult {
  winnerId: string;
  winnerScore: number;
  loserId: string;
  loserScore: number;
  margin: number;
  completedAt: Date;
  highlights: string[];
}

export interface Rivalry {
  id: string;
  user1Id: string;
  user2Id: string;
  intensity: 'friendly' | 'heated' | 'legendary';
  history: RivalryEvent[];
  stats: {
    totalGames: number;
    user1Wins: number;
    user2Wins: number;
    ties: number;
    avgMargin: number;
    trashTalkCount: number;
  };
  badges: string[];
  nextMatchup?: Date;
}

export interface RivalryEvent {
  type: 'matchup' | 'trade' | 'trash_talk' | 'achievement';
  date: Date;
  description: string;
  winnerId?: string;
  impact: number; // -10 to 10 scale
}

export interface FriendActivity {
  id: string;
  friendId: string;
  type: 'achievement' | 'trade' | 'lineup' | 'win' | 'milestone';
  description: string;
  timestamp: Date;
  leagueId?: string;
  metadata?: Record<string, any>;
}

export class FriendSystem {
  private static instance: FriendSystem;
  private friendships: Map<string, Map<string, Friend>> = new Map(); // userId -> friendId -> Friend
  private friendRequests: Map<string, FriendRequest[]> = new Map();
  private challenges: Map<string, HeadToHeadChallenge[]> = new Map();
  private rivalries: Map<string, Rivalry> = new Map();
  private friendActivities: Map<string, FriendActivity[]> = new Map();
  
  // Rivalry thresholds
  private readonly rivalryThresholds = {
    friendly: { games: 3, trashTalk: 5 },
    heated: { games: 10, trashTalk: 20, closeGames: 5 },
    legendary: { games: 25, trashTalk: 50, closeGames: 15, seasons: 2 }
  };
  
  // Challenge templates
  private readonly challengeTemplates = [
    {
      name: 'Weekly Showdown',
      type: 'weekly' as const,
      metric: 'total_points' as const,
      duration: 1,
      description: 'Highest score this week wins!'
    },
    {
      name: 'Perfect Week Challenge',
      type: 'weekly' as const,
      metric: 'perfect_lineups' as const,
      duration: 1,
      description: 'Most optimal lineups this week'
    },
    {
      name: 'Trade War',
      type: 'custom' as const,
      metric: 'trade_success' as const,
      duration: 4,
      description: 'Best trade performance over 4 weeks'
    },
    {
      name: 'Season Long Battle',
      type: 'season' as const,
      metric: 'h2h_wins' as const,
      duration: 17,
      description: 'Most head-to-head wins all season'
    },
    {
      name: 'Prediction Master',
      type: 'custom' as const,
      metric: 'accuracy' as const,
      duration: 3,
      description: 'Most accurate game predictions'
    }
  ];
  
  private constructor() {
    this.startActivityMonitoring();
  }
  
  static getInstance(): FriendSystem {
    if (!FriendSystem.instance) {
      FriendSystem.instance = new FriendSystem();
    }
    return FriendSystem.instance;
  }
  
  /**
   * Send friend request
   */
  async sendFriendRequest(
    fromUserId: string,
    fromUsername: string,
    toUserId: string,
    message?: string
  ): Promise<FriendRequest> {
    // Check if already friends
    const existingFriend = this.getFriend(fromUserId, toUserId);
    if (existingFriend) {
      throw new Error('Already friends or request pending');
    }
    
    const request: FriendRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromUserId,
      fromUsername,
      toUserId,
      message,
      sentAt: new Date(),
      commonLeagues: await this.getCommonLeagues(fromUserId, toUserId)
    };
    
    // Store request
    if (!this.friendRequests.has(toUserId)) {
      this.friendRequests.set(toUserId, []);
    }
    this.friendRequests.get(toUserId)!.push(request);
    
    // Create notification
    await this.createFriendNotification(request);
    
    return request;
  }
  
  /**
   * Accept friend request
   */
  async acceptFriendRequest(userId: string, requestId: string): Promise<Friend> {
    const requests = this.friendRequests.get(userId) || [];
    const request = requests.find(r => r.id === requestId);
    
    if (!request) {
      throw new Error('Friend request not found');
    }
    
    // Create friendship
    const friend: Friend = {
      userId: request.fromUserId,
      username: request.fromUsername,
      avatar: request.fromAvatar,
      status: 'accepted',
      friendsSince: new Date(),
      stats: {
        headToHeadRecord: { wins: 0, losses: 0, ties: 0 },
        totalPointsFor: 0,
        totalPointsAgainst: 0,
        currentStreak: { type: 'W', count: 0 }
      }
    };
    
    // Add to both users' friend lists
    this.addFriend(userId, friend);
    this.addFriend(request.fromUserId, {
      ...friend,
      userId,
      username: 'CurrentUser' // Would get from user service
    });
    
    // Remove request
    this.friendRequests.set(userId, requests.filter(r => r.id !== requestId));
    
    // Check for potential rivalry
    await this.checkForRivalry(userId, request.fromUserId);
    
    return friend;
  }
  
  /**
   * Get user's friends
   */
  async getFriends(
    userId: string,
    options: {
      status?: Friend['status'];
      sortBy?: 'name' | 'level' | 'recent' | 'h2h';
    } = {}
  ): Promise<Friend[]> {
    const userFriends = this.friendships.get(userId);
    if (!userFriends) return [];
    
    let friends = Array.from(userFriends.values());
    
    // Filter by status
    if (options.status) {
      friends = friends.filter(f => f.status === options.status);
    }
    
    // Sort
    switch (options.sortBy) {
      case 'name':
        friends.sort((a, b) => a.username.localeCompare(b.username));
        break;
      case 'level':
        friends.sort((a, b) => (b.level || 0) - (a.level || 0));
        break;
      case 'recent':
        friends.sort((a, b) => 
          (b.friendsSince?.getTime() || 0) - (a.friendsSince?.getTime() || 0)
        );
        break;
      case 'h2h':
        friends.sort((a, b) => {
          const aWins = a.stats?.headToHeadRecord.wins || 0;
          const bWins = b.stats?.headToHeadRecord.wins || 0;
          return bWins - aWins;
        });
        break;
    }
    
    return friends;
  }
  
  /**
   * Create head-to-head challenge
   */
  async createChallenge(
    challengerId: string,
    challengerName: string,
    challengedId: string,
    options: {
      type?: HeadToHeadChallenge['type'];
      stakes?: ChallengeStakes;
      conditions?: Partial<ChallengeConditions>;
      customMessage?: string;
    } = {}
  ): Promise<HeadToHeadChallenge> {
    // Verify friendship
    const friend = this.getFriend(challengerId, challengedId);
    if (!friend || friend.status !== 'accepted') {
      throw new Error('Must be friends to create challenge');
    }
    
    // Use template or custom
    const template = options.type ? 
      this.challengeTemplates.find(t => t.type === options.type) :
      this.challengeTemplates[0];
    
    const challenge: HeadToHeadChallenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      challengerId,
      challengerName,
      challengedId,
      challengedName: friend.username,
      type: options.type || 'weekly',
      stakes: options.stakes || { type: 'bragging_rights' },
      conditions: {
        metric: options.conditions?.metric || template?.metric || 'total_points',
        duration: options.conditions?.duration || template?.duration || 1,
        leagues: options.conditions?.leagues,
        customRules: options.conditions?.customRules
      },
      status: 'pending',
      startDate: new Date(),
      endDate: this.calculateEndDate(options.conditions?.duration || 1)
    };
    
    // Store challenge
    if (!this.challenges.has(challengedId)) {
      this.challenges.set(challengedId, []);
    }
    this.challenges.get(challengedId)!.push(challenge);
    
    // Also store for challenger
    if (!this.challenges.has(challengerId)) {
      this.challenges.set(challengerId, []);
    }
    this.challenges.get(challengerId)!.push(challenge);
    
    // Create notification
    await this.createChallengeNotification(challenge, options.customMessage);
    
    return challenge;
  }
  
  /**
   * Accept challenge
   */
  async acceptChallenge(userId: string, challengeId: string): Promise<void> {
    const userChallenges = this.challenges.get(userId) || [];
    const challenge = userChallenges.find(c => c.id === challengeId);
    
    if (!challenge || challenge.status !== 'pending') {
      throw new Error('Challenge not found or not pending');
    }
    
    challenge.status = 'active';
    challenge.startDate = new Date();
    challenge.endDate = this.calculateEndDate(challenge.conditions.duration);
    
    // Update rivalry intensity
    await this.updateRivalryIntensity(challenge.challengerId, challenge.challengedId, 'challenge');
  }
  
  /**
   * Get active challenges
   */
  async getActiveChallenges(userId: string): Promise<HeadToHeadChallenge[]> {
    const userChallenges = this.challenges.get(userId) || [];
    return userChallenges.filter(c => c.status === 'active');
  }
  
  /**
   * Update challenge progress
   */
  async updateChallengeProgress(
    challengeId: string,
    userId: string,
    metric: string,
    value: number
  ): Promise<void> {
    // In real implementation, track progress in database
    console.log(`Challenge ${challengeId}: User ${userId} - ${metric}: ${value}`);
    
    // Check if challenge is complete
    const challenge = await this.getChallenge(challengeId);
    if (challenge && new Date() > challenge.endDate) {
      await this.completeChallenge(challengeId);
    }
  }
  
  /**
   * Get friend activity feed
   */
  async getFriendActivityFeed(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      friendIds?: string[];
    } = {}
  ): Promise<FriendActivity[]> {
    const friends = await this.getFriends(userId);
    const friendIds = options.friendIds || friends.map(f => f.userId);
    
    const activities: FriendActivity[] = [];
    
    for (const friendId of friendIds) {
      const friendActivities = this.friendActivities.get(friendId) || [];
      activities.push(...friendActivities);
    }
    
    // Sort by timestamp
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply pagination
    const start = options.offset || 0;
    const limit = options.limit || 20;
    
    return activities.slice(start, start + limit);
  }
  
  /**
   * Get rivalries
   */
  async getRivalries(userId: string): Promise<Rivalry[]> {
    const userRivalries: Rivalry[] = [];
    
    for (const [id, rivalry] of this.rivalries) {
      if (rivalry.user1Id === userId || rivalry.user2Id === userId) {
        userRivalries.push(rivalry);
      }
    }
    
    // Sort by intensity and activity
    userRivalries.sort((a, b) => {
      const intensityOrder = { legendary: 3, heated: 2, friendly: 1 };
      const aScore = intensityOrder[a.intensity] * 100 + a.stats.totalGames;
      const bScore = intensityOrder[b.intensity] * 100 + b.stats.totalGames;
      return bScore - aScore;
    });
    
    return userRivalries;
  }
  
  /**
   * Get head-to-head stats
   */
  async getHeadToHeadStats(
    user1Id: string,
    user2Id: string
  ): Promise<{
    overall: FriendStats;
    byLeague: Map<string, FriendStats>;
    recentGames: Array<{
      date: Date;
      winner: string;
      user1Score: number;
      user2Score: number;
      margin: number;
    }>;
  }> {
    const friend = this.getFriend(user1Id, user2Id);
    if (!friend) {
      throw new Error('Users are not friends');
    }
    
    // Mock data - would query from database
    return {
      overall: friend.stats!,
      byLeague: new Map([
        ['league1', {
          headToHeadRecord: { wins: 3, losses: 2, ties: 0 },
          totalPointsFor: 567.8,
          totalPointsAgainst: 543.2,
          currentStreak: { type: 'W', count: 2 }
        }]
      ]),
      recentGames: [
        {
          date: new Date('2025-01-15'),
          winner: user1Id,
          user1Score: 124.5,
          user2Score: 118.3,
          margin: 6.2
        },
        {
          date: new Date('2025-01-08'),
          winner: user1Id,
          user1Score: 135.7,
          user2Score: 122.1,
          margin: 13.6
        }
      ]
    };
  }
  
  /**
   * Send trash talk
   */
  async sendTrashTalk(
    fromUserId: string,
    toUserId: string,
    message: string,
    gameContext?: {
      gameId: string;
      score: { user1: number; user2: number };
    }
  ): Promise<void> {
    // Verify friendship
    const friend = this.getFriend(fromUserId, toUserId);
    if (!friend || friend.status !== 'accepted') {
      throw new Error('Must be friends to trash talk');
    }
    
    // Update rivalry
    await this.updateRivalryIntensity(fromUserId, toUserId, 'trash_talk');
    
    // Create social post
    // Would integrate with social feed
    console.log(`Trash talk from ${fromUserId} to ${toUserId}: ${message}`);
  }
  
  /**
   * Get friend suggestions
   */
  async getFriendSuggestions(
    userId: string,
    options: {
      limit?: number;
      basedOn?: 'leagues' | 'skill' | 'activity';
    } = {}
  ): Promise<Array<{
    userId: string;
    username: string;
    reason: string;
    commonLeagues: number;
    mutualFriends: number;
  }>> {
    // Mock suggestions - would use ML/recommendation engine
    const suggestions = [
      {
        userId: 'sug1',
        username: 'FantasyPro2024',
        reason: 'In 2 of your leagues',
        commonLeagues: 2,
        mutualFriends: 5
      },
      {
        userId: 'sug2',
        username: 'TradeKing99',
        reason: 'Similar skill level',
        commonLeagues: 1,
        mutualFriends: 3
      },
      {
        userId: 'sug3',
        username: 'AIGuru',
        reason: 'Active in your favorite leagues',
        commonLeagues: 3,
        mutualFriends: 8
      }
    ];
    
    return suggestions.slice(0, options.limit || 10);
  }
  
  // Private helper methods
  
  private getFriend(userId: string, friendId: string): Friend | null {
    const userFriends = this.friendships.get(userId);
    if (!userFriends) return null;
    return userFriends.get(friendId) || null;
  }
  
  private addFriend(userId: string, friend: Friend): void {
    if (!this.friendships.has(userId)) {
      this.friendships.set(userId, new Map());
    }
    this.friendships.get(userId)!.set(friend.userId, friend);
  }
  
  private async getCommonLeagues(user1Id: string, user2Id: string): Promise<string[]> {
    // In real implementation, query from database
    return ['league1', 'league2'];
  }
  
  private async createFriendNotification(request: FriendRequest): Promise<void> {
    // Would integrate with notification system
    console.log(`Friend request from ${request.fromUsername} to ${request.toUserId}`);
  }
  
  private async createChallengeNotification(
    challenge: HeadToHeadChallenge,
    customMessage?: string
  ): Promise<void> {
    // Would integrate with notification system
    const message = customMessage || 
      `${challenge.challengerName} challenged you to a ${challenge.type} showdown!`;
    console.log(`Challenge notification: ${message}`);
  }
  
  private async checkForRivalry(user1Id: string, user2Id: string): Promise<void> {
    const rivalryId = [user1Id, user2Id].sort().join('_');
    
    if (!this.rivalries.has(rivalryId)) {
      // Create new rivalry
      const rivalry: Rivalry = {
        id: rivalryId,
        user1Id: user1Id < user2Id ? user1Id : user2Id,
        user2Id: user1Id < user2Id ? user2Id : user1Id,
        intensity: 'friendly',
        history: [],
        stats: {
          totalGames: 0,
          user1Wins: 0,
          user2Wins: 0,
          ties: 0,
          avgMargin: 0,
          trashTalkCount: 0
        },
        badges: []
      };
      
      this.rivalries.set(rivalryId, rivalry);
    }
  }
  
  private async updateRivalryIntensity(
    user1Id: string,
    user2Id: string,
    eventType: 'matchup' | 'trade' | 'trash_talk' | 'challenge'
  ): Promise<void> {
    const rivalryId = [user1Id, user2Id].sort().join('_');
    const rivalry = this.rivalries.get(rivalryId);
    
    if (!rivalry) return;
    
    // Update stats based on event
    if (eventType === 'trash_talk') {
      rivalry.stats.trashTalkCount++;
    }
    
    // Check for intensity upgrade
    if (rivalry.intensity === 'friendly' &&
        rivalry.stats.totalGames >= this.rivalryThresholds.heated.games &&
        rivalry.stats.trashTalkCount >= this.rivalryThresholds.heated.trashTalk) {
      rivalry.intensity = 'heated';
      rivalry.badges.push('heated_rivalry');
    }
    
    if (rivalry.intensity === 'heated' &&
        rivalry.stats.totalGames >= this.rivalryThresholds.legendary.games &&
        rivalry.stats.trashTalkCount >= this.rivalryThresholds.legendary.trashTalk) {
      rivalry.intensity = 'legendary';
      rivalry.badges.push('legendary_rivalry');
    }
    
    // Add event to history
    rivalry.history.push({
      type: eventType,
      date: new Date(),
      description: `${eventType} event between rivals`,
      impact: eventType === 'trash_talk' ? 2 : 1
    });
  }
  
  private calculateEndDate(durationWeeks: number): Date {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (durationWeeks * 7));
    return endDate;
  }
  
  private async getChallenge(challengeId: string): Promise<HeadToHeadChallenge | null> {
    for (const [userId, challenges] of this.challenges) {
      const challenge = challenges.find(c => c.id === challengeId);
      if (challenge) return challenge;
    }
    return null;
  }
  
  private async completeChallenge(challengeId: string): Promise<void> {
    const challenge = await this.getChallenge(challengeId);
    if (!challenge) return;
    
    // Calculate winner (mock)
    const user1Score = Math.random() * 100;
    const user2Score = Math.random() * 100;
    
    challenge.status = 'completed';
    challenge.result = {
      winnerId: user1Score > user2Score ? challenge.challengerId : challenge.challengedId,
      winnerScore: Math.max(user1Score, user2Score),
      loserId: user1Score > user2Score ? challenge.challengedId : challenge.challengerId,
      loserScore: Math.min(user1Score, user2Score),
      margin: Math.abs(user1Score - user2Score),
      completedAt: new Date(),
      highlights: [
        'Epic comeback in Week 3',
        'Perfect lineup bonus achieved',
        'Clutch waiver wire pickup'
      ]
    };
    
    // Update friend stats
    await this.updateFriendStats(challenge);
  }
  
  private async updateFriendStats(challenge: HeadToHeadChallenge): Promise<void> {
    if (!challenge.result) return;
    
    const winnerId = challenge.result.winnerId;
    const loserId = challenge.result.loserId;
    
    // Update winner's friend record
    const winnerFriend = this.getFriend(winnerId, loserId);
    if (winnerFriend && winnerFriend.stats) {
      winnerFriend.stats.headToHeadRecord.wins++;
      winnerFriend.stats.totalPointsFor += challenge.result.winnerScore;
      winnerFriend.stats.totalPointsAgainst += challenge.result.loserScore;
      winnerFriend.stats.lastMatchup = new Date();
      
      if (winnerFriend.stats.currentStreak.type === 'W') {
        winnerFriend.stats.currentStreak.count++;
      } else {
        winnerFriend.stats.currentStreak = { type: 'W', count: 1 };
      }
    }
    
    // Update loser's friend record
    const loserFriend = this.getFriend(loserId, winnerId);
    if (loserFriend && loserFriend.stats) {
      loserFriend.stats.headToHeadRecord.losses++;
      loserFriend.stats.totalPointsFor += challenge.result.loserScore;
      loserFriend.stats.totalPointsAgainst += challenge.result.winnerScore;
      loserFriend.stats.lastMatchup = new Date();
      
      if (loserFriend.stats.currentStreak.type === 'L') {
        loserFriend.stats.currentStreak.count++;
      } else {
        loserFriend.stats.currentStreak = { type: 'L', count: 1 };
      }
    }
  }
  
  private startActivityMonitoring(): void {
    // Monitor friend activities every minute
    setInterval(() => {
      this.generateMockActivities();
    }, 60 * 1000);
  }
  
  private generateMockActivities(): void {
    // In real implementation, would monitor actual user actions
    const activityTypes: FriendActivity['type'][] = [
      'achievement', 'trade', 'lineup', 'win', 'milestone'
    ];
    
    const mockActivity: FriendActivity = {
      id: `activity_${Date.now()}`,
      friendId: 'friend1',
      type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
      description: 'Just set their optimal lineup using AI recommendations',
      timestamp: new Date()
    };
    
    if (!this.friendActivities.has(mockActivity.friendId)) {
      this.friendActivities.set(mockActivity.friendId, []);
    }
    
    const activities = this.friendActivities.get(mockActivity.friendId)!;
    activities.unshift(mockActivity);
    
    // Keep only recent activities
    if (activities.length > 100) {
      this.friendActivities.set(mockActivity.friendId, activities.slice(0, 100));
    }
  }
}

// Export singleton instance
export const friendSystem = FriendSystem.getInstance();