import { EventEmitter } from 'events';

export interface Contest {
  id: string;
  name: string;
  description: string;
  sport: string;
  contestType: ContestType;
  entryFee: number;
  totalPrizePool: number;
  maxEntries: number;
  currentEntries: number;
  salaryCap: number;
  startTime: Date;
  endTime: Date;
  status: ContestStatus;
  isPublic: boolean;
  isGuaranteed: boolean;
  prizeStructure: PrizeStructure[];
}

export interface DFSPlayer {
  id: string;
  contestId: string;
  externalPlayerId: string;
  name: string;
  team: string;
  position: string;
  salary: number;
  projectedPoints: number;
  actualPoints: number;
  ownership: number;
  value: number;
  gameTime: Date;
  isActive: boolean;
  injuryStatus?: string;
  opponent: string;
  weather?: string;
  venue?: string;
}

export interface DFSLineup {
  id: string;
  userId: string;
  contestId: string;
  name: string;
  players: DFSLineupPlayer[];
  totalSalary: number;
  totalPoints: number;
  isOptimal: boolean;
  isLocked: boolean;
}

export interface DFSLineupPlayer {
  id: string;
  lineupId: string;
  dfsPlayerId: string;
  position: string;
  slotPosition: string;
  salary: number;
  points: number;
}

export interface ContestEntry {
  id: string;
  contestId: string;
  userId: string;
  lineupId: string;
  entryNumber: number;
  totalPoints: number;
  rank?: number;
  payout: number;
}

export interface PrizeStructure {
  rank: number;
  rankTo?: number;
  payout: number;
  percentage: number;
}

export enum ContestType {
  TOURNAMENT = 'TOURNAMENT',
  CASH_GAME = 'CASH_GAME',
  HEAD_TO_HEAD = 'HEAD_TO_HEAD',
  FIFTY_FIFTY = 'FIFTY_FIFTY',
  DOUBLE_UP = 'DOUBLE_UP',
  MULTIPLIER = 'MULTIPLIER',
  SATELLITE = 'SATELLITE'
}

export enum ContestStatus {
  UPCOMING = 'UPCOMING',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export class DFSService extends EventEmitter {
  private contests: Map<string, Contest> = new Map();
  private players: Map<string, DFSPlayer[]> = new Map();
  private lineups: Map<string, DFSLineup[]> = new Map();
  private entries: Map<string, ContestEntry[]> = new Map();

  constructor() {
    super();
    this.initializeMockData();
  }

  // Contest Management
  async getContests(filters?: {
    sport?: string;
    contestType?: ContestType;
    minEntryFee?: number;
    maxEntryFee?: number;
    status?: ContestStatus;
  }): Promise<Contest[]> {
    let contests = Array.from(this.contests.values());

    if (filters) {
      contests = contests.filter(contest => {
        if (filters.sport && contest.sport !== filters.sport) return false;
        if (filters.contestType && contest.contestType !== filters.contestType) return false;
        if (filters.minEntryFee && contest.entryFee < filters.minEntryFee) return false;
        if (filters.maxEntryFee && contest.entryFee > filters.maxEntryFee) return false;
        if (filters.status && contest.status !== filters.status) return false;
        return true;
      });
    }

    return contests.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async getContest(contestId: string): Promise<Contest | null> {
    return this.contests.get(contestId) || null;
  }

  async createContest(contestData: Omit<Contest, 'id' | 'currentEntries'>): Promise<Contest> {
    const contest: Contest = {
      ...contestData,
      id: `contest_${Date.now()}`,
      currentEntries: 0
    };

    this.contests.set(contest.id, contest);
    this.emit('contestCreated', contest);
    return contest;
  }

  // Player Management
  async getContestPlayers(contestId: string, filters?: {
    position?: string;
    minSalary?: number;
    maxSalary?: number;
    minProjected?: number;
    maxProjected?: number;
    isActive?: boolean;
  }): Promise<DFSPlayer[]> {
    let players = this.players.get(contestId) || [];

    if (filters) {
      players = players.filter(player => {
        if (filters.position && player.position !== filters.position) return false;
        if (filters.minSalary && player.salary < filters.minSalary) return false;
        if (filters.maxSalary && player.salary > filters.maxSalary) return false;
        if (filters.minProjected && player.projectedPoints < filters.minProjected) return false;
        if (filters.maxProjected && player.projectedPoints > filters.maxProjected) return false;
        if (filters.isActive !== undefined && player.isActive !== filters.isActive) return false;
        return true;
      });
    }

    return players.sort((a, b) => b.projectedPoints - a.projectedPoints);
  }

  async updatePlayerProjections(contestId: string, playerId: string, projectedPoints: number): Promise<void> {
    const players = this.players.get(contestId) || [];
    const playerIndex = players.findIndex(p => p.id === playerId);
    
    if (playerIndex >= 0) {
      players[playerIndex].projectedPoints = projectedPoints;
      players[playerIndex].value = projectedPoints / (players[playerIndex].salary / 1000);
      this.emit('playerProjectionUpdated', players[playerIndex]);
    }
  }

  // Lineup Management
  async createLineup(userId: string, contestId: string, lineupData: {
    name: string;
    players: Array<{
      dfsPlayerId: string;
      position: string;
      slotPosition: string;
    }>;
  }): Promise<DFSLineup> {
    const contest = this.contests.get(contestId);
    if (!contest) throw new Error('Contest not found');

    const contestPlayers = this.players.get(contestId) || [];
    const lineupPlayers: DFSLineupPlayer[] = [];
    let totalSalary = 0;
    let totalPoints = 0;

    // Validate and build lineup
    for (const playerData of lineupData.players) {
      const player = contestPlayers.find(p => p.id === playerData.dfsPlayerId);
      if (!player) throw new Error(`Player ${playerData.dfsPlayerId} not found`);

      const lineupPlayer: DFSLineupPlayer = {
        id: `lineup_player_${Date.now()}_${Math.random()}`,
        lineupId: '', // Will be set after lineup creation
        dfsPlayerId: player.id,
        position: playerData.position,
        slotPosition: playerData.slotPosition,
        salary: player.salary,
        points: player.actualPoints
      };

      lineupPlayers.push(lineupPlayer);
      totalSalary += player.salary;
      totalPoints += player.actualPoints;
    }

    // Validate salary cap
    if (totalSalary > contest.salaryCap) {
      throw new Error(`Lineup exceeds salary cap: $${totalSalary} > $${contest.salaryCap}`);
    }

    // Validate lineup requirements (9 players for football)
    if (lineupPlayers.length !== 9) {
      throw new Error('Lineup must contain exactly 9 players');
    }

    const lineup: DFSLineup = {
      id: `lineup_${Date.now()}`,
      userId,
      contestId,
      name: lineupData.name,
      players: lineupPlayers.map(p => ({ ...p, lineupId: `lineup_${Date.now()}` })),
      totalSalary,
      totalPoints,
      isOptimal: false,
      isLocked: false
    };

    // Store lineup
    const userLineups = this.lineups.get(userId) || [];
    userLineups.push(lineup);
    this.lineups.set(userId, userLineups);

    this.emit('lineupCreated', lineup);
    return lineup;
  }

  async getUserLineups(userId: string, contestId?: string): Promise<DFSLineup[]> {
    const userLineups = this.lineups.get(userId) || [];
    
    if (contestId) {
      return userLineups.filter(lineup => lineup.contestId === contestId);
    }
    
    return userLineups;
  }

  async optimizeLineup(contestId: string, constraints?: {
    lockedPlayers?: string[];
    excludedPlayers?: string[];
    maxOwnership?: number;
    stackTeams?: string[];
  }): Promise<DFSLineup> {
    const contest = this.contests.get(contestId);
    if (!contest) throw new Error('Contest not found');

    const players = this.players.get(contestId) || [];
    
    // Simple optimization algorithm (would be more complex in production)
    const positions = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST'];
    const selectedPlayers: DFSPlayer[] = [];
    let remainingSalary = contest.salaryCap;

    // Sort players by value (points per $1000 salary)
    const sortedPlayers = players
      .filter(p => p.isActive)
      .filter(p => !constraints?.excludedPlayers?.includes(p.id))
      .filter(p => !constraints?.maxOwnership || p.ownership <= constraints.maxOwnership)
      .sort((a, b) => b.value - a.value);

    for (const position of positions) {
      const availablePlayers = sortedPlayers.filter(p => {
        if (position === 'FLEX') {
          return ['RB', 'WR', 'TE'].includes(p.position);
        }
        return p.position === position;
      }).filter(p => 
        p.salary <= remainingSalary && 
        !selectedPlayers.includes(p)
      );

      if (availablePlayers.length > 0) {
        const selectedPlayer = availablePlayers[0];
        selectedPlayers.push(selectedPlayer);
        remainingSalary -= selectedPlayer.salary;
      }
    }

    if (selectedPlayers.length !== 9) {
      throw new Error('Unable to create optimal lineup within salary cap');
    }

    const lineupData = {
      name: 'Optimized Lineup',
      players: selectedPlayers.map((player, index) => ({
        dfsPlayerId: player.id,
        position: player.position,
        slotPosition: positions[index] === 'FLEX' ? 'FLEX' : player.position
      }))
    };

    const lineup = await this.createLineup('system', contestId, lineupData);
    lineup.isOptimal = true;
    
    this.emit('lineupOptimized', lineup);
    return lineup;
  }

  // Contest Entry Management
  async enterContest(userId: string, contestId: string, lineupId: string): Promise<ContestEntry> {
    const contest = this.contests.get(contestId);
    if (!contest) throw new Error('Contest not found');

    if (contest.currentEntries >= contest.maxEntries) {
      throw new Error('Contest is full');
    }

    if (new Date() >= contest.startTime) {
      throw new Error('Contest has already started');
    }

    const userLineups = this.lineups.get(userId) || [];
    const lineup = userLineups.find(l => l.id === lineupId);
    if (!lineup) throw new Error('Lineup not found');

    // Calculate entry number for this user
    const userEntries = this.entries.get(contestId) || [];
    const userEntryCount = userEntries.filter(e => e.userId === userId).length;

    const entry: ContestEntry = {
      id: `entry_${Date.now()}`,
      contestId,
      userId,
      lineupId,
      entryNumber: userEntryCount + 1,
      totalPoints: lineup.totalPoints,
      payout: 0
    };

    // Update contest entries
    userEntries.push(entry);
    this.entries.set(contestId, userEntries);

    // Update contest current entries
    contest.currentEntries++;
    this.contests.set(contestId, contest);

    // Lock the lineup
    lineup.isLocked = true;

    this.emit('contestEntered', { entry, contest, lineup });
    return entry;
  }

  async getContestLeaderboard(contestId: string): Promise<ContestEntry[]> {
    const entries = this.entries.get(contestId) || [];
    return entries
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  // Live Scoring
  async updateLiveScores(contestId: string, playerScores: Array<{ playerId: string; points: number }>): Promise<void> {
    const players = this.players.get(contestId) || [];
    const entries = this.entries.get(contestId) || [];

    // Update player scores
    for (const score of playerScores) {
      const playerIndex = players.findIndex(p => p.id === score.playerId);
      if (playerIndex >= 0) {
        players[playerIndex].actualPoints = score.points;
      }
    }

    // Update lineup scores for all entries
    for (const entry of entries) {
      const userLineups = this.lineups.get(entry.userId) || [];
      const lineup = userLineups.find(l => l.id === entry.lineupId);
      
      if (lineup) {
        let totalPoints = 0;
        for (const lineupPlayer of lineup.players) {
          const player = players.find(p => p.id === lineupPlayer.dfsPlayerId);
          if (player) {
            lineupPlayer.points = player.actualPoints;
            totalPoints += player.actualPoints;
          }
        }
        lineup.totalPoints = totalPoints;
        entry.totalPoints = totalPoints;
      }
    }

    this.emit('liveScoreUpdate', { contestId, playerScores });
  }

  // Analytics
  async getOwnershipData(contestId: string): Promise<Array<{ playerId: string; ownership: number }>> {
    const entries = this.entries.get(contestId) || [];
    const playerCounts = new Map<string, number>();

    // Count player usage across all lineups
    for (const entry of entries) {
      const userLineups = this.lineups.get(entry.userId) || [];
      const lineup = userLineups.find(l => l.id === entry.lineupId);
      
      if (lineup) {
        for (const player of lineup.players) {
          const count = playerCounts.get(player.dfsPlayerId) || 0;
          playerCounts.set(player.dfsPlayerId, count + 1);
        }
      }
    }

    // Calculate ownership percentages
    const totalEntries = entries.length;
    const ownershipData = Array.from(playerCounts.entries()).map(([playerId, count]) => ({
      playerId,
      ownership: totalEntries > 0 ? (count / totalEntries) * 100 : 0
    }));

    return ownershipData.sort((a, b) => b.ownership - a.ownership);
  }

  private initializeMockData(): void {
    // Mock contest data
    const mockContest: Contest = {
      id: 'contest_1',
      name: 'Sunday Million',
      description: 'Massive tournament with guaranteed prize pool',
      sport: 'FOOTBALL',
      contestType: ContestType.TOURNAMENT,
      entryFee: 20,
      totalPrizePool: 1000000,
      maxEntries: 100000,
      currentEntries: 87543,
      salaryCap: 50000,
      startTime: new Date(Date.now() + 3600000), // 1 hour from now
      endTime: new Date(Date.now() + 14400000), // 4 hours from now
      status: ContestStatus.UPCOMING,
      isPublic: true,
      isGuaranteed: true,
      prizeStructure: [
        { rank: 1, payout: 150000, percentage: 15 },
        { rank: 2, payout: 75000, percentage: 7.5 },
        { rank: 3, payout: 50000, percentage: 5 },
        { rank: 4, rankTo: 10, payout: 25000, percentage: 2.5 },
        { rank: 11, rankTo: 50, payout: 10000, percentage: 1 }
      ]
    };

    this.contests.set(mockContest.id, mockContest);

    // Mock player data
    const mockPlayers: DFSPlayer[] = [
      {
        id: 'player_1',
        contestId: 'contest_1',
        externalPlayerId: 'ext_1',
        name: 'Josh Allen',
        team: 'BUF',
        position: 'QB',
        salary: 8500,
        projectedPoints: 22.5,
        actualPoints: 0,
        ownership: 15.2,
        value: 2.65,
        gameTime: new Date(Date.now() + 3600000),
        isActive: true,
        opponent: 'MIA'
      }
      // Add more mock players as needed
    ];

    this.players.set('contest_1', mockPlayers);
  }
}

export const dfsService = new DFSService();