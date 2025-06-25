/**
 * Head-to-Head Battle System
 * Real-time fantasy battles, tournaments, and competitive modes
 */

import { friendSystem } from './friend-system';

export interface Battle {
  id: string;
  type: 'quick' | 'tournament' | 'ladder' | 'custom';
  format: 'classic' | 'draft' | 'best_ball' | 'survivor';
  participants: BattleParticipant[];
  status: 'waiting' | 'drafting' | 'active' | 'completed';
  settings: BattleSettings;
  rounds: BattleRound[];
  currentRound?: number;
  winner?: string;
  prizes: BattlePrize[];
  chatEnabled: boolean;
  spectators: string[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface BattleParticipant {
  userId: string;
  username: string;
  avatar?: string;
  level?: number;
  roster?: BattleRoster;
  score: number;
  rank?: number;
  eliminated?: boolean;
  powerUpsUsed: string[];
  stats: {
    roundsWon: number;
    perfectLineups: number;
    comebacks: number;
    highestScore: number;
  };
}

export interface BattleRoster {
  players: BattlePlayer[];
  captain?: string; // Player ID with 2x multiplier
  benchPlayers: BattlePlayer[];
  salary: number;
  formation: string; // e.g., "3-4-3", "4-4-2"
}

export interface BattlePlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  salary: number;
  projectedPoints: number;
  actualPoints?: number;
  multiplier: number; // Captain = 2x, Vice = 1.5x
  status: 'active' | 'benched' | 'injured' | 'bye';
}

export interface BattleSettings {
  entryFee?: number;
  salaryCap?: number;
  scoringSystem: 'standard' | 'ppr' | 'custom';
  rosterRequirements: {
    qb: number;
    rb: number;
    wr: number;
    te: number;
    flex: number;
    dst: number;
    k: number;
    bench: number;
  };
  timeLimit?: number; // Minutes per pick in draft
  powerUpsEnabled: boolean;
  tradeDeadline?: Date;
}

export interface BattleRound {
  roundNumber: number;
  startDate: Date;
  endDate: Date;
  matchups: Matchup[];
  leaderboard: RoundLeaderboard;
  events: BattleEvent[];
}

export interface Matchup {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  winnerId?: string;
  margin?: number;
  highlights: string[];
}

export interface RoundLeaderboard {
  entries: Array<{
    userId: string;
    score: number;
    rank: number;
    movement: number; // Position change from last round
  }>;
  averageScore: number;
  highestScore: number;
}

export interface BattleEvent {
  type: 'touchdown' | 'big_play' | 'injury' | 'milestone' | 'comeback' | 'upset';
  timestamp: Date;
  playerId?: string;
  description: string;
  fantasyImpact: number;
  affectedUsers: string[];
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'boost' | 'shield' | 'swap' | 'wildcard';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effect: PowerUpEffect;
  cooldown: number; // Rounds before reuse
  cost?: number; // Gems or points
}

export interface PowerUpEffect {
  target: 'self' | 'opponent' | 'player' | 'position';
  duration: number; // Rounds
  multiplier?: number;
  protection?: boolean;
  swapLimit?: number;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  size: number; // Number of participants
  currentBracket: TournamentBracket;
  prizes: TournamentPrize[];
  entryRequirements: {
    minLevel?: number;
    qualificationPoints?: number;
    inviteOnly?: boolean;
  };
  schedule: TournamentSchedule;
  status: 'registration' | 'active' | 'completed';
}

export interface TournamentBracket {
  rounds: Array<{
    roundNumber: number;
    matches: Array<{
      matchId: string;
      player1: { id: string; name: string; seed: number };
      player2: { id: string; name: string; seed: number };
      winner?: string;
      score?: { player1: number; player2: number };
    }>;
  }>;
}

export interface TournamentPrize {
  position: number | string; // 1, 2, 3, or "top8", "top16"
  rewards: {
    gems?: number;
    badges?: string[];
    title?: string;
    items?: string[];
  };
}

export interface TournamentSchedule {
  registrationStart: Date;
  registrationEnd: Date;
  rounds: Array<{
    round: number;
    startDate: Date;
    endDate: Date;
  }>;
}

export interface BattlePrize {
  type: 'gems' | 'xp' | 'badge' | 'title' | 'item';
  amount?: number;
  itemId?: string;
  description: string;
}

export interface LadderRank {
  userId: string;
  username: string;
  rank: number;
  rating: number; // ELO-style rating
  wins: number;
  losses: number;
  winRate: number;
  streak: { type: 'W' | 'L'; count: number };
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';
  nextTierProgress: number; // 0-100%
}

export class HeadToHeadBattleSystem {
  private static instance: HeadToHeadBattleSystem;
  private activeBattles: Map<string, Battle> = new Map();
  private tournaments: Map<string, Tournament> = new Map();
  private ladderRankings: Map<string, LadderRank> = new Map();
  private battleQueue: Map<string, QueueEntry> = new Map();
  
  // Power-ups catalog
  private readonly powerUps: Map<string, PowerUp> = new Map([
    ['boost_captain', {
      id: 'boost_captain',
      name: 'Captain Boost',
      description: 'Triple points for your captain this round',
      icon: '⚡',
      type: 'boost',
      rarity: 'rare',
      effect: { target: 'player', duration: 1, multiplier: 3 },
      cooldown: 3
    }],
    ['shield_injuries', {
      id: 'shield_injuries',
      name: 'Injury Shield',
      description: 'Protect your team from injury impacts for 2 rounds',
      icon: '🛡️',
      type: 'shield',
      rarity: 'epic',
      effect: { target: 'self', duration: 2, protection: true },
      cooldown: 5
    }],
    ['wildcard_sub', {
      id: 'wildcard_sub',
      name: 'Wildcard Substitution',
      description: 'Make unlimited substitutions this round',
      icon: '🔄',
      type: 'wildcard',
      rarity: 'legendary',
      effect: { target: 'self', duration: 1, swapLimit: 99 },
      cooldown: 7
    }],
    ['position_boost', {
      id: 'position_boost',
      name: 'Position Power',
      description: 'All RBs get 1.5x points this round',
      icon: '💪',
      type: 'boost',
      rarity: 'common',
      effect: { target: 'position', duration: 1, multiplier: 1.5 },
      cooldown: 2
    }]
  ]);
  
  // ELO calculation constants
  private readonly ELO_K_FACTOR = 32;
  private readonly ELO_INITIAL_RATING = 1200;
  
  private constructor() {
    this.initializeLadder();
    this.startMatchmaking();
  }
  
  static getInstance(): HeadToHeadBattleSystem {
    if (!HeadToHeadBattleSystem.instance) {
      HeadToHeadBattleSystem.instance = new HeadToHeadBattleSystem();
    }
    return HeadToHeadBattleSystem.instance;
  }
  
  /**
   * Create a new battle
   */
  async createBattle(
    creatorId: string,
    options: {
      type: Battle['type'];
      format: Battle['format'];
      settings?: Partial<BattleSettings>;
      inviteIds?: string[];
      isPublic?: boolean;
    }
  ): Promise<Battle> {
    const battle: Battle = {
      id: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: options.type,
      format: options.format,
      participants: [{
        userId: creatorId,
        username: 'Creator', // Would get from user service
        score: 0,
        powerUpsUsed: [],
        stats: { roundsWon: 0, perfectLineups: 0, comebacks: 0, highestScore: 0 }
      }],
      status: 'waiting',
      settings: {
        scoringSystem: 'standard',
        rosterRequirements: {
          qb: 1, rb: 2, wr: 3, te: 1, flex: 1, dst: 1, k: 1, bench: 6
        },
        powerUpsEnabled: true,
        ...options.settings
      },
      rounds: [],
      prizes: this.determinePrizes(options.type),
      chatEnabled: true,
      spectators: [],
      createdAt: new Date()
    };
    
    this.activeBattles.set(battle.id, battle);
    
    // Send invites if specified
    if (options.inviteIds) {
      for (const inviteId of options.inviteIds) {
        await this.sendBattleInvite(battle.id, creatorId, inviteId);
      }
    }
    
    // Add to public queue if public
    if (options.isPublic) {
      await this.addToMatchmaking(creatorId, battle);
    }
    
    return battle;
  }
  
  /**
   * Join a battle
   */
  async joinBattle(battleId: string, userId: string): Promise<void> {
    const battle = this.activeBattles.get(battleId);
    if (!battle) throw new Error('Battle not found');
    
    if (battle.status !== 'waiting') {
      throw new Error('Battle already started');
    }
    
    battle.participants.push({
      userId,
      username: `Player${battle.participants.length + 1}`,
      score: 0,
      powerUpsUsed: [],
      stats: { roundsWon: 0, perfectLineups: 0, comebacks: 0, highestScore: 0 }
    });
    
    // Start if full
    if (this.isBattleFull(battle)) {
      await this.startBattle(battleId);
    }
  }
  
  /**
   * Start a battle
   */
  async startBattle(battleId: string): Promise<void> {
    const battle = this.activeBattles.get(battleId);
    if (!battle) throw new Error('Battle not found');
    
    battle.status = battle.format === 'draft' ? 'drafting' : 'active';
    battle.startedAt = new Date();
    
    if (battle.format === 'draft') {
      await this.initializeDraft(battle);
    } else {
      await this.initializeRosters(battle);
    }
    
    // Create first round
    battle.currentRound = 1;
    battle.rounds.push(this.createBattleRound(battle, 1));
    
    // Notify participants
    await this.notifyBattleStart(battle);
  }
  
  /**
   * Use a power-up
   */
  async usePowerUp(
    battleId: string,
    userId: string,
    powerUpId: string,
    target?: string
  ): Promise<void> {
    const battle = this.activeBattles.get(battleId);
    if (!battle || battle.status !== 'active') {
      throw new Error('Battle not active');
    }
    
    const participant = battle.participants.find(p => p.userId === userId);
    if (!participant) throw new Error('Not a participant');
    
    const powerUp = this.powerUps.get(powerUpId);
    if (!powerUp) throw new Error('Invalid power-up');
    
    // Check cooldown
    const lastUsed = participant.powerUpsUsed.filter(p => p === powerUpId).length;
    if (lastUsed > 0 && battle.currentRound! - lastUsed < powerUp.cooldown) {
      throw new Error('Power-up on cooldown');
    }
    
    // Apply effect
    await this.applyPowerUpEffect(battle, userId, powerUp, target);
    participant.powerUpsUsed.push(powerUpId);
    
    // Create event
    const event: BattleEvent = {
      type: 'milestone',
      timestamp: new Date(),
      description: `${participant.username} used ${powerUp.name}!`,
      fantasyImpact: 0,
      affectedUsers: [userId]
    };
    
    if (battle.rounds[battle.currentRound! - 1]) {
      battle.rounds[battle.currentRound! - 1].events.push(event);
    }
  }
  
  /**
   * Update battle scores
   */
  async updateBattleScores(battleId: string): Promise<void> {
    const battle = this.activeBattles.get(battleId);
    if (!battle || battle.status !== 'active') return;
    
    // Calculate scores for each participant
    for (const participant of battle.participants) {
      if (!participant.roster) continue;
      
      let totalScore = 0;
      for (const player of participant.roster.players) {
        if (player.status === 'active') {
          const points = await this.getPlayerPoints(player.id);
          player.actualPoints = points * player.multiplier;
          totalScore += player.actualPoints;
        }
      }
      
      participant.score = totalScore;
      participant.stats.highestScore = Math.max(
        participant.stats.highestScore,
        totalScore
      );
    }
    
    // Update round leaderboard
    this.updateRoundLeaderboard(battle);
    
    // Check for battle events
    await this.checkForBattleEvents(battle);
    
    // Check if round/battle is complete
    if (await this.isRoundComplete(battle)) {
      await this.completeRound(battle);
    }
  }
  
  /**
   * Create tournament
   */
  async createTournament(
    name: string,
    format: Tournament['format'],
    size: number,
    prizes: TournamentPrize[]
  ): Promise<Tournament> {
    const tournament: Tournament = {
      id: `tournament_${Date.now()}`,
      name,
      description: `${size}-player ${format} tournament`,
      format,
      size,
      currentBracket: { rounds: [] },
      prizes,
      entryRequirements: {},
      schedule: this.generateTournamentSchedule(size, format),
      status: 'registration'
    };
    
    this.tournaments.set(tournament.id, tournament);
    return tournament;
  }
  
  /**
   * Join tournament
   */
  async joinTournament(
    tournamentId: string,
    userId: string
  ): Promise<void> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    
    if (tournament.status !== 'registration') {
      throw new Error('Registration closed');
    }
    
    // Check requirements
    const userRank = await this.getLadderRank(userId);
    if (tournament.entryRequirements.minLevel && 
        (!userRank || userRank.rating < tournament.entryRequirements.minLevel)) {
      throw new Error('Does not meet entry requirements');
    }
    
    // Add to tournament
    // In real implementation, track registrations
    console.log(`User ${userId} joined tournament ${tournamentId}`);
  }
  
  /**
   * Get ladder rank
   */
  async getLadderRank(userId: string): Promise<LadderRank | null> {
    return this.ladderRankings.get(userId) || null;
  }
  
  /**
   * Update ladder rating
   */
  async updateLadderRating(
    winnerId: string,
    loserId: string,
    winnerScore: number,
    loserScore: number
  ): Promise<void> {
    const winnerRank = this.ladderRankings.get(winnerId) || this.createNewLadderRank(winnerId);
    const loserRank = this.ladderRankings.get(loserId) || this.createNewLadderRank(loserId);
    
    // Calculate ELO change
    const expectedWin = 1 / (1 + Math.pow(10, (loserRank.rating - winnerRank.rating) / 400));
    const scoreDiff = Math.min(Math.abs(winnerScore - loserScore) / 10, 3); // Score difference factor
    const kFactor = this.ELO_K_FACTOR * scoreDiff;
    
    const ratingChange = Math.round(kFactor * (1 - expectedWin));
    
    // Update ratings
    winnerRank.rating += ratingChange;
    winnerRank.wins++;
    winnerRank.winRate = winnerRank.wins / (winnerRank.wins + winnerRank.losses);
    
    loserRank.rating = Math.max(800, loserRank.rating - ratingChange); // Min rating 800
    loserRank.losses++;
    loserRank.winRate = loserRank.wins / (loserRank.wins + loserRank.losses);
    
    // Update streaks
    if (winnerRank.streak.type === 'W') {
      winnerRank.streak.count++;
    } else {
      winnerRank.streak = { type: 'W', count: 1 };
    }
    
    if (loserRank.streak.type === 'L') {
      loserRank.streak.count++;
    } else {
      loserRank.streak = { type: 'L', count: 1 };
    }
    
    // Update tiers
    this.updateLadderTier(winnerRank);
    this.updateLadderTier(loserRank);
    
    // Save updates
    this.ladderRankings.set(winnerId, winnerRank);
    this.ladderRankings.set(loserId, loserRank);
  }
  
  /**
   * Get battle history
   */
  async getBattleHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      type?: Battle['type'];
    } = {}
  ): Promise<Battle[]> {
    const history: Battle[] = [];
    
    for (const [id, battle] of this.activeBattles) {
      if (battle.participants.some(p => p.userId === userId) &&
          battle.status === 'completed') {
        if (!options.type || battle.type === options.type) {
          history.push(battle);
        }
      }
    }
    
    // Sort by completion date
    history.sort((a, b) => 
      (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
    );
    
    // Apply pagination
    const start = options.offset || 0;
    const limit = options.limit || 10;
    
    return history.slice(start, start + limit);
  }
  
  // Private helper methods
  
  private interface QueueEntry {
    userId: string;
    battlePreferences: {
      type: Battle['type'];
      format: Battle['format'];
      ratingRange: { min: number; max: number };
    };
    queuedAt: Date;
  }
  
  private initializeLadder(): void {
    // Create initial ladder with mock data
    const mockUsers = ['user1', 'user2', 'user3', 'user4', 'user5'];
    
    for (let i = 0; i < mockUsers.length; i++) {
      const rank = this.createNewLadderRank(mockUsers[i]);
      rank.rating = 1500 - (i * 100);
      rank.wins = Math.floor(Math.random() * 50);
      rank.losses = Math.floor(Math.random() * 30);
      rank.winRate = rank.wins / (rank.wins + rank.losses);
      this.updateLadderTier(rank);
      this.ladderRankings.set(mockUsers[i], rank);
    }
  }
  
  private createNewLadderRank(userId: string): LadderRank {
    return {
      userId,
      username: `Player_${userId}`,
      rank: 0,
      rating: this.ELO_INITIAL_RATING,
      wins: 0,
      losses: 0,
      winRate: 0,
      streak: { type: 'W', count: 0 },
      tier: 'bronze',
      nextTierProgress: 0
    };
  }
  
  private updateLadderTier(rank: LadderRank): void {
    const tiers = [
      { name: 'bronze' as const, minRating: 0 },
      { name: 'silver' as const, minRating: 1200 },
      { name: 'gold' as const, minRating: 1400 },
      { name: 'platinum' as const, minRating: 1600 },
      { name: 'diamond' as const, minRating: 1800 },
      { name: 'master' as const, minRating: 2000 }
    ];
    
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (rank.rating >= tiers[i].minRating) {
        rank.tier = tiers[i].name;
        
        // Calculate progress to next tier
        if (i < tiers.length - 1) {
          const currentMin = tiers[i].minRating;
          const nextMin = tiers[i + 1].minRating;
          rank.nextTierProgress = ((rank.rating - currentMin) / (nextMin - currentMin)) * 100;
        } else {
          rank.nextTierProgress = 100;
        }
        break;
      }
    }
  }
  
  private determinePrizes(type: Battle['type']): BattlePrize[] {
    switch (type) {
      case 'quick':
        return [
          { type: 'gems', amount: 10, description: 'Winner gets 10 gems' },
          { type: 'xp', amount: 100, description: 'All participants get 100 XP' }
        ];
      case 'tournament':
        return [
          { type: 'gems', amount: 100, description: '1st place: 100 gems' },
          { type: 'badge', itemId: 'tournament_winner', description: 'Tournament Winner badge' },
          { type: 'title', itemId: 'champion', description: 'Champion title' }
        ];
      case 'ladder':
        return [
          { type: 'gems', amount: 25, description: 'Ladder win: 25 gems' },
          { type: 'xp', amount: 200, description: 'Ladder XP bonus' }
        ];
      default:
        return [{ type: 'xp', amount: 50, description: 'Participation XP' }];
    }
  }
  
  private isBattleFull(battle: Battle): boolean {
    const maxParticipants = battle.type === 'quick' ? 2 : 
                           battle.type === 'tournament' ? 8 : 4;
    return battle.participants.length >= maxParticipants;
  }
  
  private async initializeDraft(battle: Battle): Promise<void> {
    // Initialize draft order and player pool
    // In real implementation, set up draft room
    console.log('Initializing draft for battle', battle.id);
  }
  
  private async initializeRosters(battle: Battle): Promise<void> {
    // Set up default rosters or salary cap teams
    for (const participant of battle.participants) {
      participant.roster = {
        players: [],
        benchPlayers: [],
        salary: 0,
        formation: '3-4-3'
      };
    }
  }
  
  private createBattleRound(battle: Battle, roundNumber: number): BattleRound {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    return {
      roundNumber,
      startDate,
      endDate,
      matchups: this.generateMatchups(battle),
      leaderboard: {
        entries: [],
        averageScore: 0,
        highestScore: 0
      },
      events: []
    };
  }
  
  private generateMatchups(battle: Battle): Matchup[] {
    const matchups: Matchup[] = [];
    
    if (battle.type === 'quick' && battle.participants.length === 2) {
      matchups.push({
        id: `matchup_${Date.now()}`,
        player1Id: battle.participants[0].userId,
        player2Id: battle.participants[1].userId,
        player1Score: 0,
        player2Score: 0,
        highlights: []
      });
    }
    // Add more matchup generation logic for tournaments, etc.
    
    return matchups;
  }
  
  private async sendBattleInvite(
    battleId: string,
    fromUserId: string,
    toUserId: string
  ): Promise<void> {
    // Would integrate with notification system
    console.log(`Battle invite sent from ${fromUserId} to ${toUserId}`);
  }
  
  private async addToMatchmaking(userId: string, battle: Battle): Promise<void> {
    // Add to matchmaking queue
    const entry: QueueEntry = {
      userId,
      battlePreferences: {
        type: battle.type,
        format: battle.format,
        ratingRange: { min: -200, max: 200 } // Within 200 rating points
      },
      queuedAt: new Date()
    };
    
    this.battleQueue.set(userId, entry);
  }
  
  private startMatchmaking(): void {
    // Run matchmaking every 10 seconds
    setInterval(() => {
      this.processMatchmakingQueue();
    }, 10 * 1000);
  }
  
  private async processMatchmakingQueue(): Promise<void> {
    const entries = Array.from(this.battleQueue.values());
    
    for (let i = 0; i < entries.length - 1; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        if (this.isGoodMatch(entries[i], entries[j])) {
          // Create battle and remove from queue
          await this.createMatchedBattle(entries[i], entries[j]);
          this.battleQueue.delete(entries[i].userId);
          this.battleQueue.delete(entries[j].userId);
          break;
        }
      }
    }
  }
  
  private isGoodMatch(entry1: QueueEntry, entry2: QueueEntry): boolean {
    // Check preferences match
    if (entry1.battlePreferences.type !== entry2.battlePreferences.type) return false;
    if (entry1.battlePreferences.format !== entry2.battlePreferences.format) return false;
    
    // Check rating range
    const rank1 = this.ladderRankings.get(entry1.userId);
    const rank2 = this.ladderRankings.get(entry2.userId);
    
    if (rank1 && rank2) {
      const ratingDiff = Math.abs(rank1.rating - rank2.rating);
      return ratingDiff <= 200;
    }
    
    return true;
  }
  
  private async createMatchedBattle(
    entry1: QueueEntry,
    entry2: QueueEntry
  ): Promise<void> {
    const battle = await this.createBattle(entry1.userId, {
      type: entry1.battlePreferences.type,
      format: entry1.battlePreferences.format,
      isPublic: false
    });
    
    await this.joinBattle(battle.id, entry2.userId);
  }
  
  private async notifyBattleStart(battle: Battle): Promise<void> {
    // Send notifications to all participants
    for (const participant of battle.participants) {
      console.log(`Battle ${battle.id} started! Notifying ${participant.username}`);
    }
  }
  
  private async applyPowerUpEffect(
    battle: Battle,
    userId: string,
    powerUp: PowerUp,
    target?: string
  ): Promise<void> {
    // Apply power-up effects based on type
    console.log(`Applying ${powerUp.name} for user ${userId}`);
    // Implementation would modify battle state
  }
  
  private async getPlayerPoints(playerId: string): Promise<number> {
    // In real implementation, get from live data
    return Math.random() * 30;
  }
  
  private updateRoundLeaderboard(battle: Battle): void {
    const round = battle.rounds[battle.currentRound! - 1];
    if (!round) return;
    
    // Update leaderboard
    round.leaderboard.entries = battle.participants
      .map((p, index) => ({
        userId: p.userId,
        score: p.score,
        rank: 0,
        movement: 0
      }))
      .sort((a, b) => b.score - a.score);
    
    // Assign ranks
    round.leaderboard.entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    // Calculate stats
    const scores = round.leaderboard.entries.map(e => e.score);
    round.leaderboard.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    round.leaderboard.highestScore = Math.max(...scores);
  }
  
  private async checkForBattleEvents(battle: Battle): Promise<void> {
    const round = battle.rounds[battle.currentRound! - 1];
    if (!round) return;
    
    // Check for milestones, upsets, etc.
    for (const participant of battle.participants) {
      if (participant.score > 150) {
        round.events.push({
          type: 'milestone',
          timestamp: new Date(),
          description: `${participant.username} scored 150+ points!`,
          fantasyImpact: 0,
          affectedUsers: [participant.userId]
        });
      }
    }
  }
  
  private async isRoundComplete(battle: Battle): Promise<boolean> {
    const round = battle.rounds[battle.currentRound! - 1];
    return round && new Date() > round.endDate;
  }
  
  private async completeRound(battle: Battle): Promise<void> {
    const round = battle.rounds[battle.currentRound! - 1];
    
    // Update matchups
    for (const matchup of round.matchups) {
      const p1 = battle.participants.find(p => p.userId === matchup.player1Id);
      const p2 = battle.participants.find(p => p.userId === matchup.player2Id);
      
      if (p1 && p2) {
        matchup.player1Score = p1.score;
        matchup.player2Score = p2.score;
        matchup.winnerId = p1.score > p2.score ? p1.userId : p2.userId;
        matchup.margin = Math.abs(p1.score - p2.score);
        
        // Update participant stats
        if (matchup.winnerId === p1.userId) {
          p1.stats.roundsWon++;
        } else {
          p2.stats.roundsWon++;
        }
      }
    }
    
    // Check if battle is complete
    if (battle.currentRound! >= this.getTotalRounds(battle)) {
      await this.completeBattle(battle);
    } else {
      // Start next round
      battle.currentRound!++;
      battle.rounds.push(this.createBattleRound(battle, battle.currentRound!));
    }
  }
  
  private getTotalRounds(battle: Battle): number {
    switch (battle.type) {
      case 'quick': return 1;
      case 'tournament': return Math.ceil(Math.log2(battle.participants.length));
      case 'ladder': return 1;
      default: return 3;
    }
  }
  
  private async completeBattle(battle: Battle): Promise<void> {
    battle.status = 'completed';
    battle.completedAt = new Date();
    
    // Determine winner
    const finalStandings = battle.participants
      .sort((a, b) => b.score - a.score);
    
    battle.winner = finalStandings[0].userId;
    
    // Award prizes
    for (let i = 0; i < finalStandings.length; i++) {
      const participant = finalStandings[i];
      participant.rank = i + 1;
      
      // Award prizes based on rank
      if (i === 0) {
        // Winner prizes
        console.log(`Awarding prizes to winner ${participant.userId}`);
      }
    }
    
    // Update ladder ratings for competitive battles
    if (battle.type === 'ladder' && finalStandings.length === 2) {
      await this.updateLadderRating(
        finalStandings[0].userId,
        finalStandings[1].userId,
        finalStandings[0].score,
        finalStandings[1].score
      );
    }
    
    // Update friend stats
    for (let i = 0; i < battle.participants.length - 1; i++) {
      for (let j = i + 1; j < battle.participants.length; j++) {
        await friendSystem.updateChallengeProgress(
          `battle_${battle.id}`,
          battle.participants[i].userId,
          'h2h_battle',
          1
        );
      }
    }
  }
  
  private generateTournamentSchedule(
    size: number,
    format: Tournament['format']
  ): TournamentSchedule {
    const rounds = Math.ceil(Math.log2(size));
    const schedule: TournamentSchedule = {
      registrationStart: new Date(),
      registrationEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      rounds: []
    };
    
    let startDate = new Date(schedule.registrationEnd);
    startDate.setDate(startDate.getDate() + 1);
    
    for (let i = 0; i < rounds; i++) {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
      
      schedule.rounds.push({
        round: i + 1,
        startDate: new Date(startDate),
        endDate
      });
      
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() + 1);
    }
    
    return schedule;
  }
}

// Export singleton instance
export const battleSystem = HeadToHeadBattleSystem.getInstance();