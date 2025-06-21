"use client";

import { EventEmitter } from 'events';

export interface SportConfig {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  primaryColor: string;
  secondaryColor: string;
  season: {
    start: Date;
    end: Date;
    currentWeek?: number;
    totalWeeks?: number;
    currentSeason: string;
  };
  positions: Position[];
  scoringSettings: ScoringSettings;
  rosterSettings: RosterSettings;
  isActive: boolean;
}

export interface Position {
  id: string;
  name: string;
  shortName: string;
  minRequired: number;
  maxAllowed: number;
  displayOrder: number;
}

export interface ScoringSettings {
  [key: string]: {
    name: string;
    points: number;
    description: string;
  };
}

export interface RosterSettings {
  totalSlots: number;
  startingSlots: number;
  benchSlots: number;
  irSlots: number;
  positions: {
    [positionId: string]: {
      min: number;
      max: number;
    };
  };
}

export interface MultiSportPlayer {
  id: string;
  externalId: string;
  name: string;
  sport: string;
  position: string;
  team: string;
  league: string;
  stats: Record<string, any>;
  projections: Record<string, any>;
  injuryStatus?: string;
  imageUrl?: string;
  salary?: number; // For DFS
  ownership?: number; // For DFS
  fantasyPoints?: number;
  isActive: boolean;
  metadata: {
    experience: number;
    age: number;
    height?: string;
    weight?: string;
    college?: string;
    draftYear?: number;
    contracts?: any[];
  };
}

export interface GameSchedule {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: Date;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'POSTPONED';
  homeScore?: number;
  awayScore?: number;
  period?: string; // Quarter, Inning, Period, etc.
  timeRemaining?: string;
  venue?: string;
  weather?: {
    temperature?: number;
    conditions?: string;
    windSpeed?: number;
  };
}

export interface SportStats {
  playerId: string;
  sport: string;
  gameId?: string;
  season: string;
  week?: number;
  stats: Record<string, number>;
  fantasyPoints: number;
  gameDate: Date;
}

export enum SportType {
  NFL = 'NFL',
  NBA = 'NBA',
  MLB = 'MLB',
  NHL = 'NHL'
}

export class MultiSportService extends EventEmitter {
  private sportConfigs: Map<string, SportConfig> = new Map();
  private players: Map<string, Map<string, MultiSportPlayer>> = new Map(); // sport -> playerId -> player
  private schedules: Map<string, GameSchedule[]> = new Map(); // sport -> games
  private stats: Map<string, SportStats[]> = new Map(); // playerId -> stats

  constructor() {
    super();
    this.initializeSportConfigs();
    this.initializeMockData();
  }

  private initializeSportConfigs() {
    const configs: SportConfig[] = [
      {
        id: SportType.NFL,
        name: 'National Football League',
        shortName: 'NFL',
        icon: '🏈',
        primaryColor: '#013369',
        secondaryColor: '#d50a0a',
        season: {
          start: new Date('2024-09-01'),
          end: new Date('2025-02-15'),
          currentWeek: 8,
          totalWeeks: 18,
          currentSeason: '2024'
        },
        positions: [
          { id: 'QB', name: 'Quarterback', shortName: 'QB', minRequired: 1, maxAllowed: 3, displayOrder: 1 },
          { id: 'RB', name: 'Running Back', shortName: 'RB', minRequired: 2, maxAllowed: 6, displayOrder: 2 },
          { id: 'WR', name: 'Wide Receiver', shortName: 'WR', minRequired: 2, maxAllowed: 6, displayOrder: 3 },
          { id: 'TE', name: 'Tight End', shortName: 'TE', minRequired: 1, maxAllowed: 3, displayOrder: 4 },
          { id: 'K', name: 'Kicker', shortName: 'K', minRequired: 1, maxAllowed: 2, displayOrder: 5 },
          { id: 'DEF', name: 'Defense', shortName: 'D/ST', minRequired: 1, maxAllowed: 2, displayOrder: 6 }
        ],
        scoringSettings: {
          passingYards: { name: 'Passing Yards', points: 0.04, description: '1 point per 25 yards' },
          passingTouchdowns: { name: 'Passing Touchdowns', points: 4, description: '4 points each' },
          interceptions: { name: 'Interceptions', points: -2, description: '-2 points each' },
          rushingYards: { name: 'Rushing Yards', points: 0.1, description: '1 point per 10 yards' },
          rushingTouchdowns: { name: 'Rushing Touchdowns', points: 6, description: '6 points each' },
          receptions: { name: 'Receptions', points: 1, description: '1 point each (PPR)' },
          receivingYards: { name: 'Receiving Yards', points: 0.1, description: '1 point per 10 yards' },
          receivingTouchdowns: { name: 'Receiving Touchdowns', points: 6, description: '6 points each' }
        },
        rosterSettings: {
          totalSlots: 16,
          startingSlots: 9,
          benchSlots: 6,
          irSlots: 1,
          positions: {
            QB: { min: 1, max: 1 },
            RB: { min: 2, max: 2 },
            WR: { min: 2, max: 2 },
            TE: { min: 1, max: 1 },
            FLEX: { min: 1, max: 1 }, // RB/WR/TE
            K: { min: 1, max: 1 },
            DEF: { min: 1, max: 1 }
          }
        },
        isActive: true
      },
      {
        id: SportType.NBA,
        name: 'National Basketball Association',
        shortName: 'NBA',
        icon: '🏀',
        primaryColor: '#c8102e',
        secondaryColor: '#1d428a',
        season: {
          start: new Date('2024-10-15'),
          end: new Date('2025-06-15'),
          currentSeason: '2024-25'
        },
        positions: [
          { id: 'PG', name: 'Point Guard', shortName: 'PG', minRequired: 1, maxAllowed: 4, displayOrder: 1 },
          { id: 'SG', name: 'Shooting Guard', shortName: 'SG', minRequired: 1, maxAllowed: 4, displayOrder: 2 },
          { id: 'SF', name: 'Small Forward', shortName: 'SF', minRequired: 1, maxAllowed: 4, displayOrder: 3 },
          { id: 'PF', name: 'Power Forward', shortName: 'PF', minRequired: 1, maxAllowed: 4, displayOrder: 4 },
          { id: 'C', name: 'Center', shortName: 'C', minRequired: 1, maxAllowed: 3, displayOrder: 5 }
        ],
        scoringSettings: {
          points: { name: 'Points', points: 1, description: '1 point each' },
          rebounds: { name: 'Rebounds', points: 1.2, description: '1.2 points each' },
          assists: { name: 'Assists', points: 1.5, description: '1.5 points each' },
          steals: { name: 'Steals', points: 3, description: '3 points each' },
          blocks: { name: 'Blocks', points: 3, description: '3 points each' },
          turnovers: { name: 'Turnovers', points: -1, description: '-1 point each' },
          threePointers: { name: 'Three Pointers Made', points: 0.5, description: '+0.5 bonus points' }
        },
        rosterSettings: {
          totalSlots: 13,
          startingSlots: 8,
          benchSlots: 4,
          irSlots: 1,
          positions: {
            PG: { min: 1, max: 1 },
            SG: { min: 1, max: 1 },
            SF: { min: 1, max: 1 },
            PF: { min: 1, max: 1 },
            C: { min: 1, max: 1 },
            G: { min: 1, max: 1 }, // PG/SG
            F: { min: 1, max: 1 }, // SF/PF
            UTIL: { min: 1, max: 1 } // Any position
          }
        },
        isActive: true
      },
      {
        id: SportType.MLB,
        name: 'Major League Baseball',
        shortName: 'MLB',
        icon: '⚾',
        primaryColor: '#041e42',
        secondaryColor: '#c8102e',
        season: {
          start: new Date('2024-03-20'),
          end: new Date('2024-11-01'),
          currentSeason: '2024'
        },
        positions: [
          { id: 'C', name: 'Catcher', shortName: 'C', minRequired: 1, maxAllowed: 3, displayOrder: 1 },
          { id: '1B', name: 'First Base', shortName: '1B', minRequired: 1, maxAllowed: 2, displayOrder: 2 },
          { id: '2B', name: 'Second Base', shortName: '2B', minRequired: 1, maxAllowed: 2, displayOrder: 3 },
          { id: '3B', name: 'Third Base', shortName: '3B', minRequired: 1, maxAllowed: 2, displayOrder: 4 },
          { id: 'SS', name: 'Shortstop', shortName: 'SS', minRequired: 1, maxAllowed: 2, displayOrder: 5 },
          { id: 'OF', name: 'Outfield', shortName: 'OF', minRequired: 3, maxAllowed: 6, displayOrder: 6 },
          { id: 'SP', name: 'Starting Pitcher', shortName: 'SP', minRequired: 2, maxAllowed: 5, displayOrder: 7 },
          { id: 'RP', name: 'Relief Pitcher', shortName: 'RP', minRequired: 2, maxAllowed: 4, displayOrder: 8 }
        ],
        scoringSettings: {
          hits: { name: 'Hits', points: 3, description: '3 points each' },
          runs: { name: 'Runs', points: 2, description: '2 points each' },
          rbis: { name: 'RBIs', points: 2, description: '2 points each' },
          homeRuns: { name: 'Home Runs', points: 5, description: '5 points each' },
          stoleBases: { name: 'Stolen Bases', points: 2, description: '2 points each' },
          walks: { name: 'Walks', points: 1, description: '1 point each' },
          strikeouts: { name: 'Strikeouts (Batter)', points: -1, description: '-1 point each' },
          wins: { name: 'Wins (Pitcher)', points: 7, description: '7 points each' },
          saves: { name: 'Saves', points: 5, description: '5 points each' },
          strikeoutsPitcher: { name: 'Strikeouts (Pitcher)', points: 1, description: '1 point each' }
        },
        rosterSettings: {
          totalSlots: 23,
          startingSlots: 14,
          benchSlots: 8,
          irSlots: 1,
          positions: {
            C: { min: 1, max: 1 },
            '1B': { min: 1, max: 1 },
            '2B': { min: 1, max: 1 },
            '3B': { min: 1, max: 1 },
            SS: { min: 1, max: 1 },
            OF: { min: 3, max: 3 },
            UTIL: { min: 1, max: 1 },
            SP: { min: 2, max: 2 },
            RP: { min: 2, max: 2 },
            P: { min: 2, max: 2 } // Any pitcher
          }
        },
        isActive: false // Off-season
      },
      {
        id: SportType.NHL,
        name: 'National Hockey League',
        shortName: 'NHL',
        icon: '🏒',
        primaryColor: '#000000',
        secondaryColor: '#c8102e',
        season: {
          start: new Date('2024-10-01'),
          end: new Date('2025-06-15'),
          currentSeason: '2024-25'
        },
        positions: [
          { id: 'C', name: 'Center', shortName: 'C', minRequired: 1, maxAllowed: 4, displayOrder: 1 },
          { id: 'LW', name: 'Left Wing', shortName: 'LW', minRequired: 1, maxAllowed: 4, displayOrder: 2 },
          { id: 'RW', name: 'Right Wing', shortName: 'RW', minRequired: 1, maxAllowed: 4, displayOrder: 3 },
          { id: 'D', name: 'Defense', shortName: 'D', minRequired: 2, maxAllowed: 6, displayOrder: 4 },
          { id: 'G', name: 'Goalie', shortName: 'G', minRequired: 1, maxAllowed: 3, displayOrder: 5 }
        ],
        scoringSettings: {
          goals: { name: 'Goals', points: 6, description: '6 points each' },
          assists: { name: 'Assists', points: 4, description: '4 points each' },
          powerPlayPoints: { name: 'Power Play Points', points: 1, description: '+1 bonus point' },
          shortHandedPoints: { name: 'Short Handed Points', points: 2, description: '+2 bonus points' },
          shots: { name: 'Shots on Goal', points: 0.9, description: '0.9 points each' },
          hits: { name: 'Hits', points: 0.6, description: '0.6 points each' },
          blocks: { name: 'Blocked Shots', points: 1, description: '1 point each' },
          wins: { name: 'Wins (Goalie)', points: 5, description: '5 points each' },
          saves: { name: 'Saves', points: 0.6, description: '0.6 points each' },
          shutouts: { name: 'Shutouts', points: 5, description: '5 points each' }
        },
        rosterSettings: {
          totalSlots: 16,
          startingSlots: 9,
          benchSlots: 6,
          irSlots: 1,
          positions: {
            C: { min: 1, max: 1 },
            LW: { min: 1, max: 1 },
            RW: { min: 1, max: 1 },
            D: { min: 2, max: 2 },
            G: { min: 1, max: 1 },
            W: { min: 1, max: 1 }, // LW/RW
            F: { min: 1, max: 1 }, // C/LW/RW
            UTIL: { min: 1, max: 1 } // Any skater
          }
        },
        isActive: true
      }
    ];

    configs.forEach(config => this.sportConfigs.set(config.id, config));
  }

  private initializeMockData() {
    // Initialize players for each sport
    this.initializeNBAPlayers();
    this.initializeMLBPlayers();
    this.initializeNHLPlayers();
    this.initializeSchedules();
  }

  private initializeNBAPlayers() {
    const nbaPlayers: MultiSportPlayer[] = [
      {
        id: 'nba_lebron',
        externalId: 'nba_2544',
        name: 'LeBron James',
        sport: SportType.NBA,
        position: 'SF',
        team: 'LAL',
        league: 'NBA',
        stats: {
          points: 25.2,
          rebounds: 7.8,
          assists: 6.9,
          steals: 1.3,
          blocks: 0.6,
          turnovers: 3.8,
          fieldGoalPct: 0.542,
          threePointPct: 0.385
        },
        projections: {
          points: 24.8,
          rebounds: 8.1,
          assists: 7.2,
          fantasyPoints: 48.5
        },
        salary: 11500,
        ownership: 15.2,
        fantasyPoints: 46.8,
        isActive: true,
        metadata: {
          experience: 21,
          age: 39,
          height: '6\'9"',
          weight: '250 lbs',
          college: 'None',
          draftYear: 2003
        }
      },
      {
        id: 'nba_luka',
        externalId: 'nba_1629029',
        name: 'Luka Dončić',
        sport: SportType.NBA,
        position: 'PG',
        team: 'DAL',
        league: 'NBA',
        stats: {
          points: 32.8,
          rebounds: 9.1,
          assists: 8.3,
          steals: 1.4,
          blocks: 0.5,
          turnovers: 4.1,
          fieldGoalPct: 0.487,
          threePointPct: 0.357
        },
        projections: {
          points: 33.5,
          rebounds: 9.0,
          assists: 8.5,
          fantasyPoints: 58.2
        },
        salary: 12000,
        ownership: 22.1,
        fantasyPoints: 57.3,
        isActive: true,
        metadata: {
          experience: 6,
          age: 25,
          height: '6\'7"',
          weight: '230 lbs',
          college: 'None',
          draftYear: 2018
        }
      }
    ];

    this.players.set(SportType.NBA, new Map());
    nbaPlayers.forEach(player => {
      this.players.get(SportType.NBA)!.set(player.id, player);
    });
  }

  private initializeMLBPlayers() {
    const mlbPlayers: MultiSportPlayer[] = [
      {
        id: 'mlb_trout',
        externalId: 'mlb_545361',
        name: 'Mike Trout',
        sport: SportType.MLB,
        position: 'OF',
        team: 'LAA',
        league: 'MLB',
        stats: {
          battingAvg: 0.283,
          homeRuns: 10,
          rbis: 14,
          runs: 6,
          stoleBases: 1,
          walks: 6,
          strikeouts: 17
        },
        projections: {
          homeRuns: 35,
          rbis: 85,
          runs: 95,
          fantasyPoints: 285
        },
        salary: 11000,
        ownership: 8.5,
        fantasyPoints: 48.2,
        isActive: false, // Injured
        injuryStatus: 'Out - Wrist surgery',
        metadata: {
          experience: 13,
          age: 32,
          height: '6\'2"',
          weight: '235 lbs',
          college: 'None',
          draftYear: 2009
        }
      }
    ];

    this.players.set(SportType.MLB, new Map());
    mlbPlayers.forEach(player => {
      this.players.get(SportType.MLB)!.set(player.id, player);
    });
  }

  private initializeNHLPlayers() {
    const nhlPlayers: MultiSportPlayer[] = [
      {
        id: 'nhl_mcdavid',
        externalId: 'nhl_8478402',
        name: 'Connor McDavid',
        sport: SportType.NHL,
        position: 'C',
        team: 'EDM',
        league: 'NHL',
        stats: {
          goals: 5,
          assists: 10,
          points: 15,
          powerPlayPoints: 6,
          shots: 28,
          hits: 8,
          blocks: 2
        },
        projections: {
          goals: 65,
          assists: 85,
          points: 150,
          fantasyPoints: 320
        },
        salary: 12500,
        ownership: 18.7,
        fantasyPoints: 52.8,
        isActive: true,
        metadata: {
          experience: 9,
          age: 27,
          height: '6\'1"',
          weight: '193 lbs',
          college: 'None',
          draftYear: 2015
        }
      }
    ];

    this.players.set(SportType.NHL, new Map());
    nhlPlayers.forEach(player => {
      this.players.get(SportType.NHL)!.set(player.id, player);
    });
  }

  private initializeSchedules() {
    // Mock schedules for each sport
    const today = new Date();
    
    // NBA Schedule
    const nbaSchedule: GameSchedule[] = [
      {
        id: 'nba_game_1',
        sport: SportType.NBA,
        homeTeam: 'LAL',
        awayTeam: 'GSW',
        gameDate: new Date(today.getTime() + 86400000), // Tomorrow
        status: 'SCHEDULED',
        venue: 'Crypto.com Arena'
      },
      {
        id: 'nba_game_2',
        sport: SportType.NBA,
        homeTeam: 'BOS',
        awayTeam: 'MIA',
        gameDate: new Date(today.getTime() + 172800000), // Day after tomorrow
        status: 'SCHEDULED',
        venue: 'TD Garden'
      }
    ];

    // NHL Schedule
    const nhlSchedule: GameSchedule[] = [
      {
        id: 'nhl_game_1',
        sport: SportType.NHL,
        homeTeam: 'EDM',
        awayTeam: 'CGY',
        gameDate: new Date(today.getTime() + 3600000), // 1 hour from now
        status: 'SCHEDULED',
        venue: 'Rogers Place'
      }
    ];

    this.schedules.set(SportType.NBA, nbaSchedule);
    this.schedules.set(SportType.NHL, nhlSchedule);
    this.schedules.set(SportType.MLB, []); // Off-season
  }

  async getSportConfigs(): Promise<SportConfig[]> {
    return Array.from(this.sportConfigs.values());
  }

  async getSportConfig(sportId: string): Promise<SportConfig | null> {
    return this.sportConfigs.get(sportId) || null;
  }

  async getActiveSports(): Promise<SportConfig[]> {
    return Array.from(this.sportConfigs.values()).filter(config => config.isActive);
  }

  async getPlayers(sport: string, options?: {
    position?: string;
    team?: string;
    limit?: number;
    active?: boolean;
  }): Promise<MultiSportPlayer[]> {
    const sportPlayers = this.players.get(sport);
    if (!sportPlayers) return [];

    let players = Array.from(sportPlayers.values());

    if (options?.position) {
      players = players.filter(p => p.position === options.position);
    }

    if (options?.team) {
      players = players.filter(p => p.team === options.team);
    }

    if (options?.active !== undefined) {
      players = players.filter(p => p.isActive === options.active);
    }

    // Sort by fantasy points descending
    players.sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0));

    return players.slice(0, options?.limit || players.length);
  }

  async getPlayer(sport: string, playerId: string): Promise<MultiSportPlayer | null> {
    const sportPlayers = this.players.get(sport);
    return sportPlayers?.get(playerId) || null;
  }

  async getSchedule(sport: string, date?: Date): Promise<GameSchedule[]> {
    const schedule = this.schedules.get(sport) || [];
    
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      return schedule.filter(game => {
        const gameDate = new Date(game.gameDate);
        gameDate.setHours(0, 0, 0, 0);
        return gameDate.getTime() === targetDate.getTime();
      });
    }

    return schedule;
  }

  async getLiveGames(sport: string): Promise<GameSchedule[]> {
    const schedule = this.schedules.get(sport) || [];
    return schedule.filter(game => game.status === 'LIVE');
  }

  async getPlayerStats(sport: string, playerId: string, season?: string): Promise<SportStats[]> {
    // Mock stats retrieval
    return this.stats.get(playerId) || [];
  }

  async calculateFantasyPoints(sport: string, stats: Record<string, number>): Promise<number> {
    const config = this.sportConfigs.get(sport);
    if (!config) return 0;

    let totalPoints = 0;
    
    for (const [statKey, statValue] of Object.entries(stats)) {
      const scoringSetting = config.scoringSettings[statKey];
      if (scoringSetting) {
        totalPoints += statValue * scoringSetting.points;
      }
    }

    return Math.round(totalPoints * 100) / 100;
  }

  async getTopPerformers(sport: string, timeframe: 'day' | 'week' | 'month' | 'season'): Promise<MultiSportPlayer[]> {
    const players = await this.getPlayers(sport, { active: true });
    
    // Sort by fantasy points (mock implementation)
    return players
      .sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0))
      .slice(0, 10);
  }

  async getPositionRankings(sport: string, position: string): Promise<MultiSportPlayer[]> {
    return this.getPlayers(sport, { position, active: true });
  }

  async searchPlayers(sport: string, query: string): Promise<MultiSportPlayer[]> {
    const players = await this.getPlayers(sport);
    const searchTerm = query.toLowerCase();
    
    return players.filter(player =>
      player.name.toLowerCase().includes(searchTerm) ||
      player.team.toLowerCase().includes(searchTerm) ||
      player.position.toLowerCase().includes(searchTerm)
    );
  }

  // Cross-sport utilities
  async getAllActivePlayers(): Promise<Map<string, MultiSportPlayer[]>> {
    const result = new Map<string, MultiSportPlayer[]>();
    const activeSports = await this.getActiveSports();
    
    for (const sport of activeSports) {
      const players = await this.getPlayers(sport.id, { active: true });
      result.set(sport.id, players);
    }
    
    return result;
  }

  async getUpcomingGames(hoursAhead: number = 24): Promise<Map<string, GameSchedule[]>> {
    const result = new Map<string, GameSchedule[]>();
    const cutoffTime = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    
    for (const [sport, schedule] of this.schedules) {
      const upcomingGames = schedule.filter(game => 
        game.gameDate <= cutoffTime && game.status === 'SCHEDULED'
      );
      result.set(sport, upcomingGames);
    }
    
    return result;
  }
}

export const multiSportService = new MultiSportService();