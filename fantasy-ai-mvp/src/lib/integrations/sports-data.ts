import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis/redis-client';

export interface SportsAPIConfig {
  provider: 'espn' | 'yahoo' | 'sleeper' | 'draftkings' | 'fanduel';
  apiKey?: string;
  baseUrl: string;
  rateLimitPerHour: number;
}

export interface PlayerData {
  externalId: string;
  name: string;
  position: string;
  team: string;
  stats: Record<string, number>;
  projections: Record<string, number>;
  injury?: {
    status: 'healthy' | 'questionable' | 'doubtful' | 'out';
    description?: string;
  };
  lastUpdated: Date;
}

export interface GameData {
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: Date;
  weather?: {
    temperature: number;
    windSpeed: number;
    precipitation: number;
    dome: boolean;
  };
  status: 'scheduled' | 'in_progress' | 'completed';
  score?: {
    home: number;
    away: number;
  };
}

export class SportsDataIntegrator {
  private providers: Map<string, SportsAPIConfig> = new Map();
  private requestCounts: Map<string, number> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // ESPN API
    this.providers.set('espn', {
      provider: 'espn',
      baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
      rateLimitPerHour: 1000
    });

    // Yahoo Fantasy API
    this.providers.set('yahoo', {
      provider: 'yahoo',
      apiKey: process.env.YAHOO_API_KEY,
      baseUrl: 'https://fantasysports.yahooapis.com/fantasy/v2',
      rateLimitPerHour: 500
    });

    // Sleeper API
    this.providers.set('sleeper', {
      provider: 'sleeper',
      baseUrl: 'https://api.sleeper.app/v1',
      rateLimitPerHour: 1000
    });

    // DraftKings API (for odds/projections)
    this.providers.set('draftkings', {
      provider: 'draftkings',
      apiKey: process.env.DRAFTKINGS_API_KEY,
      baseUrl: 'https://api.draftkings.com',
      rateLimitPerHour: 200
    });
  }

  /**
   * Fetch player data from multiple sources
   */
  async fetchPlayersData(sport: 'nfl' | 'nba' | 'mlb' | 'nhl'): Promise<PlayerData[]> {
    const cacheKey = `sports:players:${sport}`;
    
    // Check cache first
    const cached = await cache.get<PlayerData[]>(cacheKey);
    if (cached) {
      console.log(`✅ Using cached player data for ${sport.toUpperCase()}`);
      return cached;
    }

    console.log(`🔄 Fetching fresh player data for ${sport.toUpperCase()}...`);
    
    const players: PlayerData[] = [];

    try {
      // Fetch from ESPN
      const espnPlayers = await this.fetchFromESPN(sport);
      players.push(...espnPlayers);

      // Fetch from Sleeper (has good player data)
      const sleeperPlayers = await this.fetchFromSleeper(sport);
      players.push(...sleeperPlayers);

      // Merge and deduplicate players
      const mergedPlayers = this.mergePlayerData(players);

      // Cache for 30 minutes
      await cache.set(cacheKey, mergedPlayers, 1800);

      console.log(`✅ Fetched ${mergedPlayers.length} players for ${sport.toUpperCase()}`);
      return mergedPlayers;

    } catch (error) {
      console.error(`Error fetching player data for ${sport}:`, error);
      
      // Return mock data if APIs fail
      return this.generateMockPlayers(sport);
    }
  }

  /**
   * Fetch games/schedule data
   */
  async fetchGamesData(sport: 'nfl' | 'nba' | 'mlb' | 'nhl', week?: number): Promise<GameData[]> {
    const cacheKey = `sports:games:${sport}:${week || 'current'}`;
    
    const cached = await cache.get<GameData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const games = await this.fetchFromESPNSchedule(sport, week);
      
      // Cache for 15 minutes
      await cache.set(cacheKey, games, 900);
      
      return games;
    } catch (error) {
      console.error(`Error fetching games data for ${sport}:`, error);
      return this.generateMockGames(sport);
    }
  }

  /**
   * Sync player data to database
   */
  async syncPlayersToDatabase(sport: 'nfl' | 'nba' | 'mlb' | 'nhl'): Promise<number> {
    const players = await this.fetchPlayersData(sport);
    let syncedCount = 0;

    for (const playerData of players) {
      try {
        await prisma.player.upsert({
          where: {
            externalId: playerData.externalId
          },
          create: {
            externalId: playerData.externalId,
            name: playerData.name,
            position: playerData.position,
            team: playerData.team,
            sport: sport.toUpperCase(),
            isActive: true
          },
          update: {
            name: playerData.name,
            position: playerData.position,
            team: playerData.team,
            isActive: true
          }
        });

        // Sync stats if available
        if (Object.keys(playerData.stats).length > 0) {
          await this.syncPlayerStats(playerData);
        }

        // Sync projections if available
        if (Object.keys(playerData.projections).length > 0) {
          await this.syncPlayerProjections(playerData);
        }

        // Sync injury data if available
        if (playerData.injury) {
          await this.syncPlayerInjury(playerData);
        }

        syncedCount++;
      } catch (error) {
        console.error(`Error syncing player ${playerData.name}:`, error);
      }
    }

    console.log(`✅ Synced ${syncedCount} players to database for ${sport.toUpperCase()}`);
    return syncedCount;
  }

  /**
   * Fetch from ESPN API
   */
  private async fetchFromESPN(sport: string): Promise<PlayerData[]> {
    if (!this.checkRateLimit('espn')) {
      throw new Error('ESPN API rate limit exceeded');
    }

    const sportMap = {
      nfl: 'football/nfl',
      nba: 'basketball/nba',
      mlb: 'baseball/mlb',
      nhl: 'hockey/nhl'
    };

    const endpoint = `${this.providers.get('espn')!.baseUrl}/${sportMap[sport]}/athletes`;
    
    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'FantasyAI/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status}`);
      }

      const data = await response.json();
      this.incrementRequestCount('espn');

      return this.parseESPNPlayers(data, sport);
    } catch (error) {
      console.error('ESPN API fetch error:', error);
      throw error;
    }
  }

  /**
   * Fetch from Sleeper API
   */
  private async fetchFromSleeper(sport: string): Promise<PlayerData[]> {
    if (!this.checkRateLimit('sleeper')) {
      throw new Error('Sleeper API rate limit exceeded');
    }

    const endpoint = `${this.providers.get('sleeper')!.baseUrl}/players/${sport}`;
    
    try {
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Sleeper API error: ${response.status}`);
      }

      const data = await response.json();
      this.incrementRequestCount('sleeper');

      return this.parseSleeperPlayers(data, sport);
    } catch (error) {
      console.error('Sleeper API fetch error:', error);
      throw error;
    }
  }

  /**
   * Fetch schedule from ESPN
   */
  private async fetchFromESPNSchedule(sport: string, week?: number): Promise<GameData[]> {
    const sportMap = {
      nfl: 'football/nfl',
      nba: 'basketball/nba',
      mlb: 'baseball/mlb',
      nhl: 'hockey/nhl'
    };

    let endpoint = `${this.providers.get('espn')!.baseUrl}/${sportMap[sport]}/scoreboard`;
    if (week && sport === 'nfl') {
      endpoint += `?week=${week}`;
    }

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      return this.parseESPNGames(data);
    } catch (error) {
      console.error('ESPN schedule fetch error:', error);
      throw error;
    }
  }

  /**
   * Parse ESPN player data
   */
  private parseESPNPlayers(data: any, sport: string): PlayerData[] {
    if (!data.athletes) return [];

    return data.athletes.map((athlete: any) => ({
      externalId: `espn_${athlete.id}`,
      name: athlete.displayName || athlete.name,
      position: athlete.position?.abbreviation || 'UNKNOWN',
      team: athlete.team?.abbreviation || 'FA',
      stats: {},
      projections: {},
      lastUpdated: new Date()
    }));
  }

  /**
   * Parse Sleeper player data
   */
  private parseSleeperPlayers(data: any, sport: string): PlayerData[] {
    if (!data || typeof data !== 'object') return [];

    return Object.values(data).map((player: any) => ({
      externalId: `sleeper_${player.player_id}`,
      name: `${player.first_name} ${player.last_name}`.trim(),
      position: player.position || 'UNKNOWN',
      team: player.team || 'FA',
      stats: {},
      projections: {},
      injury: player.injury_status ? {
        status: this.mapInjuryStatus(player.injury_status),
        description: player.injury_notes
      } : undefined,
      lastUpdated: new Date()
    }));
  }

  /**
   * Parse ESPN games data
   */
  private parseESPNGames(data: any): GameData[] {
    if (!data.events) return [];

    return data.events.map((event: any) => {
      const competition = event.competitions[0];
      const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home');
      const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away');

      return {
        externalId: `espn_${event.id}`,
        homeTeam: homeTeam?.team?.abbreviation || 'TBD',
        awayTeam: awayTeam?.team?.abbreviation || 'TBD',
        gameTime: new Date(event.date),
        status: this.mapGameStatus(event.status.type.name),
        score: event.status.type.completed ? {
          home: parseInt(homeTeam?.score || '0'),
          away: parseInt(awayTeam?.score || '0')
        } : undefined
      };
    });
  }

  /**
   * Helper methods
   */
  private checkRateLimit(provider: string): boolean {
    const config = this.providers.get(provider);
    if (!config) return false;

    const currentCount = this.requestCounts.get(provider) || 0;
    return currentCount < config.rateLimitPerHour;
  }

  private incrementRequestCount(provider: string): void {
    const current = this.requestCounts.get(provider) || 0;
    this.requestCounts.set(provider, current + 1);
  }

  private mapInjuryStatus(status: string): 'healthy' | 'questionable' | 'doubtful' | 'out' {
    const statusMap: Record<string, 'healthy' | 'questionable' | 'doubtful' | 'out'> = {
      'Healthy': 'healthy',
      'Questionable': 'questionable',
      'Doubtful': 'doubtful',
      'Out': 'out',
      'IR': 'out',
      'PUP': 'out'
    };
    return statusMap[status] || 'healthy';
  }

  private mapGameStatus(status: string): 'scheduled' | 'in_progress' | 'completed' {
    if (status.includes('Final')) return 'completed';
    if (status.includes('In Progress') || status.includes('Halftime')) return 'in_progress';
    return 'scheduled';
  }

  private mergePlayerData(players: PlayerData[]): PlayerData[] {
    const playerMap = new Map<string, PlayerData>();

    for (const player of players) {
      const key = `${player.name}_${player.position}_${player.team}`;
      
      if (playerMap.has(key)) {
        // Merge data from multiple sources
        const existing = playerMap.get(key)!;
        existing.stats = { ...existing.stats, ...player.stats };
        existing.projections = { ...existing.projections, ...player.projections };
        
        // Use most recent injury data
        if (player.injury && (!existing.injury || player.lastUpdated > existing.lastUpdated)) {
          existing.injury = player.injury;
        }
      } else {
        playerMap.set(key, player);
      }
    }

    return Array.from(playerMap.values());
  }

  private async syncPlayerStats(playerData: PlayerData): Promise<void> {
    const player = await prisma.player.findUnique({
      where: { externalId: playerData.externalId }
    });

    if (!player) return;

    await prisma.playerStats.create({
      data: {
        playerId: player.id,
        week: this.getCurrentWeek(),
        season: new Date().getFullYear(),
        fantasyPoints: playerData.stats.fantasyPoints || 0,
        passingYards: playerData.stats.passingYards || 0,
        passingTDs: playerData.stats.passingTDs || 0,
        rushingYards: playerData.stats.rushingYards || 0,
        rushingTDs: playerData.stats.rushingTDs || 0,
        receivingYards: playerData.stats.receivingYards || 0,
        receivingTDs: playerData.stats.receivingTDs || 0,
        receptions: playerData.stats.receptions || 0
      }
    });
  }

  private async syncPlayerProjections(playerData: PlayerData): Promise<void> {
    const player = await prisma.player.findUnique({
      where: { externalId: playerData.externalId }
    });

    if (!player) return;

    await prisma.playerProjection.upsert({
      where: {
        playerId_week_season: {
          playerId: player.id,
          week: this.getCurrentWeek(),
          season: new Date().getFullYear()
        }
      },
      create: {
        playerId: player.id,
        week: this.getCurrentWeek(),
        season: new Date().getFullYear(),
        projectedPoints: playerData.projections.fantasyPoints || 0,
        confidence: playerData.projections.confidence || 0.7
      },
      update: {
        projectedPoints: playerData.projections.fantasyPoints || 0,
        confidence: playerData.projections.confidence || 0.7
      }
    });
  }

  private async syncPlayerInjury(playerData: PlayerData): Promise<void> {
    if (!playerData.injury) return;

    const player = await prisma.player.findUnique({
      where: { externalId: playerData.externalId }
    });

    if (!player) return;

    await prisma.playerInjury.upsert({
      where: {
        playerId: player.id
      },
      create: {
        playerId: player.id,
        status: playerData.injury.status,
        description: playerData.injury.description,
        reportedDate: new Date()
      },
      update: {
        status: playerData.injury.status,
        description: playerData.injury.description,
        reportedDate: new Date()
      }
    });
  }

  private getCurrentWeek(): number {
    // Simple week calculation - would need sport-specific logic
    const startOfSeason = new Date('2024-09-01');
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startOfSeason.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  }

  private generateMockPlayers(sport: string): PlayerData[] {
    // Return mock data as fallback
    const positions = {
      nfl: ['QB', 'RB', 'WR', 'TE', 'K', 'DST'],
      nba: ['PG', 'SG', 'SF', 'PF', 'C'],
      mlb: ['P', 'C', '1B', '2B', '3B', 'SS', 'OF'],
      nhl: ['G', 'D', 'LW', 'RW', 'C']
    };

    const mockPlayers: PlayerData[] = [];
    const sportPositions = positions[sport] || ['PLAYER'];

    for (let i = 0; i < 50; i++) {
      mockPlayers.push({
        externalId: `mock_${sport}_${i}`,
        name: `Player ${i + 1}`,
        position: sportPositions[i % sportPositions.length],
        team: 'TEAM',
        stats: { fantasyPoints: Math.random() * 20 },
        projections: { fantasyPoints: Math.random() * 25 },
        lastUpdated: new Date()
      });
    }

    return mockPlayers;
  }

  private generateMockGames(sport: string): GameData[] {
    const mockGames: GameData[] = [];
    
    for (let i = 0; i < 10; i++) {
      mockGames.push({
        externalId: `mock_game_${i}`,
        homeTeam: `HOME${i}`,
        awayTeam: `AWAY${i}`,
        gameTime: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        status: 'scheduled'
      });
    }

    return mockGames;
  }
}

// Export singleton
export const sportsDataIntegrator = new SportsDataIntegrator();