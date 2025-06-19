"use client";

import { EventEmitter } from 'events';

export interface LeagueConnection {
  id: string;
  userId: string;
  platform: LeaguePlatform;
  leagueId: string;
  leagueName: string;
  leagueType: LeagueType;
  settings: LeagueSettings;
  credentials: LeagueCredentials;
  lastSync: Date;
  syncStatus: SyncStatus;
  isActive: boolean;
  metadata: any;
}

export interface LeagueCredentials {
  platform: LeaguePlatform;
  username?: string;
  password?: string;
  apiKey?: string;
  oauthToken?: string;
  cookieData?: string;
  leagueId: string;
  teamId?: string;
  expiresAt?: Date;
}

export interface LeagueSettings {
  scoringType: 'standard' | 'ppr' | 'half_ppr' | 'superflex' | 'dynasty' | 'bestball';
  rosterSize: number;
  startingLineup: RosterPosition[];
  benchSlots: number;
  irSlots: number;
  maxTransactions?: number;
  tradeDeadline?: Date;
  playoffWeeks: number[];
  keeperSettings?: KeeperSettings;
  draftSettings?: DraftSettings;
  waiverSettings?: WaiverSettings;
}

export interface RosterPosition {
  position: string;
  count: number;
  eligiblePositions?: string[];
}

export interface KeeperSettings {
  enabled: boolean;
  maxKeepers: number;
  keeperCost: 'none' | 'draft_round' | 'salary' | 'auction_value';
  roundPenalty: number;
  salaryCap?: number;
  inflationRate?: number;
  rookieDraft?: boolean;
  futurePickTrading?: boolean;
}

export interface DraftSettings {
  type: 'snake' | 'auction' | 'linear';
  date: Date;
  orderType: 'random' | 'reverse_standings' | 'custom';
  auctionBudget?: number;
  timePerPick: number;
  rounds: number;
}

export interface WaiverSettings {
  type: 'reverse_standings' | 'faab' | 'rolling' | 'none';
  budget?: number;
  processDay: string;
  processTime: string;
  lockTime: string;
}

export interface SyncedPlayer {
  externalId: string;
  name: string;
  position: string;
  team: string;
  isRostered: boolean;
  rosteredBy?: string;
  waiverStatus: 'available' | 'waivers' | 'rostered';
  stats: Record<string, number>;
  projections?: Record<string, number>;
  injuryStatus?: string;
  lastUpdated: Date;
}

export interface SyncedRoster {
  teamId: string;
  teamName: string;
  ownerId: string;
  ownerName: string;
  players: SyncedPlayer[];
  lineup: Record<string, string>; // position -> playerId
  record: {
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    pointsAgainst: number;
  };
  lastUpdated: Date;
}

export interface SyncedMatchup {
  week: number;
  team1Id: string;
  team2Id: string;
  team1Score?: number;
  team2Score?: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  projectedScores?: {
    team1: number;
    team2: number;
  };
}

export interface SyncResult {
  success: boolean;
  leagueId: string;
  platform: LeaguePlatform;
  syncedAt: Date;
  data: {
    players?: SyncedPlayer[];
    rosters?: SyncedRoster[];
    matchups?: SyncedMatchup[];
    settings?: LeagueSettings;
  };
  errors?: string[];
  warnings?: string[];
}

export enum LeaguePlatform {
  YAHOO = 'yahoo',
  ESPN = 'espn',
  CBS = 'cbs',
  SLEEPER = 'sleeper',
  NFL = 'nfl',
  FLEAFLICKER = 'fleaflicker',
  MFL = 'mfl',
  RTSports = 'rtsports'
}

export enum LeagueType {
  REDRAFT = 'redraft',
  KEEPER = 'keeper', 
  DYNASTY = 'dynasty',
  BESTBALL = 'bestball',
  DRAFT_AND_HOLD = 'draft_and_hold'
}

export enum SyncStatus {
  NEVER_SYNCED = 'never_synced',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  ERROR = 'error',
  EXPIRED = 'expired',
  DISABLED = 'disabled'
}

export class LeagueConnectorService extends EventEmitter {
  private connections: Map<string, LeagueConnection> = new Map();
  private platformHandlers: Map<LeaguePlatform, PlatformHandler> = new Map();
  private syncQueue: string[] = [];
  private isSyncing: boolean = false;

  constructor() {
    super();
    this.initializePlatformHandlers();
    this.startSyncScheduler();
  }

  private initializePlatformHandlers() {
    this.platformHandlers.set(LeaguePlatform.YAHOO, new YahooHandler());
    this.platformHandlers.set(LeaguePlatform.ESPN, new ESPNHandler());
    this.platformHandlers.set(LeaguePlatform.SLEEPER, new SleeperHandler());
    this.platformHandlers.set(LeaguePlatform.CBS, new CBSHandler());
    this.platformHandlers.set(LeaguePlatform.NFL, new NFLHandler());
  }

  private startSyncScheduler() {
    // Auto-sync every 15 minutes
    setInterval(() => {
      this.syncAllActiveConnections();
    }, 15 * 60 * 1000);
  }

  async connectLeague(
    userId: string,
    platform: LeaguePlatform,
    credentials: LeagueCredentials
  ): Promise<LeagueConnection> {
    try {
      const handler = this.platformHandlers.get(platform);
      if (!handler) {
        throw new Error(`Platform ${platform} not supported`);
      }

      // Validate credentials and fetch league info
      const leagueInfo = await handler.validateAndFetchLeague(credentials);
      
      const connection: LeagueConnection = {
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        platform,
        leagueId: credentials.leagueId,
        leagueName: leagueInfo.name,
        leagueType: leagueInfo.type,
        settings: leagueInfo.settings,
        credentials,
        lastSync: new Date(),
        syncStatus: SyncStatus.NEVER_SYNCED,
        isActive: true,
        metadata: leagueInfo.metadata
      };

      this.connections.set(connection.id, connection);
      
      // Perform initial sync
      await this.syncLeague(connection.id);
      
      this.emit('leagueConnected', connection);
      
      return connection;

    } catch (error) {
      console.error(`Failed to connect to ${platform} league:`, error);
      throw error;
    }
  }

  async syncLeague(connectionId: string): Promise<SyncResult> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    const handler = this.platformHandlers.get(connection.platform);
    if (!handler) {
      throw new Error(`Platform ${connection.platform} not supported`);
    }

    try {
      connection.syncStatus = SyncStatus.SYNCING;
      this.connections.set(connectionId, connection);
      this.emit('syncStarted', connection);

      const syncResult = await handler.syncLeague(connection.credentials);
      
      connection.lastSync = new Date();
      connection.syncStatus = syncResult.success ? SyncStatus.SYNCED : SyncStatus.ERROR;
      this.connections.set(connectionId, connection);

      this.emit('syncCompleted', { connection, result: syncResult });
      
      return syncResult;

    } catch (error) {
      connection.syncStatus = SyncStatus.ERROR;
      this.connections.set(connectionId, connection);
      
      const errorResult: SyncResult = {
        success: false,
        leagueId: connection.leagueId,
        platform: connection.platform,
        syncedAt: new Date(),
        data: {},
        errors: [error instanceof Error ? error.message : 'Unknown sync error']
      };

      this.emit('syncError', { connection, error: errorResult });
      
      return errorResult;
    }
  }

  async syncAllActiveConnections(): Promise<void> {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    
    try {
      const activeConnections = Array.from(this.connections.values())
        .filter(conn => conn.isActive);

      for (const connection of activeConnections) {
        // Only sync if it's been more than 10 minutes since last sync
        const timeSinceSync = Date.now() - connection.lastSync.getTime();
        if (timeSinceSync > 10 * 60 * 1000) {
          await this.syncLeague(connection.id);
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  async getUserConnections(userId: string): Promise<LeagueConnection[]> {
    return Array.from(this.connections.values())
      .filter(conn => conn.userId === userId);
  }

  async getConnection(connectionId: string): Promise<LeagueConnection | null> {
    return this.connections.get(connectionId) || null;
  }

  async removeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.isActive = false;
      this.connections.set(connectionId, connection);
      this.emit('leagueDisconnected', connection);
    }
  }

  async updateCredentials(
    connectionId: string,
    newCredentials: Partial<LeagueCredentials>
  ): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.credentials = { ...connection.credentials, ...newCredentials };
      this.connections.set(connectionId, connection);
      
      // Re-sync with new credentials
      await this.syncLeague(connectionId);
    }
  }

  async getCrossLeagueAnalytics(userId: string): Promise<{
    totalLeagues: number;
    activeLeagues: number;
    overallRecord: { wins: number; losses: number; ties: number; };
    totalPoints: number;
    averagePoints: number;
    bestWeek: { week: number; points: number; league: string; };
    worstWeek: { week: number; points: number; league: string; };
  }> {
    const connections = await this.getUserConnections(userId);
    const activeConnections = connections.filter(c => c.isActive);

    // Mock analytics calculation
    return {
      totalLeagues: connections.length,
      activeLeagues: activeConnections.length,
      overallRecord: { wins: 45, losses: 23, ties: 2 },
      totalPoints: 1847.3,
      averagePoints: 118.5,
      bestWeek: { week: 3, points: 165.8, league: 'Championship League' },
      worstWeek: { week: 7, points: 78.2, league: 'Dynasty Empire' }
    };
  }

  async getUnifiedPlayerPool(userId: string): Promise<SyncedPlayer[]> {
    const connections = await this.getUserConnections(userId);
    const allPlayers: SyncedPlayer[] = [];
    
    for (const connection of connections) {
      if (connection.isActive && connection.syncStatus === SyncStatus.SYNCED) {
        // Fetch latest synced data for this league
        const syncData = await this.getLatestSyncData(connection.id);
        if (syncData?.players) {
          allPlayers.push(...syncData.players);
        }
      }
    }

    // Deduplicate players and combine data from multiple leagues
    const playerMap = new Map<string, SyncedPlayer>();
    
    allPlayers.forEach(player => {
      const existingPlayer = playerMap.get(player.name);
      if (!existingPlayer) {
        playerMap.set(player.name, player);
      } else {
        // Combine data from multiple leagues
        existingPlayer.isRostered = existingPlayer.isRostered || player.isRostered;
        // Keep most recent stats
        if (player.lastUpdated > existingPlayer.lastUpdated) {
          existingPlayer.stats = player.stats;
          existingPlayer.lastUpdated = player.lastUpdated;
        }
      }
    });

    return Array.from(playerMap.values());
  }

  private async getLatestSyncData(connectionId: string): Promise<any> {
    // Mock implementation - would fetch from database
    return {
      players: [
        {
          externalId: 'player_1',
          name: 'Josh Allen',
          position: 'QB',
          team: 'BUF',
          isRostered: true,
          rosteredBy: 'Team 1',
          waiverStatus: 'rostered',
          stats: { passing_yards: 2847, passing_tds: 20 },
          lastUpdated: new Date()
        }
      ]
    };
  }

  // Platform-specific import wizards
  async createImportWizard(platform: LeaguePlatform): Promise<{
    steps: ImportStep[];
    requirements: string[];
    estimatedTime: string;
  }> {
    const wizards = {
      [LeaguePlatform.YAHOO]: {
        steps: [
          { id: 1, title: 'Yahoo Login', description: 'Sign in to your Yahoo account' },
          { id: 2, title: 'Authorize Access', description: 'Grant permission to access league data' },
          { id: 3, title: 'Select League', description: 'Choose which league to import' },
          { id: 4, title: 'Configure Settings', description: 'Map league settings to Fantasy.AI' }
        ],
        requirements: ['Yahoo Fantasy account', 'League commissioner approval'],
        estimatedTime: '2-3 minutes'
      },
      [LeaguePlatform.ESPN]: {
        steps: [
          { id: 1, title: 'ESPN Login', description: 'Sign in to your ESPN account' },
          { id: 2, title: 'League Selection', description: 'Enter league ID and year' },
          { id: 3, title: 'Privacy Settings', description: 'Ensure league is set to public or provide credentials' },
          { id: 4, title: 'Import Data', description: 'Sync historical and current data' }
        ],
        requirements: ['ESPN Fantasy account', 'Public league or login credentials'],
        estimatedTime: '3-5 minutes'
      },
      [LeaguePlatform.SLEEPER]: {
        steps: [
          { id: 1, title: 'League ID', description: 'Enter your Sleeper league ID' },
          { id: 2, title: 'Verify Access', description: 'Confirm league data access' },
          { id: 3, title: 'Sync Data', description: 'Import all league information' }
        ],
        requirements: ['Sleeper league ID', 'League must be active'],
        estimatedTime: '1-2 minutes'
      },
      [LeaguePlatform.CBS]: {
        steps: [
          { id: 1, title: 'CBS Login', description: 'Sign in to your CBS account' },
          { id: 2, title: 'League Access', description: 'Provide league ID and credentials' },
          { id: 3, title: 'Import Data', description: 'Sync league information' }
        ],
        requirements: ['CBS Fantasy account', 'League credentials'],
        estimatedTime: '2-3 minutes'
      },
      [LeaguePlatform.NFL]: {
        steps: [
          { id: 1, title: 'NFL Login', description: 'Sign in to your NFL.com account' },
          { id: 2, title: 'League Selection', description: 'Choose your NFL fantasy league' },
          { id: 3, title: 'Sync Data', description: 'Import all league data' }
        ],
        requirements: ['NFL.com Fantasy account', 'Active league membership'],
        estimatedTime: '2-4 minutes'
      },
      [LeaguePlatform.FLEAFLICKER]: {
        steps: [
          { id: 1, title: 'Fleaflicker Setup', description: 'Configure Fleaflicker integration' },
          { id: 2, title: 'League Import', description: 'Import league data' }
        ],
        requirements: ['Fleaflicker account'],
        estimatedTime: '2-3 minutes'
      },
      [LeaguePlatform.MFL]: {
        steps: [
          { id: 1, title: 'MFL Setup', description: 'Configure MyFantasyLeague integration' },
          { id: 2, title: 'League Import', description: 'Import league data' }
        ],
        requirements: ['MyFantasyLeague account'],
        estimatedTime: '2-3 minutes'
      },
      [LeaguePlatform.RTSports]: {
        steps: [
          { id: 1, title: 'RTSports Setup', description: 'Configure RTSports integration' },
          { id: 2, title: 'League Import', description: 'Import league data' }
        ],
        requirements: ['RTSports account'],
        estimatedTime: '2-3 minutes'
      }
    };

    return wizards[platform] || {
      steps: [],
      requirements: ['Platform not yet supported'],
      estimatedTime: 'Unknown'
    };
  }
}

interface ImportStep {
  id: number;
  title: string;
  description: string;
}

// Platform-specific handlers
abstract class PlatformHandler {
  abstract validateAndFetchLeague(credentials: LeagueCredentials): Promise<{
    name: string;
    type: LeagueType;
    settings: LeagueSettings;
    metadata: any;
  }>;

  abstract syncLeague(credentials: LeagueCredentials): Promise<SyncResult>;
}

class YahooHandler extends PlatformHandler {
  async validateAndFetchLeague(credentials: LeagueCredentials) {
    // Mock Yahoo API integration
    return {
      name: 'Championship League',
      type: LeagueType.REDRAFT,
      settings: {
        scoringType: 'ppr' as const,
        rosterSize: 16,
        startingLineup: [
          { position: 'QB', count: 1 },
          { position: 'RB', count: 2 },
          { position: 'WR', count: 2 },
          { position: 'TE', count: 1 },
          { position: 'FLEX', count: 1, eligiblePositions: ['RB', 'WR', 'TE'] },
          { position: 'K', count: 1 },
          { position: 'DEF', count: 1 }
        ],
        benchSlots: 7,
        irSlots: 1,
        playoffWeeks: [15, 16, 17]
      },
      metadata: { platform_id: credentials.leagueId }
    };
  }

  async syncLeague(credentials: LeagueCredentials): Promise<SyncResult> {
    // Mock sync implementation
    return {
      success: true,
      leagueId: credentials.leagueId,
      platform: LeaguePlatform.YAHOO,
      syncedAt: new Date(),
      data: {
        players: [],
        rosters: [],
        matchups: []
      }
    };
  }
}

class ESPNHandler extends PlatformHandler {
  async validateAndFetchLeague(credentials: LeagueCredentials) {
    return {
      name: 'Dynasty Empire',
      type: LeagueType.DYNASTY,
      settings: {
        scoringType: 'half_ppr' as const,
        rosterSize: 22,
        startingLineup: [
          { position: 'QB', count: 1 },
          { position: 'RB', count: 2 },
          { position: 'WR', count: 3 },
          { position: 'TE', count: 1 },
          { position: 'FLEX', count: 2, eligiblePositions: ['RB', 'WR', 'TE'] },
          { position: 'K', count: 1 },
          { position: 'DEF', count: 1 }
        ],
        benchSlots: 10,
        irSlots: 3,
        playoffWeeks: [15, 16, 17],
        keeperSettings: {
          enabled: true,
          maxKeepers: 22,
          keeperCost: 'none' as const,
          roundPenalty: 0,
          rookieDraft: true,
          futurePickTrading: true
        }
      },
      metadata: { platform_id: credentials.leagueId }
    };
  }

  async syncLeague(credentials: LeagueCredentials): Promise<SyncResult> {
    return {
      success: true,
      leagueId: credentials.leagueId,
      platform: LeaguePlatform.ESPN,
      syncedAt: new Date(),
      data: {}
    };
  }
}

class SleeperHandler extends PlatformHandler {
  async validateAndFetchLeague(credentials: LeagueCredentials) {
    return {
      name: 'Sleeper Dynasty',
      type: LeagueType.DYNASTY,
      settings: {
        scoringType: 'ppr' as const,
        rosterSize: 25,
        startingLineup: [
          { position: 'QB', count: 1 },
          { position: 'RB', count: 2 },
          { position: 'WR', count: 3 },
          { position: 'TE', count: 1 },
          { position: 'FLEX', count: 2, eligiblePositions: ['RB', 'WR', 'TE'] },
          { position: 'SUPERFLEX', count: 1, eligiblePositions: ['QB', 'RB', 'WR', 'TE'] }
        ],
        benchSlots: 15,
        irSlots: 4,
        playoffWeeks: [15, 16, 17]
      },
      metadata: { platform_id: credentials.leagueId }
    };
  }

  async syncLeague(credentials: LeagueCredentials): Promise<SyncResult> {
    return {
      success: true,
      leagueId: credentials.leagueId,
      platform: LeaguePlatform.SLEEPER,
      syncedAt: new Date(),
      data: {}
    };
  }
}

class CBSHandler extends PlatformHandler {
  async validateAndFetchLeague(credentials: LeagueCredentials) {
    return {
      name: 'CBS League',
      type: LeagueType.KEEPER,
      settings: {
        scoringType: 'standard' as const,
        rosterSize: 16,
        startingLineup: [
          { position: 'QB', count: 1 },
          { position: 'RB', count: 2 },
          { position: 'WR', count: 2 },
          { position: 'TE', count: 1 },
          { position: 'FLEX', count: 1, eligiblePositions: ['RB', 'WR', 'TE'] },
          { position: 'K', count: 1 },
          { position: 'DEF', count: 1 }
        ],
        benchSlots: 7,
        irSlots: 1,
        playoffWeeks: [15, 16, 17],
        keeperSettings: {
          enabled: true,
          maxKeepers: 3,
          keeperCost: 'draft_round' as const,
          roundPenalty: 1
        }
      },
      metadata: { platform_id: credentials.leagueId }
    };
  }

  async syncLeague(credentials: LeagueCredentials): Promise<SyncResult> {
    return {
      success: true,
      leagueId: credentials.leagueId,
      platform: LeaguePlatform.CBS,
      syncedAt: new Date(),
      data: {}
    };
  }
}

class NFLHandler extends PlatformHandler {
  async validateAndFetchLeague(credentials: LeagueCredentials) {
    return {
      name: 'NFL.com League',
      type: LeagueType.REDRAFT,
      settings: {
        scoringType: 'standard' as const,
        rosterSize: 15,
        startingLineup: [
          { position: 'QB', count: 1 },
          { position: 'RB', count: 2 },
          { position: 'WR', count: 2 },
          { position: 'TE', count: 1 },
          { position: 'K', count: 1 },
          { position: 'DEF', count: 1 }
        ],
        benchSlots: 7,
        irSlots: 1,
        playoffWeeks: [15, 16, 17]
      },
      metadata: { platform_id: credentials.leagueId }
    };
  }

  async syncLeague(credentials: LeagueCredentials): Promise<SyncResult> {
    return {
      success: true,
      leagueId: credentials.leagueId,
      platform: LeaguePlatform.NFL,
      syncedAt: new Date(),
      data: {}
    };
  }
}

export const leagueConnectorService = new LeagueConnectorService();