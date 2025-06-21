/**
 * 🏈 FANTASY AI MVP - FANTASY PROVIDER DATA PIPELINE
 * 
 * Real API integrations with Yahoo, ESPN, CBS, and Sleeper fantasy platforms.
 * This pipeline fetches real league data, player stats, and roster information.
 */

import { z } from "zod";
import { prisma } from "./prisma";

export const FantasyProviderSchema = z.enum(["yahoo", "espn", "cbs", "sleeper"]);
export type FantasyProvider = z.infer<typeof FantasyProviderSchema>;

// Enhanced data models for consistent provider responses
export interface ProviderLeague {
  id: string;
  name: string;
  sport: string;
  season: string;
  settings: {
    teamCount: number;
    rosterSize: number;
    playoffWeeks: number[];
    scoringType: 'standard' | 'ppr' | 'half_ppr';
  };
  draftDate?: Date;
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface ProviderTeam {
  id: string;
  name: string;
  abbrev: string;
  ownerId: string;
  ownerName: string;
  logoUrl?: string;
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  points: {
    total: number;
    average: number;
  };
  roster: ProviderPlayer[];
}

export interface ProviderPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  status: 'active' | 'injured' | 'bye' | 'suspended';
  injuryStatus?: string;
  stats: {
    season: Record<string, number>;
    lastGame?: Record<string, number>;
    projections?: Record<string, number>;
  };
  roster?: {
    slot: string;
    isStarter: boolean;
    acquisitionType: 'draft' | 'waiver' | 'trade' | 'free_agent';
  };
  metadata: Record<string, any>;
}

export interface ProviderSyncResult {
  success: boolean;
  provider: FantasyProvider;
  leagueId: string;
  syncedData: {
    teams: number;
    players: number;
    rosters: number;
  };
  errors: string[];
  lastSync: Date;
}

export interface FantasyProviderConfig {
  name: string;
  displayName: string;
  authUrl: string;
  tokenUrl: string;
  scope: string[];
  supportsOAuth: boolean;
  apiBaseUrl: string;
}

export const FANTASY_PROVIDERS: Record<FantasyProvider, FantasyProviderConfig> = {
  yahoo: {
    name: "yahoo",
    displayName: "Yahoo Fantasy",
    authUrl: "https://api.login.yahoo.com/oauth2/request_auth",
    tokenUrl: "https://api.login.yahoo.com/oauth2/get_token",
    scope: ["fspt-r", "fspt-w"],
    supportsOAuth: true,
    apiBaseUrl: "https://fantasysports.yahooapis.com/fantasy/v2",
  },
  espn: {
    name: "espn",
    displayName: "ESPN Fantasy",
    authUrl: "https://ha.registerdisney.go.com/jgc/v6/client/ESPN-ESPNCOM-PROD/guest/login",
    tokenUrl: "https://ha.registerdisney.go.com/jgc/v6/client/ESPN-ESPNCOM-PROD/api-key/login",
    scope: [],
    supportsOAuth: false, // ESPN uses cookie-based auth
    apiBaseUrl: "https://fantasy.espn.com/apis/v3/games/ffl",
  },
  cbs: {
    name: "cbs",
    displayName: "CBS Sports",
    authUrl: "https://www.cbssports.com/oauth/authorize",
    tokenUrl: "https://www.cbssports.com/oauth/token",
    scope: ["fantasy:read", "fantasy:write"],
    supportsOAuth: true,
    apiBaseUrl: "https://api.cbssports.com/fantasy",
  },
  sleeper: {
    name: "sleeper",
    displayName: "Sleeper",
    authUrl: "",
    tokenUrl: "",
    scope: [],
    supportsOAuth: false, // Sleeper uses username-based public API
    apiBaseUrl: "https://api.sleeper.app/v1",
  },
};

export class FantasyProviderAPI {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests
  private readonly CACHE_TTL = {
    leagues: 5 * 60 * 1000, // 5 minutes
    teams: 2 * 60 * 1000,   // 2 minutes  
    players: 1 * 60 * 1000, // 1 minute
    stats: 30 * 1000       // 30 seconds
  };

  constructor(
    private provider: FantasyProvider,
    private accessToken?: string,
    private cookieString?: string // For ESPN auth
  ) {}

  /**
   * Get user's fantasy leagues with caching and error handling
   */
  async getLeagues(userId: string): Promise<ProviderLeague[]> {
    const cacheKey = `leagues_${this.provider}_${userId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      await this.enforceRateLimit();
      
      let rawLeagues: any[];
      
      switch (this.provider) {
        case "yahoo":
          rawLeagues = await this.yahooGetLeagues(userId);
          break;
        case "espn":
          rawLeagues = await this.espnGetLeagues(userId);
          break;
        case "cbs":
          rawLeagues = await this.cbsGetLeagues(userId);
          break;
        case "sleeper":
          rawLeagues = await this.sleeperGetLeagues(userId);
          break;
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }

      const leagues = rawLeagues.map(league => this.transformLeague(league));
      this.setCache(cacheKey, leagues, this.CACHE_TTL.leagues);
      
      console.log(`✅ Fetched ${leagues.length} leagues from ${this.provider}`);
      return leagues;
      
    } catch (error) {
      console.error(`❌ Failed to fetch leagues from ${this.provider}:`, error);
      return this.getFallbackLeagues(userId);
    }
  }

  /**
   * Get detailed league information with enhanced data
   */
  async getLeagueInfo(leagueId: string): Promise<ProviderLeague | null> {
    const cacheKey = `league_${this.provider}_${leagueId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      await this.enforceRateLimit();
      
      let rawLeague: any;
      
      switch (this.provider) {
        case "yahoo":
          rawLeague = await this.yahooRequest(`/league/nfl.l.${leagueId}`);
          break;
        case "espn":
          rawLeague = await this.espnRequest(`/seasons/2024/segments/0/leagues/${leagueId}`);
          break;
        case "cbs":
          rawLeague = await this.cbsRequest(`/leagues/${leagueId}`);
          break;
        case "sleeper":
          rawLeague = await this.sleeperRequest(`/league/${leagueId}`);
          break;
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }

      if (!rawLeague) return null;
      
      const league = this.transformLeague(rawLeague);
      this.setCache(cacheKey, league, this.CACHE_TTL.leagues);
      
      return league;
      
    } catch (error) {
      console.error(`❌ Failed to fetch league info from ${this.provider}:`, error);
      return null;
    }
  }

  /**
   * Get all teams in a league with full roster data
   */
  async getTeams(leagueId: string): Promise<ProviderTeam[]> {
    const cacheKey = `teams_${this.provider}_${leagueId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      await this.enforceRateLimit();
      
      let rawTeams: any[];
      
      switch (this.provider) {
        case "yahoo":
          rawTeams = await this.yahooGetTeams(leagueId);
          break;
        case "espn":
          rawTeams = await this.espnGetTeams(leagueId);
          break;
        case "cbs":
          rawTeams = await this.cbsGetTeams(leagueId);
          break;
        case "sleeper":
          rawTeams = await this.sleeperGetTeams(leagueId);
          break;
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }

      const teams = rawTeams.map(team => this.transformTeam(team));
      this.setCache(cacheKey, teams, this.CACHE_TTL.teams);
      
      console.log(`✅ Fetched ${teams.length} teams from ${this.provider}`);
      return teams;
      
    } catch (error) {
      console.error(`❌ Failed to fetch teams from ${this.provider}:`, error);
      return [];
    }
  }

  /**
   * Get player statistics with projections and game context
   */
  async getPlayerStats(playerId: string, week?: number): Promise<ProviderPlayer | null> {
    const cacheKey = `player_${this.provider}_${playerId}_${week || 'season'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      await this.enforceRateLimit();
      
      let rawPlayer: any;
      
      switch (this.provider) {
        case "yahoo":
          const weekParam = week ? `/week/${week}` : "";
          rawPlayer = await this.yahooRequest(`/player/nfl.p.${playerId}/stats${weekParam}`);
          break;
        case "espn":
          rawPlayer = await this.espnRequest(`/seasons/2024/segments/0/players/${playerId}`);
          break;
        case "cbs":
          rawPlayer = await this.cbsRequest(`/players/${playerId}/stats`);
          break;
        case "sleeper":
          // Sleeper requires getting all stats and filtering
          const allStats = await this.sleeperRequest(`/stats/nfl/regular/2024/${week || 1}`);
          rawPlayer = allStats?.[playerId];
          break;
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }

      if (!rawPlayer) return null;
      
      const player = this.transformPlayer(rawPlayer);
      this.setCache(cacheKey, player, this.CACHE_TTL.stats);
      
      return player;
      
    } catch (error) {
      console.error(`❌ Failed to fetch player stats from ${this.provider}:`, error);
      return null;
    }
  }

  /**
   * Sync league data to local database
   */
  async syncLeagueToDatabase(leagueId: string, userId: string): Promise<ProviderSyncResult> {
    const syncResult: ProviderSyncResult = {
      success: false,
      provider: this.provider,
      leagueId,
      syncedData: { teams: 0, players: 0, rosters: 0 },
      errors: [],
      lastSync: new Date()
    };

    try {
      console.log(`🔄 Starting sync for ${this.provider} league ${leagueId}...`);
      
      // Get league info
      const leagueInfo = await this.getLeagueInfo(leagueId);
      if (!leagueInfo) {
        syncResult.errors.push('Failed to fetch league information');
        return syncResult;
      }

      // Store/update league in database
      const dbLeague = await prisma.league.upsert({
        where: {
          provider_providerId: {
            provider: this.provider.toUpperCase() as any,
            providerId: leagueId
          }
        },
        update: {
          name: leagueInfo.name,
          season: leagueInfo.season,
          settings: JSON.stringify(leagueInfo.settings),
          lastSync: new Date()
        },
        create: {
          userId,
          provider: this.provider.toUpperCase() as any,
          providerId: leagueId,
          name: leagueInfo.name,
          season: leagueInfo.season,
          sport: 'FOOTBALL',
          settings: JSON.stringify(leagueInfo.settings),
          lastSync: new Date()
        }
      });

      // Get and sync teams
      const teams = await this.getTeams(leagueId);
      for (const team of teams) {
        try {
          await this.syncTeamToDatabase(team, dbLeague.id);
          syncResult.syncedData.teams++;
          syncResult.syncedData.players += team.roster.length;
        } catch (error) {
          console.error(`Failed to sync team ${team.id}:`, error);
          syncResult.errors.push(`Team sync failed: ${team.name}`);
        }
      }

      syncResult.success = syncResult.errors.length === 0;
      console.log(`✅ Sync completed for ${this.provider} league ${leagueId}`);
      
    } catch (error) {
      console.error(`❌ League sync failed:`, error);
      syncResult.errors.push(`League sync failed: ${error}`);
    }

    return syncResult;
  }

  // =============================================================================
  // 🔗 PROVIDER-SPECIFIC IMPLEMENTATIONS
  // =============================================================================

  /**
   * Yahoo Fantasy Sports API implementation
   */
  private async yahooGetLeagues(userId: string): Promise<any[]> {
    try {
      const response = await this.yahooRequest('/users;use_login=1/games;game_keys=nfl/leagues');
      return response?.fantasy_content?.users?.[0]?.user?.[1]?.games?.game?.[1]?.leagues?.league || [];
    } catch (error) {
      console.error('Yahoo leagues fetch failed:', error);
      return [];
    }
  }

  private async yahooGetTeams(leagueId: string): Promise<any[]> {
    try {
      const [teamsResponse, rostersResponse] = await Promise.all([
        this.yahooRequest(`/league/nfl.l.${leagueId}/teams`),
        this.yahooRequest(`/league/nfl.l.${leagueId}/teams/roster`)
      ]);
      
      const teams = teamsResponse?.fantasy_content?.league?.[1]?.teams?.team || [];
      const rosters = rostersResponse?.fantasy_content?.league?.[1]?.teams?.team || [];
      
      // Merge team data with roster data
      return teams.map((team: any, index: number) => ({
        ...team,
        roster: rosters[index]?.roster || []
      }));
    } catch (error) {
      console.error('Yahoo teams fetch failed:', error);
      return [];
    }
  }

  private async yahooRequest(endpoint: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error("Yahoo requires OAuth access token");
    }

    const response = await fetch(`${FANTASY_PROVIDERS.yahoo.apiBaseUrl}${endpoint}?format=json`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
        'User-Agent': 'Fantasy.AI/1.0'
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Yahoo access token expired or invalid');
      }
      throw new Error(`Yahoo API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * ESPN Fantasy Football API implementation
   */
  private async espnGetLeagues(userId: string): Promise<any[]> {
    try {
      // ESPN requires authentication via cookies for private leagues
      const response = await this.espnRequest('/seasons/2024/segments/0/leagueHistory/1?view=mTeam');
      return response?.leagues || [];
    } catch (error) {
      console.error('ESPN leagues fetch failed:', error);
      return [];
    }
  }

  private async espnGetTeams(leagueId: string): Promise<any[]> {
    try {
      const response = await this.espnRequest(`/seasons/2024/segments/0/leagues/${leagueId}?view=mTeam&view=mRoster`);
      return response?.teams || [];
    } catch (error) {
      console.error('ESPN teams fetch failed:', error);
      return [];
    }
  }

  private async espnRequest(endpoint: string): Promise<any> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      'User-Agent': 'Fantasy.AI/1.0'
    };

    // Add ESPN authentication cookies if available
    if (this.cookieString) {
      headers.Cookie = this.cookieString;
    }

    const response = await fetch(`${FANTASY_PROVIDERS.espn.apiBaseUrl}${endpoint}`, {
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('ESPN authentication required - please provide valid cookies');
      }
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * CBS Sports Fantasy API implementation
   */
  private async cbsGetLeagues(userId: string): Promise<any[]> {
    try {
      const response = await this.cbsRequest(`/users/${userId}/leagues?sport=football&season=2024`);
      return response?.leagues || [];
    } catch (error) {
      console.error('CBS leagues fetch failed:', error);
      return [];
    }
  }

  private async cbsGetTeams(leagueId: string): Promise<any[]> {
    try {
      const [teamsResponse, rostersResponse] = await Promise.all([
        this.cbsRequest(`/leagues/${leagueId}/teams`),
        this.cbsRequest(`/leagues/${leagueId}/rosters`)
      ]);
      
      const teams = teamsResponse?.teams || [];
      const rosters = rostersResponse?.rosters || [];
      
      // Merge team data with roster data
      return teams.map((team: any) => {
        const roster = rosters.find((r: any) => r.teamId === team.id);
        return {
          ...team,
          roster: roster?.players || []
        };
      });
    } catch (error) {
      console.error('CBS teams fetch failed:', error);
      return [];
    }
  }

  private async cbsRequest(endpoint: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error("CBS requires OAuth access token");
    }

    const response = await fetch(`${FANTASY_PROVIDERS.cbs.apiBaseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
        'Content-Type': 'application/json',
        'User-Agent': 'Fantasy.AI/1.0'
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('CBS access token expired or invalid');
      }
      throw new Error(`CBS API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Sleeper Fantasy API implementation
   */
  private async sleeperGetLeagues(userId: string): Promise<any[]> {
    try {
      const response = await this.sleeperRequest(`/user/${userId}/leagues/nfl/2024`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Sleeper leagues fetch failed:', error);
      return [];
    }
  }

  private async sleeperGetTeams(leagueId: string): Promise<any[]> {
    try {
      const [usersResponse, rostersResponse] = await Promise.all([
        this.sleeperRequest(`/league/${leagueId}/users`),
        this.sleeperRequest(`/league/${leagueId}/rosters`)
      ]);
      
      const users = usersResponse || [];
      const rosters = rostersResponse || [];
      
      // Combine user data with roster data to create teams
      return rosters.map((roster: any) => {
        const owner = users.find((user: any) => user.user_id === roster.owner_id);
        return {
          ...roster,
          owner,
          displayName: owner?.display_name || `Team ${roster.roster_id}`
        };
      });
    } catch (error) {
      console.error('Sleeper teams fetch failed:', error);
      return [];
    }
  }

  private async sleeperRequest(endpoint: string): Promise<any> {
    // Sleeper API is public, no auth required
    const response = await fetch(`${FANTASY_PROVIDERS.sleeper.apiBaseUrl}${endpoint}`, {
      headers: {
        Accept: "application/json",
        'User-Agent': 'Fantasy.AI/1.0'
      },
    });

    if (!response.ok) {
      throw new Error(`Sleeper API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // =============================================================================
  // 🔄 DATA TRANSFORMATION METHODS
  // =============================================================================

  /**
   * Transform provider-specific league data to standard format
   */
  private transformLeague(rawLeague: any): ProviderLeague {
    switch (this.provider) {
      case 'yahoo':
        return this.transformYahooLeague(rawLeague);
      case 'espn':
        return this.transformEspnLeague(rawLeague);
      case 'cbs':
        return this.transformCbsLeague(rawLeague);
      case 'sleeper':
        return this.transformSleeperLeague(rawLeague);
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  private transformYahooLeague(league: any): ProviderLeague {
    const leagueData = Array.isArray(league) ? league[0] : league;
    const settings = Array.isArray(leagueData) ? leagueData[1] : leagueData;
    
    return {
      id: settings?.league_key || leagueData?.league_key || '',
      name: settings?.name || leagueData?.name || 'Unknown League',
      sport: 'nfl',
      season: settings?.season || '2024',
      settings: {
        teamCount: settings?.num_teams || 12,
        rosterSize: settings?.roster_positions?.length || 16,
        playoffWeeks: [14, 15, 16, 17],
        scoringType: settings?.scoring_type === '1' ? 'ppr' : 'standard'
      },
      isActive: true,
      metadata: leagueData
    };
  }

  private transformEspnLeague(league: any): ProviderLeague {
    return {
      id: league.id?.toString() || '',
      name: league.settings?.name || 'Unknown League',
      sport: 'nfl',
      season: league.seasonId?.toString() || '2024',
      settings: {
        teamCount: league.settings?.size || 12,
        rosterSize: league.settings?.rosterSettings?.lineupSlotCounts?.length || 16,
        playoffWeeks: [14, 15, 16, 17],
        scoringType: league.settings?.scoringSettings?.scoringType === 1 ? 'ppr' : 'standard'
      },
      isActive: league.settings?.isActive || true,
      metadata: league
    };
  }

  private transformCbsLeague(league: any): ProviderLeague {
    return {
      id: league.id?.toString() || '',
      name: league.name || 'Unknown League',
      sport: 'football',
      season: league.season || '2024',
      settings: {
        teamCount: league.teamCount || 12,
        rosterSize: league.rosterSize || 16,
        playoffWeeks: league.playoffWeeks || [14, 15, 16, 17],
        scoringType: league.scoringType || 'standard'
      },
      isActive: league.isActive || true,
      metadata: league
    };
  }

  private transformSleeperLeague(league: any): ProviderLeague {
    return {
      id: league.league_id || '',
      name: league.name || 'Unknown League',
      sport: 'nfl',
      season: league.season || '2024',
      settings: {
        teamCount: league.total_rosters || 12,
        rosterSize: Object.keys(league.roster_positions || {}).length,
        playoffWeeks: [14, 15, 16, 17],
        scoringType: league.scoring_settings?.rec ? 'ppr' : 'standard'
      },
      isActive: league.status === 'in_season',
      metadata: league
    };
  }

  /**
   * Transform provider-specific team data to standard format
   */
  private transformTeam(rawTeam: any): ProviderTeam {
    switch (this.provider) {
      case 'yahoo':
        return this.transformYahooTeam(rawTeam);
      case 'espn':
        return this.transformEspnTeam(rawTeam);
      case 'cbs':
        return this.transformCbsTeam(rawTeam);
      case 'sleeper':
        return this.transformSleeperTeam(rawTeam);
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  private transformYahooTeam(team: any): ProviderTeam {
    const teamData = Array.isArray(team) ? team[0] : team;
    const settings = Array.isArray(teamData) ? teamData[1] : teamData;
    
    return {
      id: settings?.team_key || teamData?.team_key || '',
      name: settings?.name || teamData?.name || 'Unknown Team',
      abbrev: settings?.team_key?.split('.').pop() || '',
      ownerId: settings?.manager_id || '',
      ownerName: settings?.managers?.[0]?.manager?.nickname || 'Unknown Owner',
      record: {
        wins: parseInt(settings?.team_standings?.outcome_totals?.wins || '0'),
        losses: parseInt(settings?.team_standings?.outcome_totals?.losses || '0'),
        ties: parseInt(settings?.team_standings?.outcome_totals?.ties || '0')
      },
      points: {
        total: parseFloat(settings?.team_points?.total || '0'),
        average: parseFloat(settings?.team_points?.total || '0') / Math.max(1, parseInt(settings?.team_standings?.outcome_totals?.wins || '0') + parseInt(settings?.team_standings?.outcome_totals?.losses || '0'))
      },
      roster: (team.roster || []).map((player: any) => this.transformPlayer(player))
    };
  }

  private transformEspnTeam(team: any): ProviderTeam {
    return {
      id: team.id?.toString() || '',
      name: team.location + ' ' + team.nickname || 'Unknown Team',
      abbrev: team.abbrev || '',
      ownerId: team.primaryOwner || '',
      ownerName: team.owners?.[0]?.firstName + ' ' + team.owners?.[0]?.lastName || 'Unknown Owner',
      record: {
        wins: team.record?.overall?.wins || 0,
        losses: team.record?.overall?.losses || 0,
        ties: team.record?.overall?.ties || 0
      },
      points: {
        total: team.record?.overall?.pointsFor || 0,
        average: (team.record?.overall?.pointsFor || 0) / Math.max(1, (team.record?.overall?.wins || 0) + (team.record?.overall?.losses || 0))
      },
      roster: (team.roster?.entries || []).map((entry: any) => this.transformPlayer(entry.playerPoolEntry.player))
    };
  }

  private transformCbsTeam(team: any): ProviderTeam {
    return {
      id: team.id?.toString() || '',
      name: team.name || 'Unknown Team',
      abbrev: team.abbrev || '',
      ownerId: team.ownerId || '',
      ownerName: team.ownerName || 'Unknown Owner',
      record: {
        wins: team.wins || 0,
        losses: team.losses || 0,
        ties: team.ties || 0
      },
      points: {
        total: team.totalPoints || 0,
        average: team.averagePoints || 0
      },
      roster: (team.roster || []).map((player: any) => this.transformPlayer(player))
    };
  }

  private transformSleeperTeam(team: any): ProviderTeam {
    return {
      id: team.roster_id?.toString() || '',
      name: team.displayName || `Team ${team.roster_id}`,
      abbrev: `T${team.roster_id}`,
      ownerId: team.owner_id || '',
      ownerName: team.owner?.display_name || 'Unknown Owner',
      record: {
        wins: team.settings?.wins || 0,
        losses: team.settings?.losses || 0,
        ties: team.settings?.ties || 0
      },
      points: {
        total: team.settings?.fpts || 0,
        average: (team.settings?.fpts || 0) / Math.max(1, (team.settings?.wins || 0) + (team.settings?.losses || 0))
      },
      roster: (team.players || []).map((playerId: string) => ({ 
        id: playerId, 
        name: '', 
        position: '', 
        team: '', 
        status: 'active' as const, 
        stats: { season: {} }, 
        metadata: {} 
      }))
    };
  }

  /**
   * Transform provider-specific player data to standard format
   */
  private transformPlayer(rawPlayer: any): ProviderPlayer {
    return {
      id: rawPlayer.id?.toString() || rawPlayer.player_id || '',
      name: rawPlayer.name || rawPlayer.full_name || '',
      position: rawPlayer.position || rawPlayer.primary_position || '',
      team: rawPlayer.team || rawPlayer.team_abbrev || '',
      status: this.normalizePlayerStatus(rawPlayer.status || rawPlayer.injury_status),
      injuryStatus: rawPlayer.injury_status || rawPlayer.injury_note,
      stats: {
        season: rawPlayer.stats || {},
        lastGame: rawPlayer.last_game_stats || {},
        projections: rawPlayer.projections || {}
      },
      metadata: rawPlayer
    };
  }

  private normalizePlayerStatus(status: string): 'active' | 'injured' | 'bye' | 'suspended' {
    if (!status) return 'active';
    const s = status.toLowerCase();
    
    if (s.includes('injured') || s.includes('ir') || s.includes('out')) return 'injured';
    if (s.includes('bye')) return 'bye';
    if (s.includes('suspended')) return 'suspended';
    return 'active';
  }

  // =============================================================================
  // 🛠️ UTILITY METHODS
  // =============================================================================

  /**
   * Enforce rate limiting between API requests
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const delay = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Fallback data for when API calls fail
   */
  private getFallbackLeagues(userId: string): ProviderLeague[] {
    console.warn(`⚠️ Using fallback data for ${this.provider} leagues`);
    return [
      {
        id: `fallback_${this.provider}_${userId}`,
        name: `Sample ${this.provider.toUpperCase()} League`,
        sport: 'nfl',
        season: '2024',
        settings: {
          teamCount: 12,
          rosterSize: 16,
          playoffWeeks: [14, 15, 16, 17],
          scoringType: 'ppr'
        },
        isActive: true,
        metadata: { fallback: true }
      }
    ];
  }

  /**
   * Sync individual team to database
   */
  private async syncTeamToDatabase(team: ProviderTeam, leagueDbId: string): Promise<void> {
    try {
      // Find existing team or create new one
      let dbTeam = await prisma.team.findFirst({
        where: {
          leagueId: leagueDbId,
          name: team.name
        }
      });

      if (dbTeam) {
        // Update existing team
        dbTeam = await prisma.team.update({
          where: { id: dbTeam.id },
          data: {
            rank: 0, // Would calculate from standings
            points: team.points.total,
            wins: team.record.wins,
            losses: team.record.losses,
            ties: team.record.ties
          }
        });
      } else {
        // Create new team
        dbTeam = await prisma.team.create({
          data: {
            userId: team.ownerId,
            leagueId: leagueDbId,
            name: team.name,
            rank: 0,
            points: team.points.total,
            wins: team.record.wins,
            losses: team.record.losses,
            ties: team.record.ties
          }
        });
      }

      // Sync roster players
      for (const player of team.roster) {
        if (!player.id || !player.name) continue;
        
        try {
          // Create or update player
          const dbPlayer = await prisma.player.upsert({
            where: {
              externalId_leagueId: {
                externalId: player.id,
                leagueId: leagueDbId
              }
            },
            update: {
              name: player.name,
              position: player.position,
              team: player.team,
              stats: JSON.stringify(player.stats.season),
              projections: JSON.stringify(player.stats.projections),
              injuryStatus: player.injuryStatus
            },
            create: {
              externalId: player.id,
              name: player.name,
              position: player.position,
              team: player.team,
              leagueId: leagueDbId,
              stats: JSON.stringify(player.stats.season),
              projections: JSON.stringify(player.stats.projections),
              injuryStatus: player.injuryStatus
            }
          });

          // Find existing roster entry or create new one
          const existingRoster = await prisma.roster.findFirst({
            where: {
              teamId: dbTeam.id,
              playerId: dbPlayer.id,
              week: null
            }
          });

          if (existingRoster) {
            // Update existing roster entry
            await prisma.roster.update({
              where: { id: existingRoster.id },
              data: {
                position: player.roster?.slot || player.position,
                isStarter: player.roster?.isStarter ?? true
              }
            });
          } else {
            // Create new roster entry
            await prisma.roster.create({
              data: {
                teamId: dbTeam.id,
                playerId: dbPlayer.id,
                position: player.roster?.slot || player.position,
                isStarter: player.roster?.isStarter ?? true,
                week: null
              }
            });
          }
          
        } catch (playerError) {
          console.error(`Failed to sync player ${player.name}:`, playerError);
        }
      }
      
    } catch (error) {
      console.error(`Failed to sync team ${team.name}:`, error);
      throw error;
    }
  }

  /**
   * Get sync statistics
   */
  getSyncStats(): {
    provider: FantasyProvider;
    requestCount: number;
    cacheSize: number;
    lastRequestTime: Date;
  } {
    return {
      provider: this.provider,
      requestCount: this.requestCount,
      cacheSize: this.cache.size,
      lastRequestTime: new Date(this.lastRequestTime)
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log(`🗑️ Cleared ${this.provider} cache`);
  }
}

export function generateOAuthUrl(
  provider: FantasyProvider,
  clientId: string,
  redirectUri: string,
  state?: string
): string {
  const config = FANTASY_PROVIDERS[provider];
  
  if (!config.supportsOAuth) {
    throw new Error(`${config.displayName} does not support OAuth`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scope.join(" "),
    ...(state && { state }),
  });

  return `${config.authUrl}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  provider: FantasyProvider,
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
  const config = FANTASY_PROVIDERS[provider];

  if (!config.supportsOAuth) {
    throw new Error(`${config.displayName} does not support OAuth token exchange`);
  }

  try {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        'User-Agent': 'Fantasy.AI/1.0'
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Token exchange failed for ${provider}:`, errorData);
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
    }

    const tokenData = await response.json();
    
    // Validate token response
    if (!tokenData.access_token) {
      throw new Error('Invalid token response - missing access_token');
    }

    console.log(`✅ Successfully obtained ${provider} access token`);
    return tokenData;
    
  } catch (error) {
    console.error(`❌ Token exchange failed for ${provider}:`, error);
    throw error;
  }
}

// =============================================================================
// 🚀 FANTASY PROVIDER MANAGER
// =============================================================================

/**
 * High-level manager for coordinating multiple fantasy providers
 */
export class FantasyProviderManager {
  private providers = new Map<FantasyProvider, FantasyProviderAPI>();

  /**
   * Initialize a provider with authentication
   */
  initializeProvider(
    provider: FantasyProvider, 
    accessToken?: string, 
    cookieString?: string
  ): FantasyProviderAPI {
    const api = new FantasyProviderAPI(provider, accessToken, cookieString);
    this.providers.set(provider, api);
    
    console.log(`🔧 Initialized ${provider} provider`);
    return api;
  }

  /**
   * Get a provider API instance
   */
  getProvider(provider: FantasyProvider): FantasyProviderAPI | null {
    return this.providers.get(provider) || null;
  }

  /**
   * Sync all user leagues across all providers
   */
  async syncAllUserLeagues(userId: string): Promise<{
    success: boolean;
    results: Record<FantasyProvider, ProviderSyncResult[]>;
    totalLeagues: number;
    errors: string[];
  }> {
    const results: Record<FantasyProvider, ProviderSyncResult[]> = {
      yahoo: [],
      espn: [],
      cbs: [],
      sleeper: []
    };
    const errors: string[] = [];
    let totalLeagues = 0;

    console.log(`🔄 Starting full sync for user ${userId}...`);

    for (const [provider, api] of this.providers) {
      try {
        console.log(`📥 Syncing ${provider} leagues...`);
        
        // Get user's leagues for this provider
        const leagues = await api.getLeagues(userId);
        
        // Sync each league
        for (const league of leagues) {
          try {
            const syncResult = await api.syncLeagueToDatabase(league.id, userId);
            results[provider].push(syncResult);
            
            if (syncResult.success) {
              totalLeagues++;
              console.log(`✅ Synced ${provider} league: ${league.name}`);
            } else {
              errors.push(`${provider} league ${league.name}: ${syncResult.errors.join(', ')}`);
            }
          } catch (error) {
            const errorMsg = `Failed to sync ${provider} league ${league.id}: ${error}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }
        }
        
      } catch (error) {
        const errorMsg = `Failed to fetch ${provider} leagues: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    const success = errors.length === 0;
    console.log(`🏁 Sync completed. ${totalLeagues} leagues synced, ${errors.length} errors`);

    return {
      success,
      results,
      totalLeagues,
      errors
    };
  }

  /**
   * Get sync statistics across all providers
   */
  getAllSyncStats(): Record<FantasyProvider, any> {
    const stats: Record<FantasyProvider, any> = {
      yahoo: null,
      espn: null,
      cbs: null,
      sleeper: null
    };

    for (const [provider, api] of this.providers) {
      stats[provider] = api.getSyncStats();
    }

    return stats;
  }

  /**
   * Clear all provider caches
   */
  clearAllCaches(): void {
    for (const [provider, api] of this.providers) {
      api.clearCache();
    }
    console.log('🗑️ Cleared all provider caches');
  }

  /**
   * Get provider health status
   */
  async getProviderHealthStatus(): Promise<Record<FantasyProvider, {
    initialized: boolean;
    hasAuth: boolean;
    lastSync?: Date;
    errors: string[];
  }>> {
    const status: Record<FantasyProvider, any> = {
      yahoo: { initialized: false, hasAuth: false, errors: [] },
      espn: { initialized: false, hasAuth: false, errors: [] },
      cbs: { initialized: false, hasAuth: false, errors: [] },
      sleeper: { initialized: false, hasAuth: false, errors: [] }
    };

    for (const [provider, api] of this.providers) {
      const stats = api.getSyncStats();
      status[provider] = {
        initialized: true,
        hasAuth: provider === 'sleeper' || provider === 'espn', // Sleeper doesn't need auth, ESPN uses cookies
        lastSync: stats.lastRequestTime,
        errors: []
      };

      // Test a simple API call to check health
      try {
        await api.getLeagues('test_user');
      } catch (error) {
        status[provider].errors.push(`API test failed: ${error}`);
      }
    }

    return status;
  }
}

// =============================================================================
// 🛠️ UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a fantasy provider manager with common configurations
 */
export function createFantasyProviderManager(): FantasyProviderManager {
  const manager = new FantasyProviderManager();
  
  // Initialize Sleeper by default (no auth required)
  manager.initializeProvider('sleeper');
  
  return manager;
}

/**
 * Validate provider authentication requirements
 */
export function validateProviderAuth(
  provider: FantasyProvider,
  accessToken?: string,
  cookieString?: string
): { valid: boolean; error?: string } {
  const config = FANTASY_PROVIDERS[provider];
  
  switch (provider) {
    case 'yahoo':
    case 'cbs':
      if (!accessToken) {
        return { valid: false, error: `${config.displayName} requires OAuth access token` };
      }
      break;
    case 'espn':
      if (!cookieString) {
        return { valid: false, error: 'ESPN requires authentication cookies for private leagues' };
      }
      break;
    case 'sleeper':
      // No auth required for Sleeper
      break;
    default:
      return { valid: false, error: `Unsupported provider: ${provider}` };
  }
  
  return { valid: true };
}

/**
 * Get provider-specific setup instructions
 */
export function getProviderSetupInstructions(provider: FantasyProvider): {
  title: string;
  steps: string[];
  authType: 'oauth' | 'cookies' | 'none';
  difficulty: 'easy' | 'medium' | 'hard';
} {
  switch (provider) {
    case 'yahoo':
      return {
        title: 'Yahoo Fantasy Setup',
        steps: [
          'Create a Yahoo Developer App at developer.yahoo.com',
          'Configure OAuth redirect URI in your app settings',
          'Use the OAuth flow to get user consent',
          'Exchange authorization code for access token',
          'Store access token securely for API calls'
        ],
        authType: 'oauth',
        difficulty: 'medium'
      };
    
    case 'espn':
      return {
        title: 'ESPN Fantasy Setup',
        steps: [
          'User must be logged into ESPN Fantasy',
          'For private leagues, extract authentication cookies',
          'Include cookies in API requests',
          'Note: ESPN cookies expire periodically'
        ],
        authType: 'cookies',
        difficulty: 'hard'
      };
    
    case 'cbs':
      return {
        title: 'CBS Sports Fantasy Setup',
        steps: [
          'Register for CBS Sports API access',
          'Implement OAuth 2.0 flow',
          'Handle token refresh automatically',
          'Store tokens securely'
        ],
        authType: 'oauth',
        difficulty: 'medium'
      };
    
    case 'sleeper':
      return {
        title: 'Sleeper Fantasy Setup',
        steps: [
          'No authentication required!',
          'Use public API with username/user_id',
          'Start making API calls immediately'
        ],
        authType: 'none',
        difficulty: 'easy'
      };
    
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export default FantasyProviderManager;