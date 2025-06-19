import { EventEmitter } from 'events';

export interface DraftPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  adp: number; // Average Draft Position
  projectedPoints: number;
  positionRank: number;
  overallRank: number;
  tier: number;
  byeWeek: number;
  isInjured: boolean;
  injuryStatus?: string;
  rookieYear?: number;
}

export interface DraftParticipant {
  id: string;
  userId: string;
  userName: string;
  draftPosition: number;
  teamName?: string;
  isReady: boolean;
  isAutoPick: boolean;
  timeouts: number;
  totalSpent: number;
  avatar?: string;
  isOnline: boolean;
}

export interface DraftPick {
  id: string;
  draftId: string;
  participantId: string;
  userId: string;
  playerId: string;
  playerName: string;
  playerPosition: string;
  playerTeam: string;
  round: number;
  pick: number;
  pickInRound: number;
  auctionPrice?: number;
  isKeeper: boolean;
  pickTime: Date;
  timeToMake?: number;
  isAutoPick: boolean;
}

export interface Draft {
  id: string;
  creatorId: string;
  leagueId?: string;
  name: string;
  description?: string;
  sport: string;
  draftType: DraftType;
  draftOrder: DraftOrder;
  totalRounds: number;
  timePerPick: number;
  isAuction: boolean;
  auctionBudget?: number;
  isSnakeDraft: boolean;
  isMockDraft: boolean;
  isPublic: boolean;
  maxParticipants: number;
  scheduledStart?: Date;
  actualStart?: Date;
  endedAt?: Date;
  status: DraftStatus;
  currentRound: number;
  currentPick: number;
  currentPickerId?: string;
  settings: any;
  participants: DraftParticipant[];
  picks: DraftPick[];
  availablePlayers: DraftPlayer[];
}

export interface MockDraftResult {
  id: string;
  userId: string;
  sport: string;
  draftType: DraftType;
  teamCount: number;
  rounds: number;
  userPosition: number;
  results: any;
  userTeam: DraftPlayer[];
  aiAnalysis: {
    grade: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  completedAt: Date;
}

export enum DraftType {
  STANDARD = 'STANDARD',
  PPR = 'PPR',
  HALF_PPR = 'HALF_PPR',
  SUPERFLEX = 'SUPERFLEX',
  DYNASTY = 'DYNASTY',
  KEEPER = 'KEEPER',
  IDP = 'IDP',
  BEST_BALL = 'BEST_BALL'
}

export enum DraftOrder {
  STANDARD = 'STANDARD',
  SNAKE = 'SNAKE',
  LINEAR = 'LINEAR',
  THIRD_ROUND_REVERSAL = 'THIRD_ROUND_REVERSAL'
}

export enum DraftStatus {
  SCHEDULED = 'SCHEDULED',
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export class DraftService extends EventEmitter {
  private drafts: Map<string, Draft> = new Map();
  private players: Map<string, DraftPlayer[]> = new Map();
  private draftTimers: Map<string, NodeJS.Timeout> = new Map();
  private mockDraftResults: Map<string, MockDraftResult[]> = new Map();

  constructor() {
    super();
    this.initializeMockData();
  }

  // Draft Management
  async createDraft(draftData: Omit<Draft, 'id' | 'participants' | 'picks' | 'availablePlayers'>): Promise<Draft> {
    const draft: Draft = {
      ...draftData,
      id: `draft_${Date.now()}`,
      participants: [],
      picks: [],
      availablePlayers: this.players.get(draftData.sport) || []
    };

    this.drafts.set(draft.id, draft);
    this.emit('draftCreated', draft);
    return draft;
  }

  async getDraft(draftId: string): Promise<Draft | null> {
    return this.drafts.get(draftId) || null;
  }

  async getDrafts(filters?: {
    sport?: string;
    draftType?: DraftType;
    status?: DraftStatus;
    isPublic?: boolean;
    isMockDraft?: boolean;
  }): Promise<Draft[]> {
    let drafts = Array.from(this.drafts.values());

    if (filters) {
      drafts = drafts.filter(draft => {
        if (filters.sport && draft.sport !== filters.sport) return false;
        if (filters.draftType && draft.draftType !== filters.draftType) return false;
        if (filters.status && draft.status !== filters.status) return false;
        if (filters.isPublic !== undefined && draft.isPublic !== filters.isPublic) return false;
        if (filters.isMockDraft !== undefined && draft.isMockDraft !== filters.isMockDraft) return false;
        return true;
      });
    }

    return drafts.sort((a, b) => {
      if (a.scheduledStart && b.scheduledStart) {
        return a.scheduledStart.getTime() - b.scheduledStart.getTime();
      }
      return a.name.localeCompare(b.name);
    });
  }

  // Participant Management
  async joinDraft(draftId: string, userId: string, teamName?: string): Promise<DraftParticipant> {
    const draft = this.drafts.get(draftId);
    if (!draft) throw new Error('Draft not found');

    if (draft.participants.length >= draft.maxParticipants) {
      throw new Error('Draft is full');
    }

    if (draft.status !== DraftStatus.SCHEDULED && draft.status !== DraftStatus.WAITING_FOR_PLAYERS) {
      throw new Error('Cannot join draft that has already started');
    }

    const existingParticipant = draft.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      throw new Error('User already in this draft');
    }

    const participant: DraftParticipant = {
      id: `participant_${Date.now()}`,
      userId,
      userName: `User_${userId.slice(-4)}`, // Mock username
      draftPosition: draft.participants.length + 1,
      teamName,
      isReady: false,
      isAutoPick: false,
      timeouts: 3,
      totalSpent: 0,
      isOnline: true
    };

    draft.participants.push(participant);
    this.drafts.set(draftId, draft);

    this.emit('participantJoined', { draft, participant });
    return participant;
  }

  async leaveDraft(draftId: string, userId: string): Promise<void> {
    const draft = this.drafts.get(draftId);
    if (!draft) throw new Error('Draft not found');

    if (draft.status === DraftStatus.IN_PROGRESS) {
      throw new Error('Cannot leave draft in progress');
    }

    draft.participants = draft.participants.filter(p => p.userId !== userId);
    
    // Reorder draft positions
    draft.participants.forEach((participant, index) => {
      participant.draftPosition = index + 1;
    });

    this.drafts.set(draftId, draft);
    this.emit('participantLeft', { draft, userId });
  }

  async setParticipantReady(draftId: string, userId: string, isReady: boolean): Promise<void> {
    const draft = this.drafts.get(draftId);
    if (!draft) throw new Error('Draft not found');

    const participant = draft.participants.find(p => p.userId === userId);
    if (!participant) throw new Error('Participant not found');

    participant.isReady = isReady;
    this.drafts.set(draftId, draft);

    // Check if all participants are ready
    const allReady = draft.participants.every(p => p.isReady);
    if (allReady && draft.participants.length >= 2) {
      await this.startDraft(draftId);
    }

    this.emit('participantReadyChanged', { draft, participant, isReady });
  }

  // Draft Flow Management
  async startDraft(draftId: string): Promise<void> {
    const draft = this.drafts.get(draftId);
    if (!draft) throw new Error('Draft not found');

    if (draft.status !== DraftStatus.SCHEDULED && draft.status !== DraftStatus.WAITING_FOR_PLAYERS) {
      throw new Error('Draft cannot be started');
    }

    draft.status = DraftStatus.IN_PROGRESS;
    draft.actualStart = new Date();
    draft.currentRound = 1;
    draft.currentPick = 1;
    draft.currentPickerId = this.getCurrentPicker(draft).userId;

    this.drafts.set(draftId, draft);
    this.startPickTimer(draftId);
    
    this.emit('draftStarted', draft);
  }

  async makePick(draftId: string, userId: string, playerId: string, auctionPrice?: number): Promise<DraftPick> {
    const draft = this.drafts.get(draftId);
    if (!draft) throw new Error('Draft not found');

    if (draft.status !== DraftStatus.IN_PROGRESS) {
      throw new Error('Draft is not in progress');
    }

    const currentPicker = this.getCurrentPicker(draft);
    if (currentPicker.userId !== userId) {
      throw new Error('Not your turn to pick');
    }

    const player = draft.availablePlayers.find(p => p.id === playerId);
    if (!player) throw new Error('Player not available');

    // Validate auction price if auction draft
    if (draft.isAuction && auctionPrice) {
      if (auctionPrice > (currentPicker.totalSpent + (draft.auctionBudget || 200))) {
        throw new Error('Bid exceeds available budget');
      }
    }

    const pick: DraftPick = {
      id: `pick_${Date.now()}`,
      draftId,
      participantId: currentPicker.id,
      userId,
      playerId,
      playerName: player.name,
      playerPosition: player.position,
      playerTeam: player.team,
      round: draft.currentRound,
      pick: draft.picks.length + 1,
      pickInRound: this.getPickInRound(draft),
      auctionPrice,
      isKeeper: false,
      pickTime: new Date(),
      isAutoPick: false
    };

    // Remove player from available pool
    draft.availablePlayers = draft.availablePlayers.filter(p => p.id !== playerId);
    draft.picks.push(pick);

    // Update participant auction spending
    if (draft.isAuction && auctionPrice) {
      currentPicker.totalSpent += auctionPrice;
    }

    // Advance to next pick
    this.advanceToNextPick(draft);
    this.drafts.set(draftId, draft);

    // Clear current timer and start new one if draft continues
    this.clearPickTimer(draftId);
    if (draft.status === DraftStatus.IN_PROGRESS) {
      this.startPickTimer(draftId);
    }

    this.emit('pickMade', { draft, pick });
    return pick;
  }

  async makeAutoPick(draftId: string): Promise<DraftPick> {
    const draft = this.drafts.get(draftId);
    if (!draft) throw new Error('Draft not found');

    const currentPicker = this.getCurrentPicker(draft);
    
    // Select best available player by ADP
    const bestAvailable = draft.availablePlayers
      .sort((a, b) => a.adp - b.adp)[0];

    if (!bestAvailable) throw new Error('No players available');

    const pick = await this.makePick(draftId, currentPicker.userId, bestAvailable.id);
    pick.isAutoPick = true;

    this.emit('autoPickMade', { draft, pick });
    return pick;
  }

  // Mock Draft System
  async runMockDraft(userId: string, settings: {
    sport: string;
    draftType: DraftType;
    teamCount: number;
    rounds: number;
    userPosition: number;
  }): Promise<MockDraftResult> {
    const players = this.players.get(settings.sport) || [];
    const draftResults: DraftPick[] = [];
    const userTeam: DraftPlayer[] = [];
    
    // Simulate draft
    for (let round = 1; round <= settings.rounds; round++) {
      for (let pick = 1; pick <= settings.teamCount; pick++) {
        const isUserPick = pick === settings.userPosition;
        let selectedPlayer: DraftPlayer;

        if (isUserPick) {
          // User gets best available by ADP
          selectedPlayer = players
            .filter(p => !draftResults.some(dr => dr.playerId === p.id))
            .sort((a, b) => a.adp - b.adp)[0];
          userTeam.push(selectedPlayer);
        } else {
          // AI picks with some variation
          const available = players
            .filter(p => !draftResults.some(dr => dr.playerId === p.id))
            .sort((a, b) => a.adp - b.adp);
          
          // Add some randomness to AI picks
          const pickIndex = Math.floor(Math.random() * Math.min(5, available.length));
          selectedPlayer = available[pickIndex];
        }

        const mockPick: DraftPick = {
          id: `mock_pick_${round}_${pick}`,
          draftId: 'mock_draft',
          participantId: `participant_${pick}`,
          userId: isUserPick ? userId : `ai_${pick}`,
          playerId: selectedPlayer.id,
          playerName: selectedPlayer.name,
          playerPosition: selectedPlayer.position,
          playerTeam: selectedPlayer.team,
          round,
          pick: (round - 1) * settings.teamCount + pick,
          pickInRound: pick,
          isKeeper: false,
          pickTime: new Date(),
          isAutoPick: !isUserPick
        };

        draftResults.push(mockPick);
      }
    }

    // Generate AI analysis
    const aiAnalysis = this.generateDraftAnalysis(userTeam, settings.draftType);

    const mockDraftResult: MockDraftResult = {
      id: `mock_${Date.now()}`,
      userId,
      sport: settings.sport,
      draftType: settings.draftType,
      teamCount: settings.teamCount,
      rounds: settings.rounds,
      userPosition: settings.userPosition,
      results: draftResults,
      userTeam,
      aiAnalysis,
      completedAt: new Date()
    };

    // Store result
    const userMockDrafts = this.mockDraftResults.get(userId) || [];
    userMockDrafts.push(mockDraftResult);
    this.mockDraftResults.set(userId, userMockDrafts);

    this.emit('mockDraftCompleted', mockDraftResult);
    return mockDraftResult;
  }

  async getUserMockDrafts(userId: string): Promise<MockDraftResult[]> {
    return this.mockDraftResults.get(userId) || [];
  }

  // Helper Methods
  private getCurrentPicker(draft: Draft): DraftParticipant {
    const pickPosition = this.calculatePickPosition(draft);
    return draft.participants.find(p => p.draftPosition === pickPosition)!;
  }

  private calculatePickPosition(draft: Draft): number {
    if (!draft.isSnakeDraft) {
      return ((draft.currentPick - 1) % draft.participants.length) + 1;
    }

    // Snake draft logic
    const round = draft.currentRound;
    const pickInRound = this.getPickInRound(draft);
    
    if (round % 2 === 1) {
      // Odd rounds go 1, 2, 3, ...
      return pickInRound;
    } else {
      // Even rounds go ..., 3, 2, 1
      return draft.participants.length - pickInRound + 1;
    }
  }

  private getPickInRound(draft: Draft): number {
    return ((draft.currentPick - 1) % draft.participants.length) + 1;
  }

  private advanceToNextPick(draft: Draft): void {
    draft.currentPick++;
    
    if (draft.currentPick > draft.participants.length * draft.totalRounds) {
      // Draft is complete
      draft.status = DraftStatus.COMPLETED;
      draft.endedAt = new Date();
      draft.currentPickerId = undefined;
      this.emit('draftCompleted', draft);
    } else {
      // Update round if necessary
      draft.currentRound = Math.ceil(draft.currentPick / draft.participants.length);
      draft.currentPickerId = this.getCurrentPicker(draft).userId;
    }
  }

  private startPickTimer(draftId: string): void {
    const draft = this.drafts.get(draftId);
    if (!draft || draft.status !== DraftStatus.IN_PROGRESS) return;

    const timer = setTimeout(async () => {
      await this.makeAutoPick(draftId);
    }, draft.timePerPick * 1000);

    this.draftTimers.set(draftId, timer);
  }

  private clearPickTimer(draftId: string): void {
    const timer = this.draftTimers.get(draftId);
    if (timer) {
      clearTimeout(timer);
      this.draftTimers.delete(draftId);
    }
  }

  private generateDraftAnalysis(userTeam: DraftPlayer[], draftType: DraftType): any {
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    const positionCounts = positions.reduce((acc, pos) => {
      acc[pos] = userTeam.filter(p => p.position === pos).length;
      return acc;
    }, {} as Record<string, number>);

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Analyze by position
    if (positionCounts.RB >= 3) strengths.push("Strong RB depth");
    if (positionCounts.RB < 2) weaknesses.push("Weak at RB");
    if (positionCounts.WR >= 4) strengths.push("Excellent WR corps");
    if (positionCounts.WR < 3) weaknesses.push("Need more WR depth");

    // Calculate grade
    let score = 75; // Base score
    if (positionCounts.QB >= 1) score += 5;
    if (positionCounts.RB >= 2) score += 10;
    if (positionCounts.WR >= 3) score += 10;
    if (positionCounts.TE >= 1) score += 5;

    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

    return {
      grade,
      score,
      strengths,
      weaknesses,
      recommendations
    };
  }

  private initializeMockData(): void {
    // Mock player data for football
    const footballPlayers: DraftPlayer[] = [
      {
        id: 'player_1',
        name: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        adp: 1.2,
        projectedPoints: 285.4,
        positionRank: 1,
        overallRank: 1,
        tier: 1,
        byeWeek: 9,
        isInjured: false
      },
      {
        id: 'player_2',
        name: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        adp: 3.8,
        projectedPoints: 312.6,
        positionRank: 1,
        overallRank: 4,
        tier: 1,
        byeWeek: 12,
        isInjured: false
      },
      {
        id: 'player_3',
        name: 'Cooper Kupp',
        position: 'WR',
        team: 'LAR',
        adp: 5.2,
        projectedPoints: 245.8,
        positionRank: 1,
        overallRank: 5,
        tier: 1,
        byeWeek: 6,
        isInjured: false,
        injuryStatus: 'Questionable'
      },
      {
        id: 'player_4',
        name: 'Travis Kelce',
        position: 'TE',
        team: 'KC',
        adp: 8.9,
        projectedPoints: 198.7,
        positionRank: 1,
        overallRank: 9,
        tier: 1,
        byeWeek: 10,
        isInjured: false
      },
      {
        id: 'player_5',
        name: 'Derrick Henry',
        position: 'RB',
        team: 'BAL',
        adp: 12.4,
        projectedPoints: 234.2,
        positionRank: 3,
        overallRank: 12,
        tier: 2,
        byeWeek: 14,
        isInjured: false
      }
    ];

    this.players.set('FOOTBALL', footballPlayers);
  }
}

export const draftService = new DraftService();