export interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  jerseyNumber?: string;
  imageUrl?: string;
  stats: PlayerStats;
  projections: PlayerProjections;
  news?: PlayerNews[];
  injuryStatus?: 'healthy' | 'questionable' | 'doubtful' | 'out';
  matchup?: Matchup;
  ownership?: number;
  adp?: number;
  salary?: number;
  fantasyPoints: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PlayerStats {
  season: SeasonStats;
  lastGame?: GameStats;
  last5Games?: GameStats;
  career?: CareerStats;
}

export interface SeasonStats {
  gamesPlayed: number;
  points: number;
  rebounds?: number;
  assists?: number;
  touchdowns?: number;
  yards?: number;
  completions?: number;
  attempts?: number;
  goals?: number;
  saves?: number;
  [key: string]: any;
}

export interface GameStats {
  date: string;
  opponent: string;
  fantasyPoints: number;
  [key: string]: any;
}

export interface CareerStats {
  seasons: number;
  totalGames: number;
  [key: string]: any;
}

export interface PlayerProjections {
  week: number;
  projectedPoints: number;
  floor: number;
  ceiling: number;
  confidence: number;
}

export interface PlayerNews {
  id: string;
  title: string;
  summary: string;
  timestamp: Date;
  source: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  city: string;
  conference?: string;
  division?: string;
  wins: number;
  losses: number;
  ties?: number;
  streak?: string;
  nextGame?: Game;
}

export interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: Date;
  time: string;
  venue: string;
  weather?: Weather;
  spread?: number;
  overUnder?: number;
  tvNetwork?: string;
}

export interface Weather {
  temperature: number;
  condition: string;
  windSpeed: number;
  precipitation: number;
  dome: boolean;
}

export interface League {
  id: string;
  name: string;
  platform: 'yahoo' | 'espn' | 'sleeper' | 'cbs' | 'nfl' | 'custom';
  sport: 'nfl' | 'nba' | 'mlb' | 'nhl';
  scoringType: 'standard' | 'ppr' | 'half-ppr' | 'custom';
  teams: number;
  currentWeek: number;
  myTeam: FantasyTeam;
  standings: Standing[];
  transactions: Transaction[];
  draftDate?: Date;
  playoffWeeks?: number[];
}

export interface FantasyTeam {
  id: string;
  name: string;
  logo?: string;
  owner: string;
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  pointsFor: number;
  pointsAgainst: number;
  standing: number;
  roster: RosterSpot[];
  lineup: Lineup;
  matchup?: Matchup;
}

export interface RosterSpot {
  player: Player;
  position: string;
  acquisitionType: 'draft' | 'waiver' | 'trade' | 'keeper';
  acquisitionDate: Date;
  acquisitionCost?: number;
}

export interface Lineup {
  week: number;
  starters: LineupSlot[];
  bench: LineupSlot[];
  ir?: LineupSlot[];
  totalProjectedPoints: number;
  optimized: boolean;
  locked: boolean;
}

export interface LineupSlot {
  position: string;
  player?: Player;
  lockedIn: boolean;
  projectedPoints: number;
}

export interface Standing {
  rank: number;
  team: FantasyTeam;
  gamesBack: number;
  streak: string;
  trend: 'up' | 'down' | 'stable';
}

export interface Transaction {
  id: string;
  type: 'add' | 'drop' | 'trade' | 'waiver';
  date: Date;
  team: FantasyTeam;
  players: {
    added?: Player[];
    dropped?: Player[];
  };
  cost?: number;
  priority?: number;
  status: 'pending' | 'completed' | 'failed';
}

export interface Matchup {
  week: number;
  homeTeam: FantasyTeam;
  awayTeam: FantasyTeam;
  projectedScore: {
    home: number;
    away: number;
  };
  liveScore?: {
    home: number;
    away: number;
  };
  winProbability: {
    home: number;
    away: number;
  };
}

export interface Notification {
  id: string;
  type: 'injury' | 'trade' | 'score' | 'news' | 'waiver' | 'lineup' | 'achievement';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  data?: any;
}

export interface VoiceCommand {
  command: string;
  aliases: string[];
  action: string;
  parameters?: any;
  examples: string[];
}

export interface ARPlayer {
  player: Player;
  position: {
    x: number;
    y: number;
    z: number;
  };
  scale: number;
  rotation: number;
}

export interface Widget {
  id: string;
  type: 'lineup' | 'scores' | 'standings' | 'players' | 'news';
  size: 'small' | 'medium' | 'large';
  refreshInterval: number;
  configuration: any;
}

export interface WatchData {
  type: 'lineup' | 'score' | 'alert';
  title: string;
  subtitle?: string;
  body?: string;
  timestamp: Date;
  priority: number;
}